"use client";
// components/screens/PetDetail.tsx — P2. 펫 상세·성장(디자인 파일 없음, docs/08-pet-feature-spec.md §2 근거,
// 2026-09-15 신규 구현).
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import type { CategoryScope } from "@/lib/categories";
import { getGroupPet, getPersonalPet } from "@/lib/selectors";
import { MAX_STAGE_INDEX, PET_SPECIES_META, PET_STAGE_LABELS } from "@/lib/pets";
import { TODAY_DATE } from "@/lib/mock";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

// 펫이 자랄수록 화면에서 좀 더 크게 보이도록 — 실제 이미지 에셋이 없어 이모지 크기로 대신한다.
const STAGE_EMOJI_SIZE = [56, 68, 80, 92, 108];

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

  const meta = PET_SPECIES_META[pet.species];
  const displayName = pet.pet_name?.trim() || meta.defaultName;
  const fedToday = pet.last_fed_date === TODAY_DATE;

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
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)" }}>
          {scope.kind === "personal" ? "내 저금통 펫" : "그룹 저금통 펫"}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 24px 28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="shoot-pet-bounce" style={{ fontSize: STAGE_EMOJI_SIZE[pet.stage_index - 1] ?? 92, marginTop: 12 }}>
          {meta.emoji}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)", marginTop: 8 }}>{displayName}</div>
        <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", fontWeight: 700, marginTop: 2 }}>{PET_STAGE_LABELS[pet.stage_index - 1]}</div>

        {/* 성장 트래커 — 현재 단계까지는 선명, 이후는 잠금(회색조) */}
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          {PET_STAGE_LABELS.map((label, idx) => {
            const stageNum = idx + 1;
            const reached = stageNum <= pet.stage_index;
            return (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: reached ? 1 : 0.35 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: reached ? "var(--shoot-surface-alt)" : "var(--shoot-divider)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                  {reached ? meta.emoji : "🔒"}
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

        {feedMessage && <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: "var(--shoot-accent)", textAlign: "center" }}>{feedMessage}</div>}

        <div
          onClick={handleFeed}
          style={{
            width: "100%",
            marginTop: 16,
            height: 50,
            borderRadius: 16,
            background: fedToday ? "var(--shoot-surface-alt)" : "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)",
            color: fedToday ? "var(--shoot-text-muted)" : "#3F3480",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 800,
            cursor: fedToday ? "default" : "pointer",
            opacity: feeding ? 0.6 : 1,
          }}
        >
          {fedToday ? "오늘은 이미 밥을 줬어요" : "밥 주기"}
        </div>

        {scope.kind === "personal" && (
          <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 10 }}>
            <div
              onClick={() => nav.push({ id: "weeklyReport" })}
              style={{ flex: 1, height: 44, borderRadius: 14, border: "1.5px solid var(--shoot-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", cursor: "pointer" }}
            >
              이번 주 리포트
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
