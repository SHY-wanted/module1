// lib/receiptOcr.ts — 네이버 CLOVA OCR "커스텀 템플릿(Template OCR)" 응답에서 금액·날짜·상호명·
// 품목(메모)을 뽑아내는 순수 파싱 로직. 실제 API 호출은 app/api/receipt-ocr/route.ts(서버 전용,
// Secret Key를 브라우저에 노출하지 않기 위해 서버에서만 부른다)가 하고, 이 파일은 그 응답 JSON →
// 값 변환만 맡는다.
//
// 2026-09-17: Tesseract.js(브라우저 자체 OCR)에서 네이버 CLOVA OCR로 교체했다(실물 영수증에서
// 금액·날짜·상호명을 제대로 못 읽어서). 처음엔 Naver의 영수증 "특화 모델"(storeInfo·paymentInfo·
// totalPrice 구조)을 쓰려 했으나, 그 모델은 Free 플랜 예외가 없어 매달 기본요금이 청구된다는 걸
// 확인하고(사용자 확인) 대신 무료인 커스텀 도메인 + 템플릿 빌더로 바꿨다. 템플릿 빌더에서 직접 만든
// 필드 이름(store_name·date·total_amount·items_text)이 응답 images[].fields[]에 그대로 나온다 —
// 특화 모델처럼 이미 구조화된 값(formatted.year/month/day 등)을 안 주고 원문 텍스트만 주므로, 금액·
// 날짜 파싱을 이 파일에서 직접 한다.

export interface ParsedReceipt {
  amount: number | null;
  memo: string | null;
  date: string | null; // "YYYY-MM-DD"
}

interface ClovaField {
  name?: string;
  inferText?: string;
}

interface ClovaCustomResponse {
  images?: Array<{
    inferResult?: string;
    fields?: ClovaField[];
  }>;
}

function fieldText(fields: ClovaField[] | undefined, name: string): string | null {
  const text = fields?.find((f) => f.name === name)?.inferText?.trim();
  return text && text.length > 0 ? text : null;
}

// 금액 필드("12,500"·"12500")에서 숫자만 뽑는다.
function extractAmount(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\d+/);
  if (!match) return null;
  const n = parseInt(match[0], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// 날짜 필드에 찍힌 흔한 표기(2026-09-17 · 2026.09.17 · 2026년 9월 17일 등)를 ISO로 바꾼다.
function parseDate(text: string): string | null {
  const match = text.match(/(20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${year}-${pad2(month)}-${pad2(day)}`;
  // 미래 날짜면 OCR 오독으로 보고 버린다(영수증은 항상 과거·오늘 날짜다).
  if (iso > new Date().toISOString().slice(0, 10)) return null;
  return iso;
}

// items_text 박스는 "아메리카노 4,500\n카페라떼 5,000" 처럼 품목+가격이 줄바꿈으로 온다 —
// 각 줄 끝의 가격(숫자·쉼표·"원")을 떼어내고 남는 품목명만 모은다.
function parseItemNames(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/[\d,]+\s*원?\s*$/, "").trim())
    .filter((name) => name.length > 0);
}

/**
 * CLOVA OCR 커스텀 템플릿 응답에서 결제 금액·날짜·상호명(+품목)을 뽑는다. 인식 실패(images/fields가
 * 없음·inferResult FAILURE)면 해당 값이 null — 호출하는 쪽(8b 화면)이 null이면 "확인 필요"·오늘
 * 날짜·0원 등 기본값으로 대신 저장한다(P7: 인식 실패해도 저장은 항상 성공).
 */
export function parseClovaReceipt(response: ClovaCustomResponse): ParsedReceipt {
  const fields = response.images?.[0]?.fields;
  if (!fields) return { amount: null, memo: null, date: null };

  const storeName = fieldText(fields, "store_name");
  const dateText = fieldText(fields, "date");
  const amountText = fieldText(fields, "total_amount");
  const itemsText = fieldText(fields, "items_text");

  const amount = amountText ? extractAmount(amountText) : null;
  const date = dateText ? parseDate(dateText) : null;
  const itemNames = itemsText ? parseItemNames(itemsText) : [];

  // 메모 = 상호명 + 품목 목록(둘 다 있으면 "스타벅스 강남점 · 아메리카노, 카페라떼").
  let memo: string | null = null;
  if (storeName && itemNames.length > 0) memo = `${storeName} · ${itemNames.join(", ")}`;
  else if (storeName) memo = storeName;
  else if (itemNames.length > 0) memo = itemNames.join(", ");

  return { amount, memo, date };
}
