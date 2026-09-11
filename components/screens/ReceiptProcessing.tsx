"use client";
// components/screens/ReceiptProcessing.tsx — 8b. 영수증 인식 중(design/shoot/ReceiptProcessing.dc.html)
// 실제 OCR 연동은 없다(이번 범위 아님) — 일정 시간 뒤 mock 지출 하나를 추가하고 7(지출 목록)로 이동한다
// (07-screens.md "8b 인식 완료 → 7로, 8a·8b 둘 다 pop" — 2026-09-11 팀 결정).
import { useEffect } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { TODAY_DATE } from "@/lib/mock";
import { CheckIcon, ChevronLeftIcon } from "../icons";

const PROCESSING_DELAY_MS = 1800;

export default function ReceiptProcessing() {
  const nav = useNav();
  const store = useStore();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // P7: 인식에 실패했다고 해서 저장 자체를 실패시킬 수 없다 — 항상 category="확인 필요"로 저장은 성공한다.
      store.addExpense({
        user_id: store.currentUserId,
        group_id: null,
        amount: 12500,
        category: "확인 필요",
        memo: "스타벅스",
        date: TODAY_DATE,
        source_type: "RECEIPT",
        image_url: null,
        is_shared: false,
      });
      nav.resetStackToTab("expenses");
    }, PROCESSING_DELAY_MS);
    return () => window.clearTimeout(timer);
    // 마운트 시 한 번만 — 타이머가 끝나면 8a·8b 둘 다 pop하고 지출내역 탭(7)으로 이동한다.
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
      <div style={{ position: "absolute", bottom: 50, left: 18, right: 18, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 10px 26px rgba(106,94,207,0.35)" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(63,52,128,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CheckIcon size={15} color="#3F3480" strokeWidth={2.4} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#3F3480" }}>인식 완료!</div>
          <div style={{ fontSize: 12, color: "rgba(63,52,128,0.75)", marginTop: 2, fontWeight: 600 }}>₩12,500 · 식비 · 스타벅스</div>
        </div>
      </div>
    </div>
  );
}
