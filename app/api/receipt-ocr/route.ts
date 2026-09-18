// app/api/receipt-ocr/route.ts — 영수증 이미지를 네이버 CLOVA OCR(영수증 전용 도메인)로 넘기는
// 서버 전용 프록시. Secret Key(CLOVA_OCR_SECRET_KEY)를 브라우저에 절대 노출하지 않기 위해 반드시
// 서버(이 Route Handler)에서만 호출한다 — 클라이언트(components/screens/ReceiptProcessing.tsx)는
// 이미지 파일만 여기로 올리고, 이미 파싱된 {amount, memo, date}만 돌려받는다.
import { parseClovaReceipt } from "@/lib/receiptOcr";

const INVOKE_URL = process.env.CLOVA_OCR_INVOKE_URL;
const SECRET_KEY = process.env.CLOVA_OCR_SECRET_KEY;

// CLOVA OCR이 지원하는 이미지 포맷만 허용한다(HEIC 등은 지원 목록 밖 — 실패하면 P7이 "확인 필요"로 처리).
const FORMAT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/tiff": "tiff",
};

export async function POST(request: Request) {
  if (!INVOKE_URL || !SECRET_KEY) {
    return Response.json({ error: "CLOVA_OCR_INVOKE_URL / CLOVA_OCR_SECRET_KEY가 설정되지 않았어요" }, { status: 500 });
  }

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return Response.json({ error: "이미지가 없어요" }, { status: 400 });
  }
  const format = FORMAT_BY_MIME[file.type];
  if (!format) {
    return Response.json({ error: "지원하지 않는 이미지 형식이에요" }, { status: 400 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  let clovaRes: Response;
  try {
    clovaRes = await fetch(INVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-OCR-SECRET": SECRET_KEY },
      body: JSON.stringify({
        version: "V2",
        requestId: crypto.randomUUID(),
        timestamp: Date.now(),
        images: [{ format, name: "receipt", data: base64 }],
      }),
    });
  } catch (err) {
    // 원인 진단용 — 이 API를 호출한 브라우저(휴대폰)엔 이 로그가 안 보이니, 서버(dev 터미널) 로그로 확인한다.
    console.error("[receipt-ocr] fetch to CLOVA OCR failed:", err);
    return Response.json({ error: "CLOVA OCR 서버에 연결하지 못했어요" }, { status: 502 });
  }

  const bodyText = await clovaRes.text();
  if (!clovaRes.ok) {
    console.error(`[receipt-ocr] CLOVA OCR returned ${clovaRes.status}:`, bodyText);
    return Response.json({ error: `CLOVA OCR 요청 실패 (${clovaRes.status})` }, { status: 502 });
  }

  const json = JSON.parse(bodyText);
  const parsed = parseClovaReceipt(json);
  if (parsed.amount === null) {
    // 성공 응답인데도 금액을 못 뽑아낸 경우 — 실제 CLOVA 응답 구조를 보고 원인을 잡기 위해 그대로 로그.
    console.error("[receipt-ocr] parsed amount is null, raw CLOVA response:", JSON.stringify(json));
  }
  return Response.json(parsed);
}
