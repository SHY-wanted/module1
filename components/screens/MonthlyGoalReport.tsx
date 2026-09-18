"use client";
// components/screens/MonthlyGoalReport.tsx — P4(자리 대체). 이번 달 목표 리포트 — "퀘스트 달성"
// 개념(shooTbranch 통합, 2026-09-15 사용자 확인)이라 절약 비율이 아니라 카테고리별 달성 여부에 따른
// 고정 보상을 보여준다. 배치(cron) 대신 화면을 열 때 store.getOrCreateGoalRewardsForMonth()가 그
// 자리에서 계산해 저장한다.
import { useEffect, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import type { GoalReward } from "@/lib/mock";
import { getCategoryVisual } from "@/lib/categories";
import { formatWon } from "@/lib/format";
import { ChevronLeftIcon, CheckIcon } from "../icons";

export default function MonthlyGoalReport() {
  const nav = useNav();
  const store = useStore();
  const [rewards, setRewards] = useState<GoalReward[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    store.getOrCreateGoalRewardsForMonth().then((result) => {
      if (!active) return;
      setLoading(false);
      if (!result.ok || !result.data) {
        setError(result.error ?? "목표 리포트를 불러오지 못했어요");
        return;
      }
      setRewards(result.data);
    });
    return () => {
      active = false;
    };
    // 화면 진입 시 한 번만 계산하면 된다(이미 있으면 store가 그대로 돌려준다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCoins = rewards?.reduce((sum, r) => sum + r.coins_earned, 0) ?? 0;
  const totalXp = rewards?.reduce((sum, r) => sum + r.xp_gained, 0) ?? 0;

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)" }}>이번 달 목표</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 24px" }}>
        {loading && <div style={{ textAlign: "center", color: "var(--shoot-text-muted)", fontSize: 13, fontWeight: 600, padding: "40px 0" }}>계산하는 중...</div>}
        {error && <div style={{ textAlign: "center", color: "#B23B3B", fontSize: 13, fontWeight: 700, padding: "20px 0" }}>{error}</div>}

        {rewards && rewards.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text-muted)" }}>이번 달 설정한 목표가 아직 없어요</div>
            <div
              onClick={() => nav.push({ id: "monthlyGoalSetting" })}
              style={{ marginTop: 14, display: "inline-flex", height: 44, padding: "0 20px", borderRadius: 14, background: "var(--shoot-accent)", color: "#fff", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
            >
              목표 설정하러 가기
            </div>
          </div>
        )}

        {rewards && rewards.length > 0 && (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "var(--shoot-surface-alt)", borderRadius: 16, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 22 }}>🪙</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)", marginTop: 4 }}>받은 코인</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)", marginTop: 2 }}>+{totalCoins}</div>
              </div>
              <div style={{ flex: 1, background: "var(--shoot-surface-alt)", borderRadius: 16, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 22 }}>✨</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)", marginTop: 4 }}>받은 XP</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)", marginTop: 2 }}>+{totalXp}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              {rewards.map((r) => {
                const visual = getCategoryVisual(r.category);
                return (
                  <div key={r.category} style={{ background: "var(--shoot-surface)", border: `1.5px solid ${r.achieved ? visual.accent : "var(--shoot-border)"}`, borderRadius: 16, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text)" }}>{r.category}</div>
                      {r.achieved ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "#1D7A69" }}>
                          <CheckIcon size={13} color="#1D7A69" strokeWidth={2.4} /> 달성
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--shoot-text-muted)" }}>미달성</div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", fontWeight: 600, marginTop: 6 }}>
                      {formatWon(r.spent_amount)} / {formatWon(r.goal_amount)}
                    </div>
                    <div style={{ height: 8, borderRadius: 5, background: "var(--shoot-divider)", overflow: "hidden", marginTop: 8 }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${r.goal_amount > 0 ? Math.min(100, (r.spent_amount / r.goal_amount) * 100) : 100}%`,
                          background: r.achieved ? "#1D7A69" : "#B23B3B",
                          borderRadius: 5,
                        }}
                      />
                    </div>
                    {r.achieved && <div style={{ fontSize: 11, color: "#1D7A69", fontWeight: 700, marginTop: 6 }}>퀘스트 보상: 코인 +{r.coins_earned} · XP +{r.xp_gained}</div>}
                  </div>
                );
              })}
            </div>

            <div
              onClick={() => nav.push({ id: "petDetail", scope: { kind: "personal" } })}
              style={{ marginTop: 18, height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer" }}
            >
              펫 보러가기
            </div>
          </>
        )}
      </div>
    </div>
  );
}
