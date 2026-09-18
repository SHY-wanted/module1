// lib/ranking.ts — 개인 랭킹 전용 타입·정렬 로직.
//
// "개인 = 경쟁/랭킹, 그룹 = 협력/합동"(2026-09-17 팀 지침) — 이 파일이 다루는 랭킹은 항상 개인 펫끼리의
// 비교다. 그룹 펫 데이터는 애초에 supabase/009_personal_ranking.sql의 get_personal_ranking()이
// user_id가 있는(=개인) 펫만 돌려주므로 여기 섞여 들어올 일이 없다.
import { PET_STAGE_LABELS } from "./pets";

export interface PersonalRankingEntry {
  user_id: string;
  nickname: string;
  stage_index: number;
  xp_progress: number;
  total_coins: number;
}

/**
 * 정렬 기준: 성장 단계 → 그 안에서의 XP → 코인 순. 추후 "활동량" 등 다른 랭킹 기준이 필요해지면
 * 이 함수만 바꾸면 되도록 분리해둔다(요청사항: "추후 랭킹 기준을 확장할 수 있도록 구조 분리").
 */
export function sortPersonalRanking(entries: PersonalRankingEntry[]): PersonalRankingEntry[] {
  return [...entries].sort(
    (a, b) => b.stage_index - a.stage_index || b.xp_progress - a.xp_progress || b.total_coins - a.total_coins
  );
}

export function personalRankingStageLabel(stageIndex: number): string {
  return PET_STAGE_LABELS[stageIndex - 1] ?? "";
}
