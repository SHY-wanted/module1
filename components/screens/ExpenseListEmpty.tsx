"use client";
// components/screens/ExpenseListEmpty.tsx — 7b. 지출 목록 — 빈 상태(design/shoot/ExpenseListEmpty.dc.html)
import { useNav } from "../NavContext";
import { CameraIcon, ListIcon } from "../icons";

export default function ExpenseListEmpty() {
  const nav = useNav();
  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 0", flexShrink: 0, fontSize: 22, fontWeight: 800, color: "#2D2A3E" }}>지출 내역</div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 20px", overflowY: "auto" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F0EEFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ListIcon size={30} color="#6A5ECF" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#2D2A3E", marginTop: 18 }}>아직 지출 내역이 없어요</div>
        <div style={{ fontSize: 13, color: "#6B6980", marginTop: 8, fontWeight: 600, lineHeight: 1.5 }}>
          영수증을 촬영하면 AI가 금액과
          <br />
          항목을 자동으로 채워드려요
        </div>
        {/* 07-screens.md "7b '영수증으로 기록하기' → 8a" — 2026-09-11 팀 결정. */}
        <div
          onClick={() => nav.push({ id: "receiptCapture" })}
          style={{ marginTop: 22, height: 48, padding: "0 22px", borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer" }}
        >
          <CameraIcon size={16} color="#3F3480" />
          영수증으로 기록하기
        </div>
      </div>
    </div>
  );
}
