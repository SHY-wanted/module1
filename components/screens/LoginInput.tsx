"use client";
// components/screens/LoginInput.tsx — 2. 로그인 입력(design/shoot/LoginInput.dc.html)
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import KakaoLoginButton from "../KakaoLoginButton";
import { LogInIcon } from "../icons";

export default function LoginInput() {
  const nav = useNav();
  const store = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 2026-09-18 추가: 실제 supabase.auth.signInWithPassword로 검증한다.
  // [?] "로그인 상태 유지"(keepLoggedIn) 체크는 07-screens.md에 동작 차이가 정의돼 있지 않아, 아직
  // Supabase 세션 만료 설정과 연결하지 않았다 — 항상 Supabase 기본 세션 유지 방식을 따른다.
  async function handleSubmit() {
    if (submitting) return;
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해주세요");
      return;
    }
    setSubmitting(true);
    const result = await store.signIn(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "이메일 또는 비밀번호가 맞지 않아요");
      return;
    }
    nav.goAuthScreen("loginSuccess");
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "60px 24px 26px", textAlign: "center", background: "var(--shoot-surface-alt)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--shoot-accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <LogInIcon size={24} color="#fff" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--shoot-text)" }}>다시 만나서 반가워요</div>
        <div style={{ fontSize: 13, color: "var(--shoot-text-muted)", marginTop: 6, fontWeight: 600 }}>로그인하고 가계부를 확인해보세요</div>
      </div>
      <div style={{ flex: 1, padding: "24px 24px 32px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 7 }}>이메일</div>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: `2px solid ${error ? "#E8B4B4" : "var(--shoot-border)"}`, background: "var(--shoot-surface)", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 7 }}>비밀번호</div>
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: `2px solid ${error ? "#E8B4B4" : "var(--shoot-border)"}`, background: "var(--shoot-surface)", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)" }}
            />
          </div>
          {error && <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B" }}>{error}</div>}
        </div>
        <div style={{ textAlign: "right", marginTop: 10 }}>
          <span style={{ fontSize: 12, color: "var(--shoot-text-muted)", fontWeight: 700, cursor: "pointer" }} onClick={() => nav.goAuthScreen("passwordResetInput")}>
            비밀번호를 잊으셨나요?
          </span>
        </div>
        <div onClick={() => setKeepLoggedIn((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, cursor: "pointer" }}>
          <div style={{ width: 42, height: 24, borderRadius: 12, background: keepLoggedIn ? "var(--shoot-accent)" : "#D8D3C8", position: "relative", transition: "background 0.15s" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--shoot-surface)", position: "absolute", top: 3, left: keepLoggedIn ? 21 : 3, boxShadow: "0 2px 5px rgba(0,0,0,0.2)", transition: "left 0.15s" }} />
          </div>
          <div style={{ fontSize: 13, color: "var(--shoot-text)", fontWeight: 700 }}>로그인 상태 유지</div>
        </div>
        <div
          onClick={handleSubmit}
          style={{ marginTop: 20, height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer", opacity: submitting ? 0.6 : 1 }}>
          로그인
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--shoot-border)" }} />
          <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", fontWeight: 600 }}>또는</div>
          <div style={{ flex: 1, height: 1, background: "var(--shoot-border)" }} />
        </div>
        <KakaoLoginButton />

        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--shoot-text-muted)", fontWeight: 600 }}>
          계정이 없으신가요?{" "}
          <span style={{ color: "var(--shoot-accent)", fontWeight: 800, cursor: "pointer" }} onClick={() => nav.goAuthScreen("signupInput")}>
            회원가입
          </span>
        </div>
      </div>
    </div>
  );
}
