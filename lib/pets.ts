// lib/pets.ts — 저금통 펫 키우기 v2 상수·헬퍼.
// 2026-09-15 v1(4종 선택 + 5단계) → 같은 날 사용자 요청으로 3개 브랜치(mg·hybranch·shooTbranch) 통합:
// - 그룹 펫 = hybranch의 "반려 캐릭터"(F22)와 하나로 합침 — 참여도 기반 자동 성장 + 방치 시 시무룩
// - 성장 단계 = 사용자가 준 참고 이미지대로 4단계(알/유년기/청소년기/성체)로 통일, "전설" 삭제
// - 외형 = 4종 선택 대신 마스코트 하나 + 색상 커스텀(개인 펫만, §"캐릭터 커스텀" 이미지 참고)
// - 목표(예산) = shooTbranch의 월별·카테고리별 목표로 mg의 주간 예산을 대체

// ============================================================
// 성장 단계 — 이미지 기준 4단계(사용자 확인, 2026-09-15)
// ============================================================
export const PET_STAGE_LABELS = ["알", "유년기", "청소년기", "성체"] as const;
export const MAX_STAGE_INDEX = 4;

// §3 [?]: "실제 값은 서버 정책으로 결정"이라고 스펙 자체가 못박아 둔 자리 — 팀 확인 전까지는
// 스펙이 제시한 기본값(15)을 그대로 쓴다. 개인 펫 "밥 주기" 1회당 XP.
export const FEED_XP_DEFAULT = 15;

// XP → 단계 승급: 100 넘으면 stage_index+1, 초과분 이월. 최대 단계는 XP만 누적.
export function applyXpGain(stageIndex: number, xpProgress: number, xpGained: number): { stageIndex: number; xpProgress: number } {
  if (stageIndex >= MAX_STAGE_INDEX) {
    return { stageIndex, xpProgress: xpProgress + xpGained };
  }
  let nextStage = stageIndex;
  let nextXp = xpProgress + xpGained;
  while (nextXp >= 100 && nextStage < MAX_STAGE_INDEX) {
    nextXp -= 100;
    nextStage += 1;
  }
  if (nextStage >= MAX_STAGE_INDEX) nextStage = MAX_STAGE_INDEX;
  return { stageIndex: nextStage, xpProgress: nextXp };
}

// ============================================================
// 마스코트 색상 커스텀 — docs/08-pet-feature-spec.md엔 없던 신규 요청(2026-09-15, 참고 이미지 기반).
// "개인용 펫 하나씩 지급 및 색상 변경 가능"이라고 명시적으로 개인 펫에만 범위를 좁혀서 말했으므로,
// 그룹 펫은 이 커스텀 대상이 아니다(고정 기본색만 씀) — 지어내지 않고 사용자 발화 그대로 따름.
// ============================================================
export type PetColorPart = "body" | "ledger" | "bag" | "eyes" | "leaf";
export const PET_COLOR_PARTS: { key: PetColorPart; label: string }[] = [
  { key: "body", label: "몸 색상" },
  { key: "ledger", label: "가계부 색상" },
  { key: "bag", label: "가방 색상" },
  { key: "eyes", label: "눈 색상" },
  { key: "leaf", label: "잎사귀 색상" },
];

// 이미지의 부위별 스와치를 그대로 다 옮기진 않고, 팔레트 하나를 5개 부위에 공통으로 쓴다(단순화 —
// 부위마다 다른 팔레트를 원하면 팀 확인 후 나눌 것).
export const PET_COLOR_PALETTE = ["#8C81E0", "#5FA8E0", "#E07AAE", "#5FBF9E", "#E0C25F", "#E08A5F", "#8A8FA3"];

export interface PetColors {
  body: string;
  ledger: string;
  bag: string;
  eyes: string;
  leaf: string;
}

export const DEFAULT_PET_COLORS: PetColors = {
  body: "#8C81E0",
  ledger: "#6A5ECF",
  bag: "#BDB2F2",
  eyes: "#2D2A3E",
  leaf: "#6FC5BA",
};

// ============================================================
// 방치 시 "시무룩" — hybranch F22 스펙: 단계 자체는 안 내려가고, 화면에서 시무룩한 변형으로만 보여준다.
// 정확한 기준 일수는 스펙에도 [제안]으로 비어있어, 팀 확인 전까지 다음 값을 임시로 쓴다.
// ============================================================
export const PERSONAL_SULK_AFTER_DAYS = 2; // 개인 펫: 이만큼 안 먹이면 시무룩
export const GROUP_SULK_AFTER_DAYS = 3; // 그룹 펫: 이만큼 공유 지출 기록이 없으면 시무룩

export function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(fromDateStr + "T00:00:00");
  const to = new Date(toDateStr + "T00:00:00");
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

// ============================================================
// 그룹 펫 자동 성장 — hybranch F22 "참여도" 규칙을 그대로 옮김: 최근 기간에 여럿이 골고루 기록했으면
// 정상 성장, 한 명만 계속 기록했으면 절반만. "최근 기간"·"여럿" 기준도 스펙에 숫자가 없어 아래 상수로
// 임시 결정했다(팀 확인 전 placeholder) — 지출을 하나씩 기록할 때마다 이 로직으로 그룹 펫 XP를 준다.
export const GROUP_PARTICIPATION_WINDOW_DAYS = 7; // 최근 며칠 안의 공유 지출을 참여도 계산에 쓸지
export const GROUP_XP_PER_SHARED_EXPENSE = 15; // 정상 성장(2인 이상 참여) 시 지급 XP — 개인 먹이주기와 동일값
export const GROUP_XP_HALF_RATE_DIVISOR = 2; // 한 명만 계속 기록 중이면 이 값으로 나눈 XP만 지급

// ============================================================
// 목표(예산) — shooTbranch의 월별·카테고리별 목표로 mg의 주간 예산을 대체(2026-09-15 사용자 확인).
// "퀘스트 형식으로 달성하면 보상"이므로 절약 비율이 아니라 달성/미달성의 고정 보상으로 지급한다.
// ============================================================
export const GOAL_ACHIEVED_REWARD_COINS = 10; // 팀 확인 전 placeholder
export const GOAL_ACHIEVED_REWARD_XP = 30; // 팀 확인 전 placeholder

export function currentMonthString(today: string): string {
  return today.slice(0, 7); // "YYYY-MM"
}

// ============================================================
// F23 그룹 피드 이모지 반응 — hybranch 스펙 자체가 "다양한 이모지 중 폭넓게, 구체 목록·최대 개수는
// [제안]"이라고 비워뒀다. 팀 확인 전까지 자주 쓰는 이모지 위주로 폭넓게 골라 임시 팔레트를 쓴다.
// ============================================================
export const REACTION_EMOJI_PALETTE = [
  "👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏",
  "😍", "🤔", "😅", "💪", "🙏", "😱", "🥲", "✨",
  "💸", "🍀", "👀", "😋", "🥳", "😭", "💯", "🤝",
];
