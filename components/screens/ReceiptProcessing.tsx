"use client";
// components/screens/ReceiptProcessing.tsx — 8b. 영수증 인식 중(design/shoot/ReceiptProcessing.dc.html)
// 2026-09-17: Tesseract.js(브라우저 자체 OCR)를 실물 영수증에서 금액·날짜·상호명을 자꾸 잘못 읽어서
// 네이버 CLOVA OCR 영수증 전용 도메인으로 교체했다(사용자 확인) — app/api/receipt-ocr가 Secret Key를
// 서버에만 두고 대신 호출해준다. P7 원칙(인식에 실패해도 저장 자체는 항상 성공, category="확인 필요")은
// 그대로 유지한다 — 이미지가 없거나 OCR이 실패해도 amount=0으로 저장하고 넘어간다
// (07-screens.md "8b 인식 완료 → 7로, 8a·8b 둘 다 pop" — 2026-09-11 팀 결정, 그대로 유지).
import { useEffect, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { TODAY_DATE } from "@/lib/mock";
import type { ParsedReceipt } from "@/lib/receiptOcr";
import { fileToCompressedDataUrl } from "@/lib/image";
import { CheckIcon, ChevronLeftIcon } from "../icons";

// OCR이 실제로 끝난 뒤에도 "인식 완료" 카드를 잠깐 보여주고 넘어간다(원래 디자인의 딜레이 느낌 유지).
const RESULT_HOLD_MS = 900;

export default function ReceiptProcessing() {
  const nav = useNav();
  const store = useStore();
  const [result, setResult] = useState<{ amount: number; memo: string } | null>(null);

  useEffect(() => {
    let active = true;
    const image = store.pendingReceiptImage;

    async function run() {
      let amount = 0;
      let memo = "확인 필요";
      let date = TODAY_DATE;

      if (image) {
        try {
          const formData = new FormData();
          formData.append("image", image, image.name || "receipt.jpg");
          const res = await fetch("/api/receipt-ocr", { method: "POST", body: formData });
          if (res.ok) {
            const parsed: ParsedReceipt = await res.json();
            if (parsed.amount !== null) amount = parsed.amount;
            if (parsed.memo !== null) memo = parsed.memo;
            if (parsed.date !== null) date = parsed.date;
          }
        } catch {
          // P7: 인식 실패해도 저장 자체는 실패시키지 않는다 — amount 0 · "확인 필요"로 그대로 진행.
        }
      }
      if (!active) return;
      setResult({ amount, memo });

      // 신규 기능: 영수증 원본을 나중에 다시 볼 수 있도록 압축한 data URL을 image_url에 저장한다
      // (Storage 버킷 없이 profiles.avatar_url과 같은 방식 — lib/image.ts 참고). 압축이 실패해도
      // P7 원칙(인식 실패해도 저장 자체는 항상 성공)은 그대로 유지 — image_url만 null로 남긴다.
      // 2026-09-21 버그 수정: 실패해도 console.error만 남기고 화면엔 아무 표시가 없어서, 갤러리에서
      // 불러온 사진(HEIC 등 브라우저가 못 읽는 포맷일 수 있음)이 조용히 저장 안 돼도 사용자는 몰랐다
      // — 이제 실패하면 토스트로 알려준다(저장 자체는 그대로 성공).
      let imageUrl: string | null = null;
      if (image) {
        try {
          imageUrl = await fileToCompressedDataUrl(image);
        } catch (err) {
          console.error(`[receipt-ocr] image compression failed (type=${image.type}, size=${image.size}):`, err);
          store.showToast("영수증 사진은 저장하지 못했어요 (지출 기록은 저장돼요)");
        }
      }

      // P7: 인식에 실패했다고 해서 저장 자체를 실패시킬 수 없다 — 항상 category="확인 필요"로 저장은 성공한다.
      const saveResult = await store.addExpense({
        user_id: store.currentUserId,
        group_id: null,
        amount,
        category: "확인 필요",
        memo,
        date,
        source_type: "RECEIPT",
        image_url: imageUrl,
        is_shared: false,
        recurring_expense_id: null,
      });
      // P3 "데일리 먹이주기 팝업" — 영수증으로 기록한 것도 "지출을 하나라도 기록한 직후"에 해당한다.
      if (saveResult.ok) store.openFeedPopupIfEligible();
      store.setPendingReceiptImage(null);

      window.setTimeout(() => {
        if (active) nav.resetStackToTab("expenses");
      }, RESULT_HOLD_MS);
    }

    run();
    return () => {
      active = false;
    };
    // 마운트 시 한 번만 — 끝나면 8a·8b 둘 다 pop하고 지출내역 탭(7)으로 이동한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", padding: "20px 18px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", backgroundColor: "#0D0D1A" }}>
      <div
        onClick={() => nav.back()}
        style={{ position: "absolute", top: 20, left: 18, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <ChevronLeftIcon size={18} color="#fff" />
      </div>
      <div className="shoot-spin" style={{ width: 56, height: 56, borderRadius: "50%", border: "4px solid #CD8FF640", borderTopColor: "#6FC5BA" }} />
      <div style={{ fontSize: 15, color: "#fff", fontWeight: 800, marginTop: 18 }}>영수증을 읽고 있어요...</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6, fontWeight: 600 }}>AI가 금액과 항목을 분석 중이에요</div>
      {result && (
        <div style={{ position: "absolute", bottom: 50, left: 18, right: 18, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 10px 26px rgba(106,94,207,0.35)" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(63,52,128,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckIcon size={15} color="#3F3480" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#3F3480" }}>인식 완료!</div>
            <div style={{ fontSize: 12, color: "rgba(63,52,128,0.75)", marginTop: 2, fontWeight: 600 }}>
              ₩{result.amount.toLocaleString("ko-KR")} · 확인 필요 · {result.memo}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
