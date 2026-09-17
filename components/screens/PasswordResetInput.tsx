"use client";
// components/screens/PasswordResetInput.tsx — "비밀번호를 잊으셨나요?" 진입 화면. 디자인 파일 없음
// (2026-09-22 팀 요청으로 신규) — 2(로그인 입력) 하단 링크에서 goAuthScreen으로 들어온다.
// 실제 supabase.auth.resetPasswordForEmail로 이메일에 재설정 링크를 보낸다 — 링크를 열면
// app/reset-password(이 SPA 밖의 별도 Next.js 라우트)에서 새 비밀번호를 입력한다.
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { LogInIcon } from "../icons";

export default function PasswordResetInput() {
  const nav = useNav();
  const store = useStore();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (submitting || !email.trim()) return;
    setSubmitting(true);
    const result = await store.sendPasswordResetEmail(email);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "재설정 이메일을 보내지 못했어요");
      return;
    }
    setSent(true);
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "60px 24px 26px", textAlign: "center", background: "var(--shoot-surface-alt)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--shoot-accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <LogInIcon size={24} color="#fff" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--shoot-text)" }}>비밀번호를 잊으셨나요?</div>
        <div style={{ fontSize: 13, color: "var(--shoot-text-muted)", marginTop: 6, fontWeight: 600 }}>가입한 이메일로 재설정 링크를 보내드려요</div>
      </div>
      <div style={{ flex: 1, padding: "24px 24px 32px", display: "flex", flexDirection: "column" }}>
        {sent ? (
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--shoot-text)" }}>이메일을 확인해주세요</div>
            <div style={{ fontSize: 13, color: "var(--shoot-text-muted)", marginTop: 8, fontWeight: 600, lineHeight: 1.6 }}>
              {email}(으)로 비밀번호 재설정 링크를 보냈어요. 메일함(스팸함 포함)에서 링크를 눌러 새 비밀번호를 설정해주세요.
            </div>
          </div>
        ) : (
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
            {error && <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B" }}>{error}</div>}
            <div
              onClick={handleSubmit}
              style={{ height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer", opacity: submitting || !email.trim() ? 0.6 : 1 }}
            >
              재설정 링크 보내기
            </div>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--shoot-text-muted)", fontWeight: 600 }}>
          <span style={{ color: "var(--shoot-accent)", fontWeight: 800, cursor: "pointer" }} onClick={() => nav.goAuthScreen("loginInput")}>
            로그인으로 돌아가기
          </span>
        </div>
      </div>
    </div>
  );
}
