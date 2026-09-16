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
    // SHADING_KEEP이 1이면 원본의 명암 폭을 그대로, 낮추면 평평해진다.
    const shaded = cl + (l - meanL) * SHADING_KEEP;
    const nl = shaded < 0 ? 0 : shaded > 1 ? 1 : shaded;
    const [nr, ng, nb] = hslToRgb(ch, cs, nl);
    base[i] = base[i] * (1 - w) + nr * w;
    base[i + 1] = base[i + 1] * (1 - w) + ng * w;
    base[i + 2] = base[i + 2] * (1 - w) + nb * w;
    // 알파는 건드리지 않는다 — 원본 실루엣 유지.
  }
}

/**
 * 볼터치를 또렷하게 올린다.
 *
 * 원본 그림의 볼터치는 눈 쪽으로 갈수록 흰 눈두덩에 묻혀 밝아진다(밝기 93 → 99, 채도 78 → 50).
 * 그래서 몸 색을 바꾸면 홍조가 반투명하게 비쳐 보인다. 여기서는 볼터치 마스크가 가리키는 픽셀만
 * 채도를 올리고 밝기 상한을 눌러, 번지는 가장자리까지 같은 진하기로 보이게 만든다.
 * 색조(분홍)는 원본 그대로 두므로 홍조 색 자체는 변하지 않는다.
 */
export function intensifyCheek(
  base: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  /** 0이면 원본 그대로, 1이면 최대로 진하게. */
  strength = 1
): void {
  if (strength <= 0) return;
  const MAX_L = 0.85; // 이보다 밝은 볼터치 픽셀은 눌러서 흰색에 묻히지 않게 한다
  const SAT_GAIN = 1.9; // 더 진하게 하려면 이 값만 올리면 된다(2.4쯤이면 꽤 선명해진다)
  for (let i = 0; i < mask.length; i += 4) {
    const w = (mask[i + 3] / 255) * strength;
    if (w <= 0) continue;
    const [h, s, l] = rgbToHsl(base[i], base[i + 1], base[i + 2]);
    const boostedS = Math.min(1, s * SAT_GAIN);
    const cappedL = l > MAX_L ? MAX_L + (l - MAX_L) * 0.35 : l;
    const [r, g, b] = hslToRgb(h, boostedS, cappedL);
    base[i] = base[i] * (1 - w) + r * w;
    base[i + 1] = base[i + 1] * (1 - w) + g * w;
    base[i + 2] = base[i + 2] * (1 - w) + b * w;
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
