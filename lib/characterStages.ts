// lib/characterStages.ts — 성장형 캐릭터 데모(/character-demo)에서 쓰는 단계 정의.
// 스펙 원문은 Vite 기준 src/data/characterStages.ts 였지만, 이 프로젝트는 Next.js라서
// 같은 역할을 하는 lib/ 아래에 둔다(경로만 다르고 내용·역할은 동일).
//
// 이 파일은 "지금은 구현하지 않는" 색상 커스터마이징(PNG + Pixel Mask + Canvas)을 나중에 붙이기
// 쉽도록, 단계별 메타데이터를 한곳에 모아두는 자리이기도 하다 — 마스크 파일 경로가 생기면
// stageMasks 같은 상수를 여기에 나란히 추가하면 된다.

export type CharacterStage = 0 | 1 | 2 | 3;

/** 성장 순서대로의 전체 단계 목록 — 선택 UI가 이 순서로 카드를 그린다. */
export const ALL_STAGES: readonly CharacterStage[] = [0, 1, 2, 3];

/** 마지막(최종) 성장 단계. 진행률 계산·성장 버튼 비활성 판단의 기준. */
export const FINAL_STAGE: CharacterStage = 3;

/** public/ 아래 원본 PNG 경로. public 폴더이므로 "/public"을 붙이지 않는다. */
export const stageImages: Record<CharacterStage, string> = {
  0: "/stage_0_egg.png",
  1: "/stage_1_child.png",
  2: "/stage_2_teen.png",
  3: "/stage_3_adult.png",
};

export const stageNames: Record<CharacterStage, string> = {
  0: "알",
  1: "유년기",
  2: "청소년기",
  3: "성년기",
};

/**
 * 원본 PNG의 실제 픽셀 크기. next/image가 레이아웃을 잡을 때 쓰고, 단계마다 비율이 달라서
 * (305x630 ~ 375x640) 한 값으로 뭉뚱그리면 이미지가 찌그러지므로 개별로 적어둔다.
 */
export const stageImageSizes: Record<CharacterStage, { width: number; height: number }> = {
  0: { width: 305, height: 630 },
  1: { width: 285, height: 630 },
  2: { width: 295, height: 640 },
  3: { width: 375, height: 640 },
};

/**
 * 원본 PNG 안에서 "캐릭터만" 들어있는 영역(픽셀 단위).
 *
 * 받은 PNG 4장은 참고 시트에서 잘라온 것이라 캐릭터 말고도 두 가지가 같이 들어있다.
 *   1) 아래쪽에 박혀 있는 "Stage 0 - Egg" 같은 라벨 배지 — 화면에도 단계 이름을 따로 표시하므로 중복된다.
 *   2) 오른쪽 가장자리에 옆 캐릭터가 살짝 잘려 들어온 자국(0·1·2단계).
 * 원본 PNG는 수정하지 않기로 했으므로, 아래 좌표로 화면에서만 잘라서 보여준다(StageImage 컴포넌트).
 * 알파 채널을 스캔해서 구한 실측값이다.
 */
export const stageImageCrop: Record<CharacterStage, { x: number; y: number; width: number; height: number }> = {
  0: { x: 50, y: 225, width: 200, height: 300 },
  1: { x: 5, y: 209, width: 236, height: 316 },
  2: { x: 5, y: 137, width: 261, height: 398 },
  3: { x: 8, y: 50, width: 367, height: 492 },
};

/** localStorage 키 — 두 값은 의미가 다르므로 절대 한 키로 합치지 않는다. */
export const STORAGE_KEYS = {
  maxStage: "characterMaxStage",
  selectedStage: "characterSelectedStage",
} as const;

/**
 * localStorage에서 읽은 문자열을 CharacterStage로 안전하게 변환한다.
 * 값이 없거나(최초 실행) 손상됐으면 0으로 시작한다.
 */
export function parseStage(raw: string | null): CharacterStage {
  if (raw === null) return 0;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > FINAL_STAGE) return 0;
  return n as CharacterStage;
}

/** 진행률(%)은 언제나 maxStage 기준 — 선택한 캐릭터(selectedStage)와 무관하다. */
export function growthProgress(maxStage: CharacterStage): number {
  return (maxStage / FINAL_STAGE) * 100;
}
