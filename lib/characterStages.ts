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

// ============================================================
// 색상 커스터마이징
// ============================================================

export type ColorPart = "body" | "eyes" | "leaf" | "wallet" | "bag";

/**
 * Stage마다 "실제 그림에 존재하는" 부위만 커스터마이징할 수 있다.
 * UI도 Mask도 전부 이 표를 기준으로 한다.
 *
 *   Stage | 몸 | 눈동자 | 잎사귀 | 가계부 | 가방 | 코인
 *   0 알      | O | X | O | X | X | 금색 고정
 *   1 유년기  | O | O | O | X | X | 금색 고정
 *   2 청소년기| O | O | O | O | X | 금색 고정
 *   3 성년기  | O | O | O | X | O | 금색 고정
 *
 * 코인은 어떤 Mask에도 들어있지 않아서 무슨 색을 골라도 원본 금색 그대로 남는다.
 */
export const stageCustomization: Record<CharacterStage, readonly ColorPart[]> = {
  0: ["body", "leaf"],
  1: ["body", "eyes", "leaf"],
  2: ["body", "eyes", "leaf", "wallet"],
  3: ["body", "eyes", "leaf", "bag"],
};

export const colorPartNames: Record<ColorPart, string> = {
  body: "몸 색상",
  eyes: "눈동자 색상",
  leaf: "잎사귀 색상",
  wallet: "가계부 색상",
  bag: "가방 색상",
};

/** 원본과 같은 느낌의 기본값(보라 계열). */
export const DEFAULT_COLORS: Record<ColorPart, string> = {
  body: "#b8a7f0",
  eyes: "#3b2d63",
  leaf: "#9b86ef",
  wallet: "#7b63d8",
  bag: "#8f77e6",
};

/** 파일명 접두사 — public/masks/{prefix}_{part}_mask.png */
const maskPrefix: Record<CharacterStage, string> = {
  0: "stage_0_egg",
  1: "stage_1_child",
  2: "stage_2_teen",
  3: "stage_3_adult",
};

/** 마스크 파일명은 eyes → eye 로 쓴다(스펙에 적힌 파일명 그대로). */
const maskFilePart: Record<ColorPart, string> = {
  body: "body",
  eyes: "eye",
  leaf: "leaf",
  wallet: "wallet",
  bag: "bag",
};

export function maskPath(stage: CharacterStage, part: ColorPart): string {
  return `/masks/${maskPrefix[stage]}_${maskFilePart[part]}_mask.png`;
}

/** localStorage 키 — maxStage와 selectedStage는 의미가 다르므로 절대 한 키로 합치지 않는다. */
export const STORAGE_KEYS = {
  maxStage: "characterMaxStage",
  selectedStage: "characterSelectedStage",
  colors: "characterColors",
} as const;

/** 저장된 색상 JSON을 안전하게 읽는다. 없거나 손상됐으면 기본값. */
export function parseColors(raw: string | null): Record<ColorPart, string> {
  if (!raw) return { ...DEFAULT_COLORS };
  try {
    const parsed = JSON.parse(raw) as Partial<Record<ColorPart, unknown>>;
    const out = { ...DEFAULT_COLORS };
    for (const part of Object.keys(DEFAULT_COLORS) as ColorPart[]) {
      const v = parsed[part];
      if (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v)) out[part] = v;
    }
    return out;
  } catch {
    return { ...DEFAULT_COLORS };
  }
}

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
