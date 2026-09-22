"use client";
// components/screens/SignupInput.tsx — 1. 회원가입 입력(design/shoot/SignupInput.dc.html)
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import KakaoLoginButton from "../KakaoLoginButton";
import { MailPlusIcon } from "../icons";

// 07-screens.md "1/1b 회원가입 — 이메일 형식 오류는 입력칸 밑 인라인 오류로 표시"(2026-09-11 팀 결정,
// 2026-09-14에 실제로 구현). 완벽한 RFC 검증이 아니라 "무언가@무언가.무언가" 정도의 단순 형식 체크다.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 2026-09-22 버그 수정: 입력칸에 "8자 이상"이라고 써 있는데 실제로 검사하는 곳이 아무 데도 없어서
// 7자 비밀번호로도 가입이 됐다(Supabase 기본 최소 길이는 6자다). 이메일 형식과 같은 방식으로 입력칸
// 밑 인라인 오류를 띄워 막는다. 서버 쪽 최소 길이는 Supabase 대시보드(Authentication > Providers >
// Email > Minimum password length)에서 8로 올려야 완전히 막힌다 — 화면 검사만으로는 REST를 직접
// 호출하는 경우를 막지 못한다.
const PASSWORD_MIN_LENGTH = 8;

export default function SignupInput() {
  const nav = useNav();
  const store = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // 2026-09-18 추가: 이메일 형식은 emailError(인라인)로, 그 외 실제 signUp 실패(이미 가입된 이메일 등)는
  // 이 전체 오류 문구로 따로 보여준다.
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "60px 24px 26px", textAlign: "center", background: "var(--shoot-surface-alt)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#8C81E0 0%,#6A5ECF 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <MailPlusIcon size={26} color="#fff" />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--shoot-text)" }}>시작해볼까요?</div>
        <div style={{ fontSize: 13, color: "var(--shoot-text-muted)", marginTop: 6, fontWeight: 600 }}>함께 쓰고, 함께 확인해요</div>
      </div>
      <div style={{ flex: 1, padding: "24px 24px 32px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 2026-09-14 팀 결정: 디자인엔 없던 이름 입력칸을 추가한다 — 여기서 받은 이름이 2b(홈)
              "OO님 안녕하세요"·10(마이페이지) 프로필에 그대로 뜬다. 2026-09-18부터는 store.signUp()이
              이 이름을 auth 메타데이터로 넘기고, schema.sql의 handle_new_user() 트리거가 profiles.name에
              그대로 저장한다(store.updateCurrentUserName을 거치지 않는다). */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 7 }}>이름</div>
            <input
              type="text"
              placeholder="이름을 입력해주세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: "2px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 7 }}>이메일</div>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: `2px solid ${emailError ? "#E8B4B4" : "var(--shoot-border)"}`, background: "var(--shoot-surface)", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)" }}
            />
            {emailError && <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B", marginTop: 6 }}>{emailError}</div>}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 7 }}>비밀번호</div>
            <input
              type="password"
              placeholder="8자 이상"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null); // 고치는 중에는 오류를 지운다(이메일 칸과 같은 감각)
              }}
              style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: `2px solid ${passwordError ? "#E8B4B4" : "var(--shoot-border)"}`, background: "var(--shoot-surface)", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)" }}
            />
            {passwordError && <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B", marginTop: 6 }}>{passwordError}</div>}
          </div>
        </div>
        {/* 07-screens.md "1/1b 회원가입 — 비밀번호 8자 미만 검증 실패 화면이 디자인에 없다"였던 자리 —
            2026-09-22에 이메일 형식과 같은 인라인 오류 방식으로 채웠다. 그 외 실패(이미 가입된 이메일 등)는
            계속 formError로 보여준다. */}
        {formError && (
          <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: "#B23B3B", textAlign: "center" }}>{formError}</div>
        )}
        <div
          onClick={async () => {
            if (submitting) return;
            if (!EMAIL_PATTERN.test(email.trim())) {
              setEmailError("이메일 형식이 올바르지 않아요");
              return;
            }
            if (password.length < PASSWORD_MIN_LENGTH) {
              setPasswordError(`비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 해요`);
              return;
            }
            setPasswordError(null);
            setFormError(null);
            setSubmitting(true);
            // 2026-09-18 추가: 실제 Supabase Auth로 회원가입 — name은 handle_new_user() 트리거가
            // profiles.name에 그대로 넣는다(supabase/schema.sql 참고).
            const result = await store.signUp(name, email, password);
            setSubmitting(false);
            if (!result.ok) {
              setFormError(result.error ?? "회원가입에 실패했어요");
              return;
            }
            nav.goAuthScreen("signupSuccess");
          }}
          style={{ marginTop: 22, height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer", opacity: submitting ? 0.6 : 1 }}
        >
          가입하기
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--shoot-border)" }} />
          <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", fontWeight: 600 }}>또는</div>
          <div style={{ flex: 1, height: 1, background: "var(--shoot-border)" }} />
        </div>
        <KakaoLoginButton />

        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--shoot-text-muted)", fontWeight: 600 }}>
          이미 계정이 있으신가요?{" "}
          <span style={{ color: "var(--shoot-accent)", fontWeight: 800, cursor: "pointer" }} onClick={() => nav.goAuthScreen("loginInput")}>
            로그인
          </span>
        </div>
      </div>
    </div>
  );
}
