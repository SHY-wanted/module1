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

// 2026-09-21 사용자 요청: 밥 한 번에 코인 5개 — 예전 1개는 출석 코인(하루 5개)만으로도 하루에
// 여러 번 먹일 수 있어서 너무 헐렁했다. 이제 출석만으론 하루 한 번 겨우 먹이는 수준이고, 아래
// 지출 기록 코인까지 더해야 여유가 생긴다.
export const FEED_COIN_COST = 5;

// 2026-09-21 사용자 요청: 단계가 올라갈수록 다음 단계까지 필요한 XP도 늘어나야 한다("갈수록 더
// 받아야 함") — 그 증가폭은 균일해야 한다("차이는 균일하게"). 그래서 등차수열로 정한다.
// [알→유년기, 유년기→청소년기, 청소년기→성체] = [100, 150, 200] — 매 단계 +50씩 늘어난다.
export const STAGE_XP_REQUIREMENTS = [100, 150, 200];

// 지금 단계에서 다음 단계로 가는 데 필요한 총 XP. 최대 단계(더 이상 오를 데가 없음)면 null.
export function stageXpRequirement(stageIndex: number): number | null {
  if (stageIndex >= MAX_STAGE_INDEX) return null;
  return STAGE_XP_REQUIREMENTS[stageIndex - 1];
}

// XP → 단계 승급: 그 단계의 필요량(stageXpRequirement)을 넘으면 stage_index+1, 초과분 이월.
// 최대 단계는 XP만 계속 쌓인다(더 이상 승급 없음).
export function applyXpGain(stageIndex: number, xpProgress: number, xpGained: number): { stageIndex: number; xpProgress: number } {
  if (stageIndex >= MAX_STAGE_INDEX) {
    return { stageIndex, xpProgress: xpProgress + xpGained };
  }
  let nextStage = stageIndex;
  let nextXp = xpProgress + xpGained;
  while (nextStage < MAX_STAGE_INDEX) {
    const needed = STAGE_XP_REQUIREMENTS[nextStage - 1];
    if (nextXp < needed) break;
    nextXp -= needed;
    nextStage += 1;
  }
  return { stageIndex: nextStage, xpProgress: nextXp };
}

// 2026-09-21 사용자 요청: 그룹 펫도 이제 수동으로 먹일 수 있다(그룹원 각자 하루 한 번씩,
// pet_feedings 유니크 제약이 실제로 막아준다 — 015 마이그레이션). 다만 그룹원이 많을수록 하루에
// 먹일 수 있는 횟수도 늘어나서, 그대로 두면 인원 많은 그룹이 개인보다 훨씬 빠르게 자라 형평성 문제가
// 생긴다("개인이 키울 때랑 너무 차이나면 안 됨"). 그래서 한 번 먹일 때 주는 XP를 그룹원 수로 나눠,
// "그룹원 전체가 하루치를 다 먹여도" 개인 1회(FEED_XP_DEFAULT)와 비슷한 총량이 되게 맞춘다.
export function groupFeedXp(memberCount: number): number {
  return Math.max(1, Math.round(FEED_XP_DEFAULT / Math.max(memberCount, 1)));
}

// 2026-09-21 사용자 요청: 코인 수급을 출석체크 하나에만 의존하지 않게, 지출을 기록할 때도
// 코인을 준다 — 개인 지출은 내 개인 펫에, 공유(그룹) 지출은 그 그룹 펫에 쌓인다.
export const PERSONAL_EXPENSE_COIN_REWARD = 1;
export const GROUP_EXPENSE_COIN_REWARD = 1;

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

// 성장 단계마다 실제로 존재하는 부위만 커스텀 화면에 보여준다. 2026-09-15 사용자 재확인: 청소년기는
// 가계부를 그대로 들고, 성년기는 가방+코인(코인은 고정 장식이라 커스텀 대상 아님) — v2 참고 이미지의
// "청소년기=가방, 성년기=가계부+가방" 라벨은 채택 안 함(래스터 추출 정밀도 문제로 SVG 직접 그리기로
// 전환하면서 원래 이미지 구성으로 되돌렸다). 없는 부위의 색은 DB엔 계속 저장돼 있지만(다음 단계로
// 자라면 그대로 살아남게) 그 단계에서는 편집 UI를 숨긴다.
export function colorPartsForStage(stageIndex: number): PetColorPart[] {
  if (stageIndex <= 1) return ["body", "leaf"]; // 알 — 눈·가계부·가방 없음
  if (stageIndex === 2) return ["body", "eyes", "leaf"]; // 유년기 — 가계부·가방 없음
  if (stageIndex === 3) return ["body", "eyes", "leaf", "ledger"]; // 청소년기 — 가계부, 가방 없음
  return ["body", "eyes", "leaf", "bag"]; // 성년기 — 가방(+코인, 고정 장식) · 가계부는 없음
}

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

/**
 * "YYYY-MM-DD" 날짜를 며칠 이동시킨다(예: -1이면 전날). 반드시 "T00:00:00Z"(UTC)로 파싱하고
 * setUTCDate/getUTCDate만 쓴다 — "T00:00:00"(타임존 없음)으로 파싱하면 브라우저의 로컬 타임존으로
 * 해석되는데, 그 뒤 toISOString()은 항상 UTC로 돌려주기 때문에 한국(UTC+9)처럼 UTC보다 빠른 타임존
 * 에서는 자정 근처에서 날짜가 하루 더 밀리는 버그가 생긴다(2026-09-18 발견 — 출석체크 연속일수가
 * 매번 1일차로 초기화되던 원인. 전날 날짜를 이 버그로 잘못 계산해서 어제 기록을 못 찾았었다).
 */
export function shiftDateKST(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
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
// ============================================================
// 출석체크 — 접속률을 올리기 위한 신규 기능(2026-09-20 사용자 요청). 매일 접속해서 출석체크하면
// 코인을 주고, 7일을 꼬박 채워 연속 출석하면 그 7일째에 코인을 두 배로 준다 — 다음 날부터는 다시
// 1일째부터 새 주기가 시작된다("일주일 주기로"). 정확한 지급량은 스펙에 없어 팀 확인 전까지
// 아래 값을 임시로 쓴다(GOAL_ACHIEVED_REWARD_COINS와 같은 성격의 placeholder).
// ============================================================
export const CHECKIN_REWARD_COINS = 5; // 팀 확인 전 placeholder — 하루 출석 기본 코인
export const CHECKIN_STREAK_LENGTH = 7; // 이 일수를 연속으로 채우면 보너스, 다음 날 1일째로 리셋
export const CHECKIN_STREAK_BONUS_MULTIPLIER = 2; // 주기의 마지막 날 코인 = 기본 × 이 값

export const REACTION_EMOJI_PALETTE = [
  "👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏",
  "😍", "🤔", "😅", "💪", "🙏", "😱", "🥲", "✨",
  "💸", "🍀", "👀", "😋", "🥳", "😭", "💯", "🤝",
];
