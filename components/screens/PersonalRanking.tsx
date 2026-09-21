"use client";
// components/screens/PersonalRanking.tsx — 개인 랭킹(2026-09-17 신규, 디자인 파일 없음).
// "개인 = 경쟁/랭킹, 그룹 = 협력/합동" 지침에 따라 만든 화면 — 다른 개인 사용자의 펫 성장치와
// 순위로 비교하는 화면이다. 그룹 데이터는 절대 섞지 않는다: 목록은 supabase/009_personal_ranking.sql의
// get_personal_ranking()에서만 받아오는데, 이 함수 자체가 개인 펫(user_id가 있는 행)만 돌려준다.
import { useEffect, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { personalRankingStageLabel, type PersonalRankingEntry } from "@/lib/ranking";
import { ChevronLeftIcon } from "../icons";

const RANK_MEDAL = ["🥇", "🥈", "🥉"] as const;

export default function PersonalRanking() {
  const nav = useNav();
  const store = useStore();
  const [entries, setEntries] = useState<PersonalRankingEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    store.fetchPersonalRanking().then((result) => {
      if (!active) return;
      if (!result.ok || !result.data) {
        setError(result.error ?? "랭킹을 불러오지 못했어요");
        return;
      }
      setEntries(result.data);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 진입 시 한 번만 받아온다(실시간 갱신 대상 아님).
  }, []);

  const myRank = entries?.findIndex((e) => e.user_id === store.currentUserId) ?? -1;

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)" }}>개인 랭킹</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 24px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)", marginBottom: 14 }}>
          내 저금통 펫의 성장 단계로 다른 사용자들과 순위를 겨뤄보세요
        </div>

        {error && (
          <div style={{ padding: "16px 0", fontSize: 13, fontWeight: 700, color: "var(--shoot-text-muted)", textAlign: "center" }}>{error}</div>
        )}

        {!error && entries === null && (
          <div style={{ padding: "16px 0", fontSize: 13, fontWeight: 700, color: "var(--shoot-text-muted)", textAlign: "center" }}>불러오는 중...</div>
        )}

        {!error && entries !== null && entries.length === 0 && (
          <div style={{ padding: "16px 0", fontSize: 13, fontWeight: 700, color: "var(--shoot-text-muted)", textAlign: "center" }}>
            아직 랭킹에 참여한 개인 펫이 없어요
          </div>
        )}

        {!error && entries !== null && entries.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {entries.map((entry, idx) => {
              const isMe = entry.user_id === store.currentUserId;
              const rank = idx + 1;
              return (
                <div
                  key={entry.user_id}
                  style={{
                    background: isMe ? "var(--shoot-surface-alt)" : "var(--shoot-surface)",
                    border: isMe ? "1.5px solid var(--shoot-accent)" : "1px solid var(--shoot-border)",
                    borderRadius: 16,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ width: 28, textAlign: "center", fontSize: rank <= 3 ? 18 : 13, fontWeight: 800, color: "var(--shoot-text)", flexShrink: 0 }}>
                    {rank <= 3 ? RANK_MEDAL[rank - 1] : rank}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text)" }}>
                      {entry.nickname}
                      {isMe && <span style={{ color: "var(--shoot-accent)" }}> (나)</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", fontWeight: 600, marginTop: 2 }}>
                      {personalRankingStageLabel(entry.stage_index)} · 🪙 {entry.total_coins.toLocaleString("ko-KR")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {myRank >= 0 && entries && (
          <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)" }}>
            내 순위: {myRank + 1}위 / {entries.length}명
          </div>
        )}
      </div>
    </div>
  );
}
