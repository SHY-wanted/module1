"use client";
// components/screens/GroupJoin.tsx — 4. 그룹 참여(design/shoot/GroupJoin.dc.html)
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { LogInIcon } from "../icons";

export default function GroupJoin() {
  const nav = useNav();
  const store = useStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (code.trim().length === 0) return;
    const result = store.joinGroupByInviteCode(code);
    if (result.ok) {
      // 07-screens.md "4 '참여하기'(성공) → 5a로 복귀" — 2026-09-11 팀 결정. GroupJoin은 5a "초대 코드로
      // 참여하기"에서만 열리므로 뒤로가기(스택 pop) 한 번으로 5a에 돌아간다.
      nav.back();
      return;
    }
    // 예외(2026-09-11 팀 결정): "코드 없음"·"이미 참여한 그룹"(P3, 409) 모두 입력칸 밑 인라인 오류로 표시,
    // 화면 전환 없음.
    if (result.reason === "not_found") setError("존재하지 않는 초대 코드예요.");
    else if (result.reason === "already_member") setError("이미 참여한 그룹이에요.");
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "20px 24px 32px", textAlign: "center", background: "#F0EEFF" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#6A5ECF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <LogInIcon size={24} color="#ffffff" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#2D2A3E" }}>그룹에 참여하기</div>
        <div style={{ fontSize: 13, color: "#6B6980", marginTop: 6, fontWeight: 600, lineHeight: 1.5 }}>
          초대 코드를 입력하면
          <br />
          바로 참여할 수 있어요
        </div>
      </div>
      <div style={{ flex: 1, padding: "28px 24px 32px", display: "flex", flexDirection: "column" }}>
        <input
          type="text"
          placeholder="코드 입력 (예: CP-4K9X)"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          style={{ width: "100%", boxSizing: "border-box", height: 54, borderRadius: 16, border: "2px solid #E8E4F4", background: "#fff", padding: "0 18px", fontSize: 16, fontWeight: 800, color: "#2D2A3E", textAlign: "center", letterSpacing: 2, fontFamily: "'Courier New',monospace" }}
        />
        {error && <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: "#B23B3B", textAlign: "center" }}>{error}</div>}
        <div style={{ flex: 1 }} />
        <div
          onClick={handleSubmit}
          style={{ height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer" }}
        >
          참여하기
        </div>
      </div>
    </div>
  );
}
