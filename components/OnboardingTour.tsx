"use client";
// components/OnboardingTour.tsx — 신규 기능: 처음 가입한 유저에게만 보여주는 온보딩 투어.
// profiles.onboarding_seen(012 마이그레이션)이 false일 때만 뜨고, "시작하기"를 눌러야 완료 처리된다
// (자동으로 넘어가지 않는다 — 사용자가 직접 다음/이전을 눌러서 넘긴다).
import { useState } from "react";
import { useStore } from "@/lib/store";
import { CameraIcon, FlagIcon, UsersIcon } from "./icons";

const SLIDES = [
  {
    icon: CameraIcon,
    title: "영수증만 찍으면 끝",
    body: "카메라로 영수증을 찍으면 금액·가맹점을 자동으로 읽어서 지출로 기록해요.",
  },
  {
    icon: UsersIcon,
    title: "그룹과 함께 관리해요",
    body: "가족·커플·친구 그룹을 만들어 지출을 공유하고, 누가 얼마나 썼는지 같이 확인해요.",
  },
  {
    icon: FlagIcon,
    title: "목표를 세우고 펫을 키워요",
    body: "카테고리별 목표를 정하면, 지킬 때마다 저금통 펫이 성장해요.",
  },
] as const;

export default function OnboardingTour() {
  const store = useStore();
  const [step, setStep] = useState(0);

  if (store.onboardingSeen) return null;

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const Icon = slide.icon;

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(45,42,62,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, zIndex: 40 }}>
      <div style={{ background: "var(--shoot-surface)", borderRadius: 24, padding: 28, width: "100%", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--shoot-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
          <Icon size={28} color="var(--shoot-accent)" />
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--shoot-text)", marginTop: 18 }}>{slide.title}</div>
        <div style={{ fontSize: 13, color: "var(--shoot-text-muted)", marginTop: 8, fontWeight: 600, lineHeight: 1.5 }}>{slide.body}</div>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 3, background: i === step ? "var(--shoot-accent)" : "var(--shoot-border)", transition: "width 0.15s" }}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
          {step > 0 && (
            <div
              onClick={() => setStep((s) => s - 1)}
              style={{ flex: 1, height: 48, borderRadius: 16, border: "1.5px solid var(--shoot-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "var(--shoot-text)", cursor: "pointer" }}
            >
              이전
            </div>
          )}
          <div
            onClick={() => (isLast ? store.completeOnboarding() : setStep((s) => s + 1))}
            style={{ flex: 1, height: 48, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
          >
            {isLast ? "시작하기" : "다음"}
          </div>
        </div>
      </div>
    </div>
  );
}
