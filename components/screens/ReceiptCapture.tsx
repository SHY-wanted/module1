"use client";
// components/screens/ReceiptCapture.tsx — 8a. 영수증 촬영(design/shoot/ReceiptCapture.dc.html)
// 실제 카메라·OCR 연동은 하지 않는다(이번 범위 아님, Supabase 미연결) — 촬영 버튼을 누르면 8b로 넘어간다.
import { useNav } from "../NavContext";
import { CameraIcon, ChevronLeftIcon, ImageIcon, RefreshIcon } from "../icons";

export default function ReceiptCapture() {
  const nav = useNav();
  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", padding: "20px 18px 24px", background: "#0D0D1A", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", display: "flex", alignItems: "center", marginBottom: 14 }}>
        <div
          onClick={() => nav.back()}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ChevronLeftIcon size={18} color="#fff" />
        </div>
      </div>
      <div style={{ width: "100%", flex: 1, borderRadius: 20, border: "2px dashed #8574EB80", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600, textAlign: "center", lineHeight: 1.6 }}>
          영수증을 네모 안에
          <br />
          맞춰주세요
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, marginTop: 20 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ImageIcon size={20} color="rgba(255,255,255,0.85)" />
        </div>
        {/* 08b(인식 중)로 이동 — 실제 촬영은 없고 mock 흐름만 이어간다. */}
        <div
          onClick={() => nav.push({ id: "receiptProcessing" })}
          style={{ width: 66, height: 66, borderRadius: "50%", background: "#fff", border: "4px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <div style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#3F3480" }}>
            <CameraIcon size={22} color="#fff" />
          </div>
        </div>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <RefreshIcon size={20} color="rgba(255,255,255,0.85)" />
        </div>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 14, fontWeight: 600 }}>촬영하거나 갤러리에서 선택하세요</div>
    </div>
  );
}
