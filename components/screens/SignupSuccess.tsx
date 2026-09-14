"use client";
// components/screens/SignupSuccess.tsx — 1b. 회원가입 성공(design/shoot/SignupSuccess.dc.html)
//
// 2026-09-17 팀 결정: 원래는 여기서 이메일·비밀번호를 다시 입력하고 "가입하기"를 한 번 더 눌러야
// 다음으로 넘어갔다 — 사용자 입장에서 "성공했다면서 왜 또 제출해야 하지?"로 느껴지는 버그였다.
// 1(회원가입 — 입력)에서 이미 이름·이메일을 저장했으므로, 이 화면은 이제 폼을 다시 보여주지 않고
// "회원가입 성공했습니다!" 토스트를 잠깐 띄운 뒤 자동으로 2(로그인 입력)로 넘어간다(팀 확인: 2b 자동
// 로그인이 아니라 2로 이동 — 07-screens.md의 기존 "1b→2b 자동 로그인" 결정을 대체함).
import { useEffect } from "react";
import { useNav } from "../NavContext";
import { CheckIcon, MailPlusIcon } from "../icons";

const SUCCESS_DELAY_MS = 1300;

export default function SignupSuccess() {
  const nav = useNav();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      nav.goAuthScreen("loginInput");
    }, SUCCESS_DELAY_MS);
    return () => window.clearTimeout(timer);
    // 마운트 시 한 번만 예약하면 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        background: "var(--shoot-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 18,
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#8C81E0 0%,#6A5ECF 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MailPlusIcon size={26} color="#fff" />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--shoot-text)" }}>환영해요!</div>
        <div style={{ fontSize: 13, color: "var(--shoot-text-muted)", marginTop: 6, fontWeight: 600 }}>로그인 화면으로 이동할게요</div>
      </div>
      {/* "잠깐 떴다 사라지는" 알림창 형식 — 이 화면 자체가 SUCCESS_DELAY_MS 뒤에 사라지므로 별도 hide 로직 없이도
          토스트가 오래 남아있지 않는다. */}
      <div style={{ background: "#2D2A3E", borderRadius: 14, padding: "12px 20px", display: "flex", alignItems: "center", gap: 8 }}>
        <CheckIcon size={16} color="#9FE0CB" strokeWidth={2.4} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>회원가입 성공했습니다!</span>
      </div>
    </div>
  );
}
