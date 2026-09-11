"use client";
// components/screens/SignupSuccess.tsx — 1b. 회원가입 성공(design/shoot/SignupSuccess.dc.html)
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { CheckIcon, MailPlusIcon } from "../icons";

export default function SignupSuccess() {
  const nav = useNav();
  const store = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "60px 24px 26px", textAlign: "center", background: "#F0EEFF" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#8C81E0 0%,#6A5ECF 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <MailPlusIcon size={26} color="#fff" />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#2D2A3E" }}>시작해볼까요?</div>
        <div style={{ fontSize: 13, color: "#6B6980", marginTop: 6, fontWeight: 600 }}>함께 쓰고, 함께 확인해요</div>
      </div>
      <div style={{ flex: 1, padding: "24px 24px 32px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2A3E", marginBottom: 7 }}>이메일</div>
            <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: "2px solid #E8E4F4", background: "#fff", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "#2D2A3E" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2A3E", marginBottom: 7 }}>비밀번호</div>
            <input type="password" placeholder="8자 이상" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: "2px solid #E8E4F4", background: "#fff", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "#2D2A3E" }} />
          </div>
        </div>
        {/* 07-screens.md "1b '가입하기'(재확인 후) → 2b(홈)로 자동 로그인" — 2026-09-11 팀 결정.
            GroupCreateDone "홈으로 가기"와 같은 패턴: 로그인 처리 후 스택을 비우고 홈 탭으로 들어간다. */}
        <div
          onClick={() => {
            store.setLoggedIn(true);
            nav.enterApp();
          }}
          style={{ marginTop: 22, height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer" }}
        >
          가입하기
        </div>
        <div style={{ marginTop: 12, background: "#2D2A3E", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckIcon size={16} color="#9FE0CB" strokeWidth={2.4} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>회원가입 성공했습니다!</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "center", fontSize: 13, color: "#6B6980", fontWeight: 600 }}>
          이미 계정이 있으신가요?{" "}
          <span style={{ color: "#6A5ECF", fontWeight: 800, cursor: "pointer" }} onClick={() => nav.goAuthScreen("loginInput")}>
            로그인
          </span>
        </div>
      </div>
    </div>
  );
}
