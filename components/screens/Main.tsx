"use client";
// components/screens/Main.tsx — 0. 스플래시(design/shoot/Main.dc.html)
import Image from "next/image";
import { useEffect } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";

// 07-screens.md "0 스플래시" — 2026-09-14 팀 결정으로 갱신:
// 로그인 세션이 있으면 그대로 자동으로 2b(홈)로(대기 없이 즉시). 없으면 더 이상 시간이 지나 자동
// 전환되지 않고, "시작하기" 버튼을 눌러야 1(회원가입)로 넘어간다 — 로딩 스피너·자동 타이머는 없앴다.
//
// 2026-09-18 추가: 실제 Supabase Auth로 바뀌면서 세션 확인이 비동기가 됐다 — store.authReady가
// false인 동안(막 새로고침한 직후 등)은 로그인 여부를 아직 모르는 상태라, "시작하기" 버튼을 먼저
// 보여줬다가 곧바로 홈으로 튀는 깜빡임을 막기 위해 배경색만 보여주고 기다린다.
export default function Main() {
  const nav = useNav();
  const store = useStore();

  useEffect(() => {
    if (store.authReady && store.isLoggedIn) {
      nav.enterApp();
    }
    // authReady·isLoggedIn이 바뀔 때마다 다시 확인해야 한다(세션 확인이 비동기라 마운트 시점엔
    // 아직 false일 수 있음).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.authReady, store.isLoggedIn]);

  if (!store.authReady || store.isLoggedIn) {
    // 세션 확인 중이거나, 확인 결과 로그인 상태라 곧 홈으로 넘어갈 아주 짧은 순간 — 같은 배경색만 보여준다.
    return <div style={{ height: "100%", width: "100%", background: "#8C81E0" }} />;
  }

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        background: "#8C81E0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Image src="/logo.png" alt="logo" width={180} height={180} style={{ objectFit: "contain" }} priority />
      <div style={{ fontSize: 30, fontWeight: 800, color: "#FFFFFF", marginTop: 4, letterSpacing: "-0.3px" }}>ShooT</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", marginTop: 8 }}>우리가 정한 방식대로, 함께</div>
      <div style={{ position: "absolute", bottom: 52, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div
          onClick={() => nav.goAuthScreen("signupInput")}
          style={{
            width: 200,
            height: 50,
            borderRadius: 16,
            background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)",
            color: "#3F3480",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 800,
            boxShadow: "0 8px 18px rgba(0,0,0,0.2)",
            cursor: "pointer",
          }}
        >
          시작하기
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>함께 쓰고, 함께 확인해요</div>
      </div>
    </div>
  );
}
