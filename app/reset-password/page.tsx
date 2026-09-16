"use client";
// app/reset-password/page.tsx — "비밀번호를 잊으셨나요?" 이메일 링크가 실제로 열리는 곳(2026-09-22
// 팀 요청으로 신규). AppShell의 SPA(단일 "/" 라우트) 밖에 있는 독립 Next.js 페이지다 — 이유는 Supabase가
// 재설정 링크를 열면 이 페이지의 URL에 세션 정보를 실어 보내기 때문에, 로그인 전/후 상태를 다루는
// AppShell의 화면 전환 상태(authScreen)와는 완전히 분리해서 다루는 게 자연스럽다.
//
// 링크를 열면 @supabase/ssr의 브라우저 클라이언트가 URL의 코드를 자동으로 세션과 교환한다
// (detectSessionInUrl 기본값 true) — 그 세션이 잡히면 새 비밀번호 입력 폼을 보여주고,
// supabase.auth.updateUser({password})로 실제로 바꾼다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/store";

type Status = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createClient());
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setStatus((prev) => (prev === "checking" ? (data.session ? "ready" : "invalid") : prev));
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setStatus("ready");
    });
    // 링크가 아예 잘못됐거나 만료된 경우 getSession()도 세션을 못 주므로, 잠깐 기다렸다가
    // 그때까지 세션이 없으면 "유효하지 않음"으로 확정한다.
    const timer = window.setTimeout(() => {
      setStatus((prev) => (prev === "checking" ? "invalid" : prev));
    }, 2500);
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, [supabase]);

  async function handleSubmit() {
    if (submitting) return;
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 서로 달라요");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(translateAuthError(updateError.message));
      return;
    }
    setStatus("done");
  }

  return (
    <div
      style={{
        height: "100dvh",
        width: "100%",
        boxSizing: "border-box",
        background: "var(--shoot-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 360, background: "var(--shoot-surface)", borderRadius: 22, border: "1px solid var(--shoot-border)", padding: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)", textAlign: "center" }}>새 비밀번호 설정</div>

        {status === "checking" && (
          <div style={{ marginTop: 18, fontSize: 13, color: "var(--shoot-text-muted)", fontWeight: 600, textAlign: "center" }}>
            링크를 확인하고 있어요...
          </div>
        )}

        {status === "invalid" && (
          <div style={{ marginTop: 18, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--shoot-text-muted)", fontWeight: 600, lineHeight: 1.6 }}>
              유효하지 않거나 만료된 링크예요. 로그인 화면에서 재설정 이메일을 다시 요청해주세요.
            </div>
            <Link href="/" style={{ display: "inline-block", marginTop: 16, fontSize: 13, color: "var(--shoot-accent)", fontWeight: 800 }}>
              로그인 화면으로 가기
            </Link>
          </div>
        )}

        {status === "ready" && (
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 7 }}>새 비밀번호</div>
              <input
                type="password"
                placeholder="6자 이상"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: `2px solid ${error ? "#E8B4B4" : "var(--shoot-border)"}`, background: "var(--shoot-bg)", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 7 }}>새 비밀번호 확인</div>
              <input
                type="password"
                placeholder="다시 입력해주세요"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: `2px solid ${error ? "#E8B4B4" : "var(--shoot-border)"}`, background: "var(--shoot-bg)", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)" }}
              />
            </div>
            {error && <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B" }}>{error}</div>}
            <div
              onClick={handleSubmit}
              style={{ height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer", opacity: submitting ? 0.6 : 1 }}
            >
              비밀번호 변경하기
            </div>
          </div>
        )}

        {status === "done" && (
          <div style={{ marginTop: 18, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--shoot-text-muted)", fontWeight: 600 }}>비밀번호가 바뀌었어요. 새 비밀번호로 로그인해주세요.</div>
            <Link href="/" style={{ display: "inline-block", marginTop: 16, fontSize: 13, color: "var(--shoot-accent)", fontWeight: 800 }}>
              로그인하러 가기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
