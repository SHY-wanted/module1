"use client";
// components/screens/MonthlyGoalReport.tsx — P4(자리 대체). 이번 달 목표 리포트 — "퀘스트 달성"
// 개념(shooTbranch 통합, 2026-09-15 사용자 확인)이라 절약 비율이 아니라 카테고리별 달성 여부에 따른
// 고정 보상을 보여준다. 배치(cron) 대신 화면을 열 때 store.getOrCreateGoalRewardsForMonth()가 그
// 자리에서 계산해 저장한다.
import { useEffect, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import type { GoalReward } from "@/lib/mock";
import { computeTodayDateKST } from "@/lib/mock";
import { currentMonthString } from "@/lib/pets";
import { getCategoryVisual } from "@/lib/categories";
import { formatWon } from "@/lib/format";
import { ChevronLeftIcon, CheckIcon, TrashIcon } from "../icons";

// 신규 기능: "이 속도면 넘길 것 같아요" 페이스 경고 — 지금까지 쓴 돈을 지난 날수로 나눠 이번 달
// 남은 날까지 같은 속도로 쓴다고 가정한 예상 총 지출을 구한다. 달성 못 한 목표에서만, 예상치가
// 목표보다 5% 넘게 클 때만 보여준다(오차 범위 안이면 굳이 겁줄 필요 없어서).
const PACE_WARNING_THRESHOLD = 1.05;

// 버그 수정(2026-09-18): today가 month와 다른 달이면(예: 자정을 넘겨 오래 켜둔 세션) today의
// "며칠째"를 month의 날수에 끼워 맞춰버려서 말이 안 되는 예상치가 나올 수 있었다 — 그럴 땐 그냥
// 지금까지 쓴 금액을 그대로 돌려준다(투영하지 않음 → 호출부에서 목표 초과로 안 잡히니 경고도 안 뜬다).
function projectedMonthTotal(spentSoFar: number, month: string, today: string): number {
  if (!today.startsWith(month)) return spentSoFar;
  const dayOfMonth = Number(today.slice(8, 10));
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  if (dayOfMonth <= 0) return spentSoFar;
  return Math.round((spentSoFar / dayOfMonth) * daysInMonth);
}

export default function MonthlyGoalReport() {
  const nav = useNav();
  const store = useStore();
  const [rewards, setRewards] = useState<GoalReward[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  // 버그 수정(2026-09-22): TODAY_DATE는 모듈 로드 시 고정이라 자정을 넘겨 켜둔 탭에서는 지난달을
  // 계속 "이번 달"로 표시했다 — store 쪽 정산 판단과 맞춰 매번 새로 계산한다.
  const today = computeTodayDateKST();
  const month = currentMonthString(today);

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

  // 2026-09-23 팀 요청(신규): 목표 카드를 지울 수 있게 — 실제로는 그 카테고리의 category_goals를 지운다.
  // 버그 수정(2026-09-24): 삭제 직후 store.getOrCreateGoalRewardsForMonth()를 다시 불러 새로 계산했는데,
  // store.deleteCategoryGoal의 setCategoryGoals는 리액트 상태 업데이트라 비동기로 반영된다 — 바로 다음 줄에서
  // store.getOrCreateGoalRewardsForMonth를 또 부르면 아직 새 렌더가 일어나기 전이라 "방금 지운 카테고리가
  // 여전히 포함된" 이전 categoryGoals로 계산돼서, 카드가 화면에 그대로 남아있었다(다른 화면 갔다 오면
  // 그제야 최신 렌더로 사라짐). 서버 삭제는 이미 끝났으니, 화면에서는 그 카테고리 카드만 바로 빼면 된다
  // — 다시 계산할 필요 자체가 없다(다른 카테고리의 보상엔 영향 없음).
  async function handleDeleteGoal(category: string) {
    if (deletingCategory) return;
    const goal = store.categoryGoals.find((g) => g.category === category && g.month === month);
    if (!goal) return;
    setDeletingCategory(category);
    const ok = await store.deleteCategoryGoal(goal.id);
    setDeletingCategory(null);
    if (!ok) return;
    setRewards((prev) => prev?.filter((r) => r.category !== category) ?? prev);
  }

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
                const projected = projectedMonthTotal(r.spent_amount, month, today);
                const showPaceWarning = !r.achieved && r.goal_amount > 0 && projected > r.goal_amount * PACE_WARNING_THRESHOLD;
                return (
                  <div key={r.category} style={{ background: "var(--shoot-surface)", border: `1.5px solid ${r.achieved ? visual.accent : "var(--shoot-border)"}`, borderRadius: 16, padding: 14, opacity: deletingCategory === r.category ? 0.5 : 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text)" }}>{r.category}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {r.achieved ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "#1D7A69" }}>
                            <CheckIcon size={13} color="#1D7A69" strokeWidth={2.4} /> 달성
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--shoot-text-muted)" }}>미달성</div>
                        )}
                        {/* 2026-09-23 팀 요청(신규): 목표 삭제 — 마이페이지 > 저금통 코인 > 이번 달 목표에서 지울 수 있게. */}
                        <div
                          onClick={() => handleDeleteGoal(r.category)}
                          role="button"
                          aria-label={`${r.category} 목표 삭제`}
                          style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                        >
                          <TrashIcon size={14} color="#B23B3B" />
                        </div>
                      </div>
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
                    {/* 버그 수정(2026-09-21 사용자 신고): 이번 달이 끝나기도 전에 "달성"되자마자
                        코인이 나간 것처럼 보였다 — 이제 이번 달 목표는 store에서 코인·XP를 0으로
                        돌려주고(실제로는 아직 안 줌), 달이 끝나야 정산된다. 그래서 달성했어도
                        coins_earned·xp_gained가 0이면 "정산 예정"으로, 실제로 받은 지난 달
                        기록(둘 중 하나라도 0보다 큼)만 "받았다"고 보여준다. */}
                    {r.achieved && (r.coins_earned > 0 || r.xp_gained > 0) && (
                      <div style={{ fontSize: 11, color: "#1D7A69", fontWeight: 700, marginTop: 6 }}>퀘스트 보상: 코인 +{r.coins_earned} · XP +{r.xp_gained}</div>
                    )}
                    {r.achieved && r.coins_earned === 0 && r.xp_gained === 0 && (
                      <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", fontWeight: 700, marginTop: 6 }}>이번 달이 끝나면 정산돼요</div>
                    )}
                    {showPaceWarning && (
                      <div style={{ fontSize: 11, color: "#B23B3B", fontWeight: 700, marginTop: 6 }}>
                        ⚠ 이 속도면 이번 달 약 {formatWon(projected)}까지 쓸 것 같아요
                      </div>
                    )}
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
