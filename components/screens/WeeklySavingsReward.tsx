"use client";
// components/screens/WeeklySavingsReward.tsx — P4. 주간 절약 리포트(디자인 파일 없음,
// docs/08-pet-feature-spec.md §4 근거, 2026-09-15 신규 구현). 배치(cron) 대신 화면을 열 때
// store.getOrCreateWeeklySettlement()가 그 자리에서 이번 주 정산을 계산해 저장한다.
import { useEffect, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import type { WeeklySettlement } from "@/lib/mock";
import { formatWon, formatFullDateKorean } from "@/lib/format";
import { ChevronLeftIcon } from "../icons";

export default function WeeklySavingsReward() {
  const nav = useNav();
  const store = useStore();
  const [settlement, setSettlement] = useState<WeeklySettlement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    store.getOrCreateWeeklySettlement().then((result) => {
      if (!active) return;
      setLoading(false);
      if (!result.ok || !result.data) {
        setError(result.error ?? "리포트를 불러오지 못했어요");
        return;
      }
      setSettlement(result.data);
    });
    return () => {
      active = false;
    };
    // 화면 진입 시 한 번만 계산하면 된다(이미 있으면 store가 그대로 돌려준다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saved = settlement ? settlement.budget_amount - settlement.spent_amount : 0;
  // §4 "절약액이 음수(예산 초과)면 0으로 표시" — 화면에서도 마이너스로 보여주지 않는다.
  const savedDisplay = Math.max(0, saved);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)" }}>이번 주 절약 리포트</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 24px" }}>
        {loading && <div style={{ textAlign: "center", color: "var(--shoot-text-muted)", fontSize: 13, fontWeight: 600, padding: "40px 0" }}>계산하는 중...</div>}
        {error && <div style={{ textAlign: "center", color: "#B23B3B", fontSize: 13, fontWeight: 700, padding: "20px 0" }}>{error}</div>}

        {settlement && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)", textAlign: "center" }}>
              {formatFullDateKorean(settlement.week_start)} 시작하는 주
            </div>

            {settlement.budget_amount === 0 && (
              <div style={{ marginTop: 12, background: "#FFF2EC", border: "1px solid rgba(245,168,130,0.5)", borderRadius: 14, padding: "12px 14px", fontSize: 12, fontWeight: 700, color: "#A15A1E", textAlign: "center" }}>
                아직 주간 예산이 없어서 절약액을 계산할 수 없어요 — 설정에서 예산을 먼저 정해주세요.
              </div>
            )}

            <div style={{ marginTop: 14, background: "var(--shoot-surface)", border: "1.5px solid var(--shoot-border)", borderRadius: 20, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text-muted)" }}>예산</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--shoot-text)" }}>{formatWon(settlement.budget_amount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text-muted)" }}>실제 지출</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--shoot-text)" }}>{formatWon(settlement.spent_amount)}</span>
              </div>
              <div style={{ height: 1, background: "var(--shoot-divider)", margin: "6px 0" }} />
              {/* 막대 그래프(§4) — 지출/예산 비율만 단순하게 표현 */}
              <div style={{ height: 10, borderRadius: 6, background: "var(--shoot-divider)", overflow: "hidden", margin: "10px 0" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${settlement.budget_amount > 0 ? Math.min(100, (settlement.spent_amount / settlement.budget_amount) * 100) : 100}%`,
                    background: saved >= 0 ? "#1D7A69" : "#B23B3B",
                    borderRadius: 6,
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text)" }}>절약액</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: saved >= 0 ? "#1D7A69" : "#B23B3B" }}>{formatWon(savedDisplay)}</span>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "var(--shoot-surface-alt)", borderRadius: 16, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 22 }}>🪙</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)", marginTop: 4 }}>받은 코인</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)", marginTop: 2 }}>+{settlement.coins_earned}</div>
              </div>
              <div style={{ flex: 1, background: "var(--shoot-surface-alt)", borderRadius: 16, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 22 }}>✨</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)", marginTop: 4 }}>받은 XP</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)", marginTop: 2 }}>+{settlement.xp_gained}</div>
              </div>
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
