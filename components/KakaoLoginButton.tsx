"use client";
// components/KakaoLoginButton.tsx — 카카오 계정 연동(2026-09-18 신규) 버튼.
// LoginInput·SignupInput 둘 다에서 쓴다 — 카카오 OAuth는 신규/기존 사용자를 안 가려서(처음이면
// Supabase가 알아서 새 계정을 만든다), 두 화면 어디서 눌러도 결과가 같다. 카카오 공식 로그인
// 버튼 가이드대로 배경색(#FEE500)·글자색(#191919)을 고정한다 — var(--shoot-*) 다크모드 토큰을
// 쓰지 않는다(브랜드 버튼은 항상 이 배색이어야 카카오 쪽에서 로그인 버튼으로 인식된다).
import { useState } from "react";
import { useStore } from "@/lib/store";
import { KakaoIcon } from "./icons";

export default function KakaoLoginButton() {
  const store = useStore();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    if (submitting) return;
    setSubmitting(true);
    const result = await store.signInWithKakao();
    // 성공하면 브라우저가 카카오 로그인 화면으로 즉시 이동하므로 이 아래 코드는 실행되지 않는다 —
    // 여기 도달했다는 건 리다이렉트 자체가 실패한 드문 경우다.
    setSubmitting(false);
    if (!result.ok) setError(result.error ?? "카카오 로그인을 시작하지 못했어요");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        onClick={handleClick}
        style={{
          height: 50,
          borderRadius: 16,
          background: "#FEE500",
          color: "#191919",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: 15,
          fontWeight: 800,
          cursor: "pointer",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        <KakaoIcon size={18} color="#191919" />
        카카오로 계속하기
      </div>
      {error && <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B", textAlign: "center" }}>{error}</div>}
    </div>
  );
}
