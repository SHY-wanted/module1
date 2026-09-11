"use client";
// components/screens/LoginInput.tsx — 2. 로그인 입력(design/shoot/LoginInput.dc.html)
import { useState } from "react";
import { useNav } from "../NavContext";
import { LogInIcon } from "../icons";

export default function LoginInput() {
  const nav = useNav();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "60px 24px 26px", textAlign: "center", background: "#F0EEFF" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#6A5ECF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <LogInIcon size={24} color="#fff" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#2D2A3E" }}>다시 만나서 반가워요</div>
        <div style={{ fontSize: 13, color: "#6B6980", marginTop: 6, fontWeight: 600 }}>로그인하고 가계부를 확인해보세요</div>
      </div>
      <div style={{ flex: 1, padding: "24px 24px 32px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2A3E", marginBottom: 7 }}>이메일</div>
            <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: "2px solid #E8E4F4", background: "#fff", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "#2D2A3E" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2A3E", marginBottom: 7 }}>비밀번호</div>
            <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: "2px solid #E8E4F4", background: "#fff", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "#2D2A3E" }} />
          </div>
        </div>
        <div onClick={() => setKeepLoggedIn((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, cursor: "pointer" }}>
          <div style={{ width: 42, height: 24, borderRadius: 12, background: keepLoggedIn ? "#6A5ECF" : "#D8D3C8", position: "relative", transition: "background 0.15s" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: keepLoggedIn ? 21 : 3, boxShadow: "0 2px 5px rgba(0,0,0,0.2)", transition: "left 0.15s" }} />
          </div>
          <div style={{ fontSize: 13, color: "#2D2A3E", fontWeight: 700 }}>로그인 상태 유지</div>
        </div>
        {/* 예외: [?] 07-screens.md "2 로그인 — 로그인 실패(비밀번호 틀림 등) 화면이 디자인에 없다".
            임시로 유효성 검증 없이 항상 성공 처리한다. */}
        <div onClick={() => nav.goAuthScreen("loginSuccess")} style={{ marginTop: 20, height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer" }}>
          로그인
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "center", fontSize: 13, color: "#6B6980", fontWeight: 600 }}>
          계정이 없으신가요?{" "}
          <span style={{ color: "#6A5ECF", fontWeight: 800, cursor: "pointer" }} onClick={() => nav.goAuthScreen("signupInput")}>
            회원가입
          </span>
        </div>
      </div>
    </div>
  );
}
