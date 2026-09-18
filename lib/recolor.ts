// lib/recolor.ts — Pixel Mask 기반 색상 변경 계산.
//
// 원칙:
//   1. 마스크가 지정하지 않은 픽셀은 원본 그대로 둔다. 캔버스 전체를 색으로 덮는 방식은 쓰지 않는다.
//   2. 색을 바꿔도 원본의 명암·그림자·하이라이트는 유지한다 — 색조(H)와 채도(S)만 사용자 색으로
//      바꾸고, 밝기(L)는 고른 색의 밝기를 기준으로 원본의 음영 폭을 얹는다. 그래서 몸을 파란색으로 바꾸면 그림자는
//      어두운 파랑, 하이라이트는 밝은 파랑이 된다.
//   3. 코인은 어떤 마스크에도 들어있지 않으므로 무슨 색을 골라도 원본 금색 그대로 남는다.
//
// 2번이 성립하려면 "부위의 음영까지 마스크에 포함"되어야 한다. 진한 외곽선만 마스크에서 빼서
// 윤곽은 원본 그대로 남긴다 — 이 방침은 2026-09-16 사용자 확정 사항이고, 마스크를 만드는 쪽
// (scripts/generate-character-masks.js 헤더 주석)에 근거를 자세히 적어뒀다.

/** 색을 바꿀 때 원본의 명암 폭을 얼마나 유지할지. 1이면 그대로, 낮출수록 평평해진다. */
const SHADING_KEEP = 0.85;
/**
 * 평균보다 밝은 쪽(하이라이트)을 흰색까지 얼마나 끌어올릴지.
 * 1로 두면 검정을 골라도 하이라이트가 흰색까지 올라가 검게 안 보인다. 낮추면 고른 색의 어두움이
 * 살아나되 하이라이트는 여전히 "더 밝은 톤"으로 남는다.
 */
const HIGHLIGHT_KEEP = 0.6;

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255;
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
  const l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === R) h = (G - B) / d + (G < B ? 6 : 0);
    else if (mx === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

function hueToRgb(p: number, q: number, t: number): number {
  let T = t;
  if (T < 0) T += 1;
  if (T > 1) T -= 1;
  if (T < 1 / 6) return p + (q - p) * 6 * T;
  if (T < 1 / 2) return q;
  if (T < 2 / 3) return p + (q - p) * (2 / 3 - T) * 6;
  return p;
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  ];
}

/**
 * base 픽셀을 제자리에서 수정한다. mask의 알파가 0이 아닌 픽셀만 색을 바꾸고,
 * 알파 값을 가중치로 써서 부위 경계가 부드럽게 이어지게 한다.
 */
export function applyMaskColor(
  base: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  hex: string
): void {
  const [cr, cg, cb] = hexToRgb(hex);
  const [ch, cs, cl] = rgbToHsl(cr, cg, cb);

  // 이 부위의 원래 평균 밝기. 고른 색의 밝기를 여기에 맞춰 옮겨 놓고, 각 픽셀은 평균에서 얼마나
  // 밝고 어두운지(=음영)를 그대로 유지한다. 예전에는 밝기를 아예 원본 그대로 뒀는데, 그러면
  // 검정을 골라도 원래 밝기(몸통 86%)가 남아 회색빛으로만 보이고 검게 되지 않았다.
  let sum = 0;
  let count = 0;
  for (let i = 0; i < mask.length; i += 4) {
    if (mask[i + 3] === 0) continue;
    sum += rgbToHsl(base[i], base[i + 1], base[i + 2])[2];
    count++;
  }
  const meanL = count ? sum / count : 0.5;

  for (let i = 0; i < mask.length; i += 4) {
    const w = mask[i + 3] / 255;
    if (w <= 0) continue;
    const [, , l] = rgbToHsl(base[i], base[i + 1], base[i + 2]);
    // 평균보다 어두운 쪽은 "몇 배로 어두운가"를, 밝은 쪽은 "흰색까지 얼마나 남았나"를 기준으로
    // 옮긴다. 예전에는 밝기 차이를 그대로 더했는데(cl + (l - meanL)), 그러면 오브젝트 사이의
    // 진한 외곽선처럼 평균보다 한참 어두운 픽셀이 음수로 내려가 새까맣게 뭉개졌다 — 진한 색을
    // 고르면 가방·눈 둘레에 검은 점선이 둘러진 것처럼 보였다(사용자 신고). 비율로 옮기면 고른
    // 색이 아무리 어두워도 외곽선은 "그 색의 더 어두운 톤"으로 남는다.
    const target =
      l <= meanL
        ? cl * (meanL > 0 ? l / meanL : 1)
        : cl + (1 - cl) * ((l - meanL) / (1 - meanL)) * HIGHLIGHT_KEEP;
    const shaded = cl + (target - cl) * SHADING_KEEP;
    const nl = shaded < 0 ? 0 : shaded > 1 ? 1 : shaded;
    const [nr, ng, nb] = hslToRgb(ch, cs, nl);
    base[i] = base[i] * (1 - w) + nr * w;
    base[i + 1] = base[i + 1] * (1 - w) + ng * w;
    base[i + 2] = base[i + 2] * (1 - w) + nb * w;
    // 알파는 건드리지 않는다 — 원본 실루엣 유지.
  }
}

/** 볼터치 색. 원본 볼터치의 대표색(#fae1fa, HSL 301,74%,93%)을 조금 진하게 잡은 값이다. */
export const CHEEK_COLOR = "#f9c9f2";

/**
 * 볼터치를 고정색으로 얹는다.
 *
 * 예전에는 볼터치를 몸 마스크에서 빼내 원본 픽셀로 남기고 따로 진하게 올렸다. 그런데 빼는 영역
 * (분홍색으로 주워 담은 삐뚤한 모양)과 진하게 하는 영역(타원)의 모양이 달라서, 겹치는 가장자리가
 * 번져 보이고 그 번진 부분이 흰 얼룩으로 굳어 보였다(사용자 신고). 지금은 몸이 얼굴을 고르게
 * 덮은 다음 이 함수가 타원 하나로 고정색을 얹는다 — 기준이 하나뿐이라 어긋날 곳이 없다.
 *
 * 마스크 알파는 가운데가 진하고 밖으로 갈수록 옅어지게 만들어져 있어서(생성 스크립트의 radial
 * falloff), 단색 원반이 아니라 자연스럽게 번지는 홍조로 보인다.
 */
export function paintCheek(
  base: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  hex: string = CHEEK_COLOR
): void {
  const [cr, cg, cb] = hexToRgb(hex);
  for (let i = 0; i < mask.length; i += 4) {
    const w = mask[i + 3] / 255;
    if (w <= 0) continue;
    base[i] = base[i] * (1 - w) + cr * w;
    base[i + 1] = base[i + 1] * (1 - w) + cg * w;
    base[i + 2] = base[i + 2] * (1 - w) + cb * w;
  }
}

/**
 * 마스크가 가리키는 픽셀을 순백색(255,255,255)으로 칠한다.
 *
 * 가계부 바깥 테두리와 안쪽 테두리 사이의 밝은 홈에 쓴다. 원본은 아주 밝은 연보라(약 224,210,254)
 * 라서 가계부 색을 바꾸면 연보라 띠로 보였는데, 어떤 색을 골라도 항상 흰 홈으로 고정하기 위해
 * 원본 색을 쓰지 않고 흰색으로 덮는다. 마스크 알파를 가중치로 써서 가장자리는 부드럽게 이어진다.
 */
export function paintPureWhite(base: Uint8ClampedArray, mask: Uint8ClampedArray): void {
  for (let i = 0; i < mask.length; i += 4) {
    const w = mask[i + 3] / 255;
    if (w <= 0) continue;
    base[i] = base[i] * (1 - w) + 255 * w;
    base[i + 1] = base[i + 1] * (1 - w) + 255 * w;
    base[i + 2] = base[i + 2] * (1 - w) + 255 * w;
  }
}
