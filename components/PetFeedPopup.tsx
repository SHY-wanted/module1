"use client";
// components/PetFeedPopup.tsx — P3. 데일리 먹이주기 팝업(디자인 파일 없음,
// docs/08-pet-feature-spec.md §3 근거, 2026-09-15 신규 구현). 지출을 기록한 직후
// store.openFeedPopupIfEligible()이 열어주면, AppShell이 토스트처럼 화면 전체 위에 띄운다.
import { useState } from "react";
import { useStore } from "@/lib/store";
import { getPersonalPet } from "@/lib/selectors";
import PetMascot from "./PetMascot";
import { CheckIcon } from "./icons";

export default function PetFeedPopup() {
  const store = useStore();
  const [fed, setFed] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [feeding, setFeeding] = useState(false);

  const pet = store.feedPopupPetId ? getPersonalPet(store.pets, store.currentUserId) : undefined;
  if (!store.feedPopupPetId || !pet) return null;
  const displayName = pet.pet_name?.trim() || "저금통이";

  function handleClose() {
    setFed(false);
    setXpGained(0);
    setLeveledUp(false);
    store.closeFeedPopup();
  }

  async function handleFeed() {
    if (feeding) return;
    setFeeding(true);
    const result = await store.feedPet(pet!.id);
    setFeeding(false);
    if (!result.ok) {
      // 이미 오늘 줬거나 실패한 경우 — 그냥 닫는다(재현하기 어려운 드문 경합 상황).
      handleClose();
      return;
    }
    setXpGained(result.data?.xpGained ?? 0);
    setLeveledUp(result.data?.leveledUp ?? false);
    setFed(true);
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(45,42,62,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, zIndex: 30 }}>
      <div style={{ background: "var(--shoot-surface)", borderRadius: 24, padding: 28, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <PetMascot pet={pet} size={72} />
        </div>
        {!fed ? (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)", marginTop: 14 }}>{displayName}(이)가 배고파해요</div>
            <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", marginTop: 6, fontWeight: 600 }}>오늘 지출을 기록했어요 — 밥을 줘서 함께 키워볼까요?</div>
            <div
              onClick={handleFeed}
              style={{ marginTop: 20, height: 48, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, cursor: "pointer", opacity: feeding ? 0.6 : 1 }}
            >
              밥 주기
            </div>
            <div onClick={handleClose} style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)", cursor: "pointer" }}>
              나중에
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)", marginTop: 14 }}>냠냠, 잘 먹었어요!</div>
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "#2D2A3E", borderRadius: 14, padding: "8px 16px" }}>
              <CheckIcon size={14} color="#9FE0CB" strokeWidth={2.4} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>+{xpGained} XP 획득{leveledUp ? " · 단계 승급!" : ""}</span>
            </div>
            <div
              onClick={handleClose}
              style={{ marginTop: 20, height: 48, borderRadius: 16, background: "var(--shoot-surface-alt)", color: "var(--shoot-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
            >
              확인
            </div>
          </>
        )}
      </div>
    </div>
  );
}
