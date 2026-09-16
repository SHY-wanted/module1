"use client";
// components/screens/MyBadges.tsx — P5. 나의 배지(디자인 파일 없음, docs/08-pet-feature-spec.md §5 근거,
// 2026-09-15 신규 구현). 개인 펫의 stage_index로 계산만 할 뿐 별도 저장은 없다(스펙 명시).
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getPersonalPet } from "@/lib/selectors";
import { MAX_STAGE_INDEX, PET_STAGE_LABELS } from "@/lib/pets";
import { ChevronLeftIcon } from "../icons";

export default function MyBadges() {
  const nav = useNav();
  const store = useStore();
  const pet = getPersonalPet(store.pets, store.currentUserId);
  const stageIndex = pet?.stage_index ?? 0;

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)" }}>나의 배지</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text-muted)" }}>획득한 배지</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--shoot-text)", marginTop: 4 }}>{stageIndex} / {MAX_STAGE_INDEX}</div>
          <div style={{ height: 10, borderRadius: 6, background: "var(--shoot-divider)", overflow: "hidden", marginTop: 10 }}>
            <div style={{ height: "100%", width: `${(stageIndex / MAX_STAGE_INDEX) * 100}%`, background: "var(--shoot-accent)", borderRadius: 6 }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PET_STAGE_LABELS.map((label, idx) => {
            const stageNum = idx + 1;
            const earned = stageNum <= stageIndex;
            return (
              <div
                key={label}
                style={{
                  background: "var(--shoot-surface)",
                  border: "1px solid var(--shoot-border)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  opacity: earned ? 1 : 0.6,
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: earned ? "var(--shoot-surface-alt)" : "var(--shoot-divider)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  {earned ? "🏅" : "🔒"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--shoot-text)" }}>{label} 배지</div>
                  <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", fontWeight: 600, marginTop: 2 }}>{earned ? "획득 완료" : "아직 도달 전이에요"}</div>
                </div>
                {earned && <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-accent)" }}>✓</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
