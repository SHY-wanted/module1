// lib/pets.ts — 저금통 펫 키우기 상수·헬퍼(docs/08-pet-feature-spec.md, §9 종민 확인 반영).
// 디자인 파일(.dc.html)이 없는 신규 기능이라 실제 펫 이미지 에셋도 없다 — 이모지로 대신한다.

export type PetSpecies = "TIGER" | "DOG" | "CAT" | "DRAGON";

export const PET_SPECIES_LIST: PetSpecies[] = ["TIGER", "DOG", "CAT", "DRAGON"];

// §1: 비우면 종별 기본 이름(백설/몽이/나비/칠흑)을 쓴다.
export const PET_SPECIES_META: Record<PetSpecies, { label: string; defaultName: string; emoji: string }> = {
  TIGER: { label: "백호", defaultName: "백설", emoji: "🐯" },
  DOG: { label: "강아지", defaultName: "몽이", emoji: "🐶" },
  CAT: { label: "고양이", defaultName: "나비", emoji: "🐱" },
  DRAGON: { label: "흑룡", defaultName: "칠흑", emoji: "🐉" },
};

// §0: 성장 5단계 — 알 → 유년기 → 청소년기 → 성체 → 전설
export const PET_STAGE_LABELS = ["알", "유년기", "청소년기", "성체", "전설"] as const;
export const MAX_STAGE_INDEX = 5;

// §3 [?]: "실제 값은 서버 정책으로 결정"이라고 스펙 자체가 못박아 둔 자리 — 팀 확인 전까지는
// 스펙이 제시한 기본값(15)을 그대로 쓴다.
export const FEED_XP_DEFAULT = 15;

// XP → 단계 승급(§8): 100 넘으면 stage_index+1, 초과분 이월. 5단계가 최대라 그 이상은 xp만 누적.
export function applyXpGain(stageIndex: number, xpProgress: number, xpGained: number): { stageIndex: number; xpProgress: number } {
  if (stageIndex >= MAX_STAGE_INDEX) {
    // 최대 단계는 승급이 없다 — xp만 계속 누적해서 보여준다(§8 "그 이상은 XP만 누적되고 단계는 고정").
    return { stageIndex, xpProgress: xpProgress + xpGained };
  }
  let nextStage = stageIndex;
  let nextXp = xpProgress + xpGained;
  while (nextXp >= 100 && nextStage < MAX_STAGE_INDEX) {
    nextXp -= 100;
    nextStage += 1;
  }
  if (nextStage >= MAX_STAGE_INDEX) {
    nextStage = MAX_STAGE_INDEX;
  }
  return { stageIndex: nextStage, xpProgress: nextXp };
}

// §4 [?]: 절약액→코인 환산 비율 미정 — 스펙이 예시로 든 "절약 1,000원당 1코인"을 그대로 기본값으로 쓴다.
export const COINS_PER_SAVED_WON = 1000;
// §4 주간 정산 XP 지급량도 미정 — 코인 1개당 1XP로 임시 연동(팀 확인 전 placeholder).
export const WEEKLY_XP_PER_COIN = 1;

// 이번 주의 시작일(월요일, 로컬 날짜 기준)을 YYYY-MM-DD로 반환한다.
// [?] 08-pet-feature-spec.md §9: "정확한 기준 요일·시각·타임존"이 팀 결정 사항으로 남아있어,
// 우선 "월요일 시작·기기 로컬 시간" 기준으로 계산한다 — 실제 배치(cron) 정책이 정해지면 바꿔야 한다.
export function currentWeekStart(today: string): string {
  const d = new Date(today + "T00:00:00");
  const day = d.getDay(); // 0=일 ... 1=월
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffToMonday);
  return d.toISOString().slice(0, 10);
}
