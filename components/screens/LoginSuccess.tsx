"use client";
// components/screens/LoginSuccess.tsx — 2a. 로그인 성공(design/shoot/LoginSuccess.dc.html)
//
// 2026-09-17 팀 결정: SignupSuccess(1b)와 같은 이유로 중복 제출을 없앤다 — 2(로그인 입력)에서 이미 이메일을
// 저장했으므로, 여기서 다시 입력받지 않는다. "로그인 성공했습니다!" 토스트를 잠깐 띄운 뒤 자동으로
// 2b(홈)로 들어간다(07-screens.md "2a 로그인 성공 → 2b" 결정은 그대로 유지 — 목적지는 안 바뀜, 두 번 눌러야
// 하던 것만 고침).
import { useEffect } from "react";
import { useNav } from "../NavContext";
import { CheckIcon, LogInIcon } from "../icons";

const SUCCESS_DELAY_MS = 1300;

export default function LoginSuccess() {
  const nav = useNav();

  // 2026-09-18 변경: 실제 세션은 2(로그인 입력)의 store.signIn()이 이미 만들어 놨다 — 여기선
  // 화면만 잠깐 보여주고 홈으로 넘어간다.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      nav.enterApp();
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
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--shoot-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LogInIcon size={24} color="#fff" />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--shoot-text)" }}>다시 만나서 반가워요</div>
        <div style={{ fontSize: 13, color: "var(--shoot-text-muted)", marginTop: 6, fontWeight: 600 }}>홈으로 이동할게요</div>
      </div>
      {/* "잠깐 떴다 사라지는" 알림창 형식 — 이 화면 자체가 SUCCESS_DELAY_MS 뒤에 사라지므로 별도 hide 로직 없이도
          토스트가 오래 남아있지 않는다. */}
      <div style={{ background: "#2D2A3E", borderRadius: 14, padding: "12px 20px", display: "flex", alignItems: "center", gap: 8 }}>
        <CheckIcon size={16} color="#9FE0CB" strokeWidth={2.4} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>로그인 성공했습니다!</span>
      </div>
    </div>
  );
}
