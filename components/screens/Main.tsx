"use client";
// components/screens/Main.tsx — 0. 스플래시(design/shoot/Main.dc.html)
import Image from "next/image";
import { useEffect } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";

// 07-screens.md "0 스플래시" (2026-09-11 팀 결정): 로그인 세션이 있으면 스피너 후 자동으로 2b(홈)로,
// 없으면 자동으로 1(회원가입)로 — 사용자가 탭할 필요 없는 자동 분기다.
const SPLASH_DELAY_MS = 900;

export default function Main() {
  const nav = useNav();
  const store = useStore();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (store.isLoggedIn) {
        nav.enterApp();
      } else {
        nav.goAuthScreen("signupInput");
      }
    }, SPLASH_DELAY_MS);
    return () => window.clearTimeout(timer);
    // 마운트 시 한 번만 분기하면 된다 — store.isLoggedIn·nav는 스플래시가 떠 있는 동안 바뀌지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div style={{ position: "absolute", bottom: 52, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div
          className="shoot-spin"
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.25)",
            borderTopColor: "#FFFFFF",
          }}
        />
        <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>함께 쓰고, 함께 확인해요</div>
      </div>
    </div>
  );
}
