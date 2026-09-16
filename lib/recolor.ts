// lib/recolor.ts — Pixel Mask 기반 색상 변경 계산.
//
// 원칙:
//   1. 마스크가 지정하지 않은 픽셀은 원본 그대로 둔다. 캔버스 전체를 색으로 덮는 방식은 쓰지 않는다.
//   2. 색을 바꿔도 원본의 명암·그림자·하이라이트는 유지한다 — 색조(H)와 채도(S)만 사용자 색으로
//      바꾸고 밝기(L)는 원본 픽셀 값을 그대로 쓴다. 그래서 몸을 파란색으로 바꾸면 몸의 그림자는
//      어두운 파랑, 하이라이트는 밝은 파랑이 된다.
//   3. 코인은 어떤 마스크에도 들어있지 않으므로 무슨 색을 골라도 원본 금색 그대로 남는다.
//
// 2번이 성립하려면 "부위의 음영까지 마스크에 포함"되어야 한다. 진한 외곽선만 마스크에서 빼서
// 윤곽은 원본 그대로 남긴다 — 이 방침은 2026-09-16 사용자 확정 사항이고, 마스크를 만드는 쪽
// (scripts/generate-character-masks.js 헤더 주석)에 근거를 자세히 적어뒀다.

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
  const [ch, cs] = rgbToHsl(cr, cg, cb);
  for (let i = 0; i < mask.length; i += 4) {
    const w = mask[i + 3] / 255;
    if (w <= 0) continue;
    const [, , l] = rgbToHsl(base[i], base[i + 1], base[i + 2]);
    const [nr, ng, nb] = hslToRgb(ch, cs, l);
    base[i] = base[i] * (1 - w) + nr * w;
    base[i + 1] = base[i + 1] * (1 - w) + ng * w;
    base[i + 2] = base[i + 2] * (1 - w) + nb * w;
    // 알파는 건드리지 않는다 — 원본 실루엣 유지.
  }
}

/**
 * 서로 다른 두 부위 사이의 경계선(outline mask)은 어느 색으로도 바꾸지 않고 원본 그대로 두는데,
 * 원본 색 자체가 두 오브젝트 색이 섞인 색이라 부위 색을 원본과 많이 다르게 바꾸면 그 자리만
 * 원본 색으로 "삐져나온" 것처럼 보인다. 그래서 채도만 0으로 낮춰(밝기는 유지) 중립적인 그림자
 * 선으로 보이게 한다 — 무슨 색을 고르든 자연스러운 외곽선처럼 보인다.
 */
export function desaturateOutline(base: Uint8ClampedArray, outline: Uint8ClampedArray): void {
  for (let i = 0; i < outline.length; i += 4) {
    const w = outline[i + 3] / 255;
    if (w <= 0) continue;
    const [, , l] = rgbToHsl(base[i], base[i + 1], base[i + 2]);
    const [nr, ng, nb] = hslToRgb(0, 0, l);
    base[i] = base[i] * (1 - w) + nr * w;
    base[i + 1] = base[i + 1] * (1 - w) + ng * w;
    base[i + 2] = base[i + 2] * (1 - w) + nb * w;
  }
}

/**
 * 입·볼터치는 색 커스터마이징 대상이 아닌 "기본 구조"라서, 색을 다 칠한 뒤 이 자리만 원본
 * 픽셀로 무조건 덮어쓴다 — 파워포인트에서 겹친 도형을 "맨 앞으로 보내기" 하는 것과 같다.
 * 어떤 부위 색을 고르든, 부위 마스크가 입·볼터치 언저리를 살짝 물들였더라도 이 단계가 항상
 * 마지막에 원래 모습으로 되돌린다.
 */
export function restoreFixedArea(
  working: Uint8ClampedArray,
  original: Uint8ClampedArray,
  fixedMask: Uint8ClampedArray
): void {
  for (let i = 0; i < fixedMask.length; i += 4) {
    const w = fixedMask[i + 3] / 255;
    if (w <= 0) continue;
    working[i] = working[i] * (1 - w) + original[i] * w;
    working[i + 1] = working[i + 1] * (1 - w) + original[i + 1] * w;
    working[i + 2] = working[i + 2] * (1 - w) + original[i + 2] * w;
  }
}
