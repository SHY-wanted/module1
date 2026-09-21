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
  // 성년기는 원본에서 코인이 오른쪽 끝에 잘려 있어서 캔버스를 넓히고 잘린 호를 복원했다
  // (scripts/repair-stage3-coin.js 참고, 375 → 380). 그런데 그 복원은 코인을 타원(가로반지름
  // 46.5 < 세로반지름 50.5)으로 보고 만들어서, 진짜 원보다 오른쪽이 살짝 덜 나와 "짤린 것처럼"
  // 보였다(사용자 신고). scripts/round-stage3-coin.js가 세로 반지름 기준 정원으로 다시 만들며
  // 캔버스를 한 번 더 넓혔다. 380 → 384.
  3: { width: 384, height: 640 },
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
  3: { x: 5, y: 50, width: 379, height: 492 }, // 코인을 정원으로 다시 만들며 넓어진 만큼 함께 넓힘
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
  // 각 부위의 원본 평균색. 색 바꾸기가 고른 색의 밝기까지 반영하게 되면서, 기본값이 원본 평균과
  // 같아야 아무것도 안 골랐을 때 원본 그림 그대로 보인다.
  body: "#d5befa",
  eyes: "#524094",
  leaf: "#a389f3",
  wallet: "#8b72e7",
  bag: "#7d64de",
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

/**
 * 볼터치가 원본 그림에서 몸통 색조와 구분되는 단계.
 * 알 단계는 볼터치가 몸통 색조 안에 묻혀 있어(색조 290 이상 픽셀이 236개뿐, 그마저 흩어져 있음)
 * 따로 뽑을 대상이 없다 — 그래서 마스크 파일도 만들지 않는다.
 */
export const stageHasCheek: Record<CharacterStage, boolean> = {
  0: false,
  1: true,
  2: true,
  3: true,
};

/** 볼터치 마스크 경로 — 색을 바꾸는 용도가 아니라 홍조를 진하게 올리는 데 쓴다. */
export function cheekMaskPath(stage: CharacterStage): string {
  return `/masks/${maskPrefix[stage]}_cheek_mask.png`;
}

/**
 * 가계부 안쪽 밝은 홈이 있는 단계. 이 영역은 색상 커스터마이징 대상이 아니라 항상 순백색으로 칠한다.
 * 청소년기의 가계부에만 있다.
 */
export const stageHasGroove: Record<CharacterStage, boolean> = {
  0: false,
  1: false,
  2: true,
  3: false,
};

/** 가계부 홈 마스크 경로 — 이 픽셀은 항상 #FFFFFF로 칠한다. */
export function grooveMaskPath(stage: CharacterStage): string {
  return `/masks/${maskPrefix[stage]}_groove_mask.png`;
}
