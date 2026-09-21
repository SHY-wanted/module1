"use client";
// components/screens/PetDetail.tsx — P2. 펫 상세·성장(디자인 파일 없음, docs/08-pet-feature-spec.md §2 근거,
// 2026-09-15 신규 구현 → 같은 날 mg·hybranch·shooTbranch 통합: 마스코트+색상, 그룹 펫은 참여도 기반
// 자동 성장(수동 밥주기 없음)·시무룩 상태, "리포트"는 월별 목표로 교체).
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import type { CategoryScope } from "@/lib/categories";
import { getGroupPet, getPersonalPet } from "@/lib/selectors";
import { FEED_COIN_COST, GROUP_SULK_AFTER_DAYS, MAX_STAGE_INDEX, PERSONAL_SULK_AFTER_DAYS, PET_STAGE_LABELS, daysBetween, effectiveStageIndex } from "@/lib/pets";
import { TODAY_DATE } from "@/lib/mock";
import PetMascot, { petMascotSize } from "../PetMascot";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

export default function PetDetail({ scope }: { scope: CategoryScope }) {
  const nav = useNav();
  const store = useStore();
  const pet = scope.kind === "personal" ? getPersonalPet(store.pets, store.currentUserId) : getGroupPet(store.pets, scope.groupId);
  const [feeding, setFeeding] = useState(false);
  const [feedMessage, setFeedMessage] = useState<string | null>(null);

  if (!pet) {
    return (
      <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
            <ChevronLeftIcon size={18} color="var(--shoot-text)" />
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--shoot-text-muted)" }}>아직 펫이 없어요</div>
          <div
            onClick={() => nav.push({ id: "petSelect", scope })}
            style={{ height: 44, padding: "0 20px", borderRadius: 14, background: "var(--shoot-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
          >
            펫 데려오기
          </div>
        </div>
      </div>
    );
  }

  const displayName = pet.pet_name?.trim() || (scope.kind === "personal" ? "저금통이" : "우리 펫");
  // 2026-09-21 사용자 요청: "하루 한 번" 제한을 되살렸다(store.feedPet이 실제로 막는다) — 여기서도
  // 버튼을 미리 비활성화해서, 눌러보고서야 "오늘은 이미 줬어요" 에러를 보는 대신 바로 알 수 있게 한다.
  const alreadyFedToday = pet.last_fed_date === TODAY_DATE;
  const canAffordFeed = !alreadyFedToday && pet.total_coins >= FEED_COIN_COST;

  // 방치 시 "시무룩"(hybranch F22) — 단계는 안 내려가고 화면 표시만 바뀐다.
  let sulking = false;
  if (scope.kind === "personal") {
    const lastActivity = pet.last_fed_date ?? pet.created_at.slice(0, 10);
    sulking = daysBetween(lastActivity, TODAY_DATE) > PERSONAL_SULK_AFTER_DAYS;
  } else {
    const groupExpenseDates = store.expenses.filter((e) => e.group_id === scope.groupId && e.is_shared).map((e) => e.date);
    const lastActivity = groupExpenseDates.length > 0 ? groupExpenseDates.reduce((a, b) => (a > b ? a : b)) : pet.created_at.slice(0, 10);
    sulking = daysBetween(lastActivity, TODAY_DATE) > GROUP_SULK_AFTER_DAYS;
  }

  async function handleFeed() {
    if (!pet || feeding) return;
    setFeeding(true);
    const result = await store.feedPet(pet.id);
    setFeeding(false);
    if (!result.ok) {
      setFeedMessage(result.error ?? "밥을 줄 수 없어요");
      return;
    }
    setFeedMessage(`냠냠, 잘 먹었어요! +${result.data?.xpGained ?? 0} XP${result.data?.leveledUp ? " · 단계 승급!" : ""}`);
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)", flex: 1 }}>
          {scope.kind === "personal" ? "내 저금통 펫" : "그룹 저금통 펫"}
        </div>
        {scope.kind === "personal" && (
          <div onClick={() => nav.push({ id: "petCustomize" })} style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-accent)", cursor: "pointer" }}>
            꾸미기
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 24px 28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ marginTop: 12 }}>
          {/* 크기는 "꾸미기"에서 고른 표시 단계(effectiveStageIndex) 기준 — 실제 성장 단계(pet.stage_index)는
              아래 이름·잠금 트래커·XP 바에서 그대로 쓴다(성장 진행과 표시 단계는 서로 다른 정보). */}
          <PetMascot pet={pet} size={petMascotSize(effectiveStageIndex(pet)) + 20} sulking={sulking} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)", marginTop: 8 }}>{displayName}</div>
        <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", fontWeight: 700, marginTop: 2 }}>
          {PET_STAGE_LABELS[pet.stage_index - 1]}
          {sulking && " · 시무룩해요"}
        </div>
        {sulking && (
          <div style={{ fontSize: 11, color: "#A15A1E", fontWeight: 600, marginTop: 4, textAlign: "center" }}>
            {scope.kind === "personal" ? "며칠째 밥을 못 먹었어요" : "며칠째 그룹 지출 기록이 없어요"}
          </div>
        )}

        {/* 성장 트래커 — 현재 단계까지는 선명, 이후는 잠금(회색조) */}
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          {PET_STAGE_LABELS.map((label, idx) => {
            const stageNum = idx + 1;
            const reached = stageNum <= pet.stage_index;
            return (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: reached ? 1 : 0.35 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: reached ? "var(--shoot-surface-alt)" : "var(--shoot-divider)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                  {reached ? "🌱" : "🔒"}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: reached ? "var(--shoot-text)" : "var(--shoot-text-muted)" }}>{label}</div>
              </div>
            );
          })}
        </div>

        {/* XP 진행 바 */}
        <div style={{ width: "100%", marginTop: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)", marginBottom: 6 }}>
            <span>XP</span>
            <span>{pet.stage_index >= MAX_STAGE_INDEX ? `${Math.round(pet.xp_progress)} (최대 단계)` : `${Math.round(pet.xp_progress)} / 100`}</span>
          </div>
          <div style={{ height: 10, borderRadius: 6, background: "var(--shoot-divider)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, pet.xp_progress)}%`, background: "var(--shoot-accent)", borderRadius: 6 }} />
          </div>
        </div>

        {scope.kind === "personal" && (
          <div style={{ width: "100%", marginTop: 16, background: "var(--shoot-surface)", border: "1px solid var(--shoot-border)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text-muted)" }}>저금통 코인</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)" }}>🪙 {pet.total_coins.toLocaleString("ko-KR")}</div>
          </div>
        )}

        {/* 그룹 펫은 수동 밥주기가 없다(hybranch F22 통합 — 참여도로 자동 성장) */}
        {scope.kind === "personal" ? (
          <>
            {feedMessage && <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: "var(--shoot-accent)", textAlign: "center" }}>{feedMessage}</div>}
            <div
              onClick={handleFeed}
              style={{
                width: "100%",
                marginTop: 16,
                height: 50,
                borderRadius: 16,
                background: canAffordFeed ? "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)" : "var(--shoot-surface-alt)",
                color: canAffordFeed ? "#3F3480" : "var(--shoot-text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 800,
                cursor: canAffordFeed ? "pointer" : "default",
                opacity: feeding ? 0.6 : 1,
              }}
            >
              {canAffordFeed ? `밥 주기 (🪙${FEED_COIN_COST})` : alreadyFedToday ? "오늘은 이미 밥을 줬어요" : "코인이 부족해요"}
            </div>
          </>
        ) : (
          <div style={{ width: "100%", marginTop: 16, fontSize: 11, color: "var(--shoot-text-muted)", textAlign: "center", lineHeight: 1.5 }}>
            그룹원들이 지출을 골고루 기록하면 저절로 자라요 — 한 명만 계속 기록하면 절반만 자라요.
          </div>
        )}

        {scope.kind === "personal" && (
          <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 10 }}>
            <div
              onClick={() => nav.push({ id: "monthlyGoalReport" })}
              style={{ flex: 1, height: 44, borderRadius: 14, border: "1.5px solid var(--shoot-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", cursor: "pointer" }}
            >
              이번 달 목표
            </div>
            <div
              onClick={() => nav.push({ id: "myBadges" })}
              style={{ flex: 1, height: 44, borderRadius: 14, border: "1.5px solid var(--shoot-border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", cursor: "pointer" }}
            >
              나의 배지 <ChevronRightIcon size={14} color="var(--shoot-text-muted)" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
