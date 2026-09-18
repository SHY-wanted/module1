/*
 * scripts/enhance-stage3-coin.js
 * ------------------------------------------------------------------
 * public/stage_3_adult.png 의 코인을 "완성된 금화 하나"로 다시 그린다.
 *
 * 원본 코인은 살짝 기울인 3D 코인이라 바깥은 원, 안쪽 판은 타원이고 테두리 폭이 자리마다 달랐다.
 * 거기에 오른쪽이 잘려 있던 것을 두 번에 걸쳐 기워 붙이다 보니 테두리가 고르지 않았다
 * (사용자 요청: "완전히 온전한 원형의 코인", "깔끔한 이중 테두리와 양각 장식 무늬",
 *  "은은한 입체감과 하이라이트", "완성된 하나의 코인처럼").
 *
 * 그래서 코인 원판만 새로 그린다 —
 *   - 동심원 구조: 안쪽 면 → 이중 테두리(홈+둔덕) → 빗금 두른 테두리 띠 → 또렷한 바깥 윤곽
 *   - 왼쪽 위에서 빛이 들어오는 방향 음영으로 입체감을 주고, 은은한 광택을 얹는다
 *   - 가운데 ₩ 표시는 원본 픽셀을 그대로 떠서 다시 얹는다(모양·색 그대로, 살짝 양각만 더한다)
 * 금색 팔레트는 전부 원본 코인에서 뽑은 값이라 색감과 그림체가 달라지지 않는다.
 * 코인 밖(캐릭터·배경)은 한 픽셀도 건드리지 않는다.
 *
 * ₩ 표시는 무채색 정도(RGB 최대-최소)로 떠낸다 — 실측: 글자 48~97, 금색 판 118~190.
 *
 * 몇 번을 다시 돌려도 같은 결과가 나온다(항상 기하로 처음부터 그리고, 글자 기준도 같다).
 * 실행 순서: repair-stage3-coin.js → round-stage3-coin.js → 이 스크립트.
 */
const sharp = require("sharp");
const path = require("path");

const FILE = path.join(__dirname, "..", "public", "stage_3_adult.png");

const CENTER_X = 328.5;
const CENTER_Y = 177.5;
const RADIUS = 50.5;

/** 원본 코인에서 뽑은 금색. */
const GOLD = {
  faceLight: [254, 232, 158],
  faceBase: [254, 205, 94],
  faceShade: [245, 179, 86],
  rimLight: [255, 240, 176],
  rimBase: [254, 224, 126],
  rimShade: [244, 178, 86],
  edgeDark: [231, 153, 68],
};

/** ₩ 표시를 떠내는 기준(무채색 정도). 이보다 낮으면 글자, 높으면 금색 판. */
const GLYPH_CHROMA_IN = 95;
const GLYPH_CHROMA_OUT = 120;
/** 글자를 찾는 범위(반지름 비율). */
const GLYPH_RADIUS = 0.62;

const TICK_COUNT = 48;
const TICK_HALF_DEG = 2.0;

function smoothstep(t) {
  const x = t <= 0 ? 0 : t >= 1 ? 1 : t;
  return x * x * (3 - 2 * x);
}
function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
/** r0~r1 안에서만 1이 되는 부드러운 띠. */
function band(r, r0, r1, feather) {
  return Math.min(smoothstep((r - r0) / feather), smoothstep((r1 - r) / feather));
}

(async () => {
  const meta = await sharp(FILE).metadata();
  const W = meta.width, H = meta.height;
  const { data } = await sharp(FILE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);

  // ── 1. ₩ 표시를 원본에서 떠낸다(색과 모양 그대로) ────────────────────────
  const glyph = []; // { id, alpha, rgb }
  for (let y = Math.floor(CENTER_Y - RADIUS); y <= Math.ceil(CENTER_Y + RADIUS); y++) {
    for (let x = Math.floor(CENTER_X - RADIUS); x <= Math.ceil(CENTER_X + RADIUS); x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const dx = x + 0.5 - CENTER_X, dy = y + 0.5 - CENTER_Y;
      if (Math.hypot(dx, dy) > RADIUS * GLYPH_RADIUS) continue;
      const o = (y * W + x) * 4;
      if (data[o + 3] < 40) continue;
      const chroma = Math.max(data[o], data[o + 1], data[o + 2]) - Math.min(data[o], data[o + 1], data[o + 2]);
      const alpha = 1 - smoothstep((chroma - GLYPH_CHROMA_IN) / (GLYPH_CHROMA_OUT - GLYPH_CHROMA_IN));
      if (alpha <= 0.01) continue;
      glyph.push({ x, y, alpha, rgb: [data[o], data[o + 1], data[o + 2]] });
    }
  }
  // 원본 코인 면에는 ₩ 말고도 옅은 광택 줄이 있어서 같은 기준에 걸린다. 글자만 남기려고
  // 덩어리로 묶어 "가운데에 있는 큼직한 것"만 취한다(광택 줄은 가늘고 가장자리에 있다).
  const glyphAlpha = new Float32Array(W * H);
  const glyphRgb = new Map();
  {
    const cand = new Map();
    for (const g of glyph) cand.set(g.y * W + g.x, g);
    const seen = new Set();
    for (const [id, g0] of cand) {
      if (seen.has(id)) continue;
      const blob = [];
      const stack = [id];
      seen.add(id);
      while (stack.length) {
        const cur = stack.pop();
        blob.push(cur);
        const x = cur % W, y = (cur - x) / W;
        for (const ni of [cur - 1, cur + 1, cur - W, cur + W]) {
          if (seen.has(ni) || !cand.has(ni)) continue;
          seen.add(ni);
          stack.push(ni);
        }
      }
      if (blob.length < 40) continue;
      let sx = 0, sy = 0;
      for (const bid of blob) { const bx = bid % W; sx += bx; sy += (bid - bx) / W; }
      const cx = sx / blob.length, cy = sy / blob.length;
      if (Math.hypot(cx - CENTER_X, cy - CENTER_Y) > RADIUS * 0.35) continue;
      for (const bid of blob) {
        const g = cand.get(bid);
        glyphAlpha[bid] = g.alpha;
        glyphRgb.set(bid, g.rgb);
      }
    }
  }

  // ── 2. 코인 원판을 처음부터 그린다 ───────────────────────────────────────
  // 빛은 왼쪽 위에서 들어온다.
  const LX = -0.64, LY = -0.77;
  let painted = 0;
  for (let y = Math.floor(CENTER_Y - RADIUS - 2); y <= Math.ceil(CENTER_Y + RADIUS + 2); y++) {
    for (let x = Math.floor(CENTER_X - RADIUS - 2); x <= Math.ceil(CENTER_X + RADIUS + 2); x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const dx = x + 0.5 - CENTER_X, dy = y + 0.5 - CENTER_Y;
      const r = Math.hypot(dx, dy);
      const coverage = smoothstep((RADIUS - r) / 1.1);
      if (coverage <= 0.002) continue;

      const rn = r / RADIUS;
      const nx = dx / RADIUS, ny = dy / RADIUS;
      const lit = 0.5 + 0.5 * (nx * LX + ny * LY); // 왼쪽 위가 1에 가깝다

      // 동심원 구조에 따른 기본색
      let color;
      if (rn < 0.70) {
        // 안쪽 면은 가운데가 살짝 도톰하게 밝고 테두리 쪽으로 갈수록 깊어진다 — ₩ 표시가
        // 옅은 노란색이라 면이 너무 밝으면 글자가 묻힌다.
        const t = smoothstep(rn / 0.70);
        const base = mix(GOLD.faceLight, GOLD.faceBase, 0.25 + 0.75 * t);
        color = mix(mix(GOLD.faceShade, base, 0.5), base, lit);
      } else if (rn < 0.93) {
        const t = (rn - 0.70) / 0.23;
        const crown = smoothstep(1 - Math.abs(t - 0.5) * 2); // 띠 한가운데가 도톰하다
        const base = mix(GOLD.rimBase, GOLD.rimLight, crown * 0.8);
        color = mix(mix(GOLD.rimShade, base, 0.5), base, lit);
      } else {
        const t = smoothstep((rn - 0.93) / 0.07);
        color = mix(mix(GOLD.rimShade, GOLD.edgeDark, t), mix(GOLD.rimBase, GOLD.edgeDark, t), lit);
      }

      let mul = 1;
      // 이중 테두리 — 안쪽 홈(어둡게) + 바로 바깥 둔덕(밝게)
      mul *= 1 - 0.13 * band(rn, 0.690, 0.726, 0.016);
      mul *= 1 + 0.085 * band(rn, 0.734, 0.775, 0.018);
      // 바깥 테두리 — 띠가 끝나는 자리에 가는 선을 한 줄 더 넣어 "이중"을 완성한다
      mul *= 1 - 0.10 * band(rn, 0.910, 0.940, 0.014);

      // 양각 빗금 — 테두리 띠 안에서만, 한쪽은 밝고 반대쪽은 어둡게 해서 도드라져 보이게 한다
      const tickBand = band(rn, 0.795, 0.905, 0.035);
      if (tickBand > 0) {
        const step = 360 / TICK_COUNT;
        let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (deg < 0) deg += 360;
        let a = deg - Math.round(deg / step) * step;
        if (a > 180) a -= 360;
        if (a < -180) a += 360;
        if (Math.abs(a) < TICK_HALF_DEG) {
          const ramp = a / TICK_HALF_DEG;
          const fade = 1 - ramp * ramp;
          mul *= 1 + 0.07 * ramp * fade * tickBand;
        }
      }

      // 은은한 광택 — 왼쪽 위 넓은 사광 + 테두리를 따라 도는 가는 초승달
      {
        const hx = dx + RADIUS * 0.34, hy = dy + RADIUS * 0.32;
        const u = (hx * Math.SQRT1_2 + hy * Math.SQRT1_2) / (RADIUS * 0.62);
        const v = (-hx * Math.SQRT1_2 + hy * Math.SQRT1_2) / (RADIUS * 0.36);
        const d = Math.hypot(u, v);
        if (d < 1) mul *= 1 + 0.085 * smoothstep(1 - d);
      }
      {
        const crescent = band(rn, 0.80, 0.92, 0.05) * smoothstep(lit * 1.6 - 0.75);
        mul *= 1 + 0.12 * crescent;
      }

      const o = (y * W + x) * 4;
      let nr = color[0] * mul, ng = color[1] * mul, nb = color[2] * mul;

      // ₩ 표시를 다시 얹는다 — 아래쪽으로 한 칸 그림자를 깔아 살짝 양각으로 보이게 한다.
      const shadow = glyphAlpha[(y - 1) * W + (x - 1)] || 0;
      if (shadow > 0.02) {
        const s = 1 - 0.13 * shadow;
        nr *= s; ng *= s; nb *= s;
      }
      const ga = glyphAlpha[y * W + x];
      const grgb = glyphRgb.get(y * W + x);
      if (ga > 0.01 && grgb) {
        nr = nr * (1 - ga) + grgb[0] * ga;
        ng = ng * (1 - ga) + grgb[1] * ga;
        nb = nb * (1 - ga) + grgb[2] * ga;
      }

      // 원 가장자리에서만 원래 그림과 부드럽게 잇는다(코인 밖은 손대지 않는다).
      const had = data[o + 3] >= 40;
      const blend = coverage;
      out[o] = Math.max(0, Math.min(255, (had ? data[o] : nr) * (1 - blend) + nr * blend));
      out[o + 1] = Math.max(0, Math.min(255, (had ? data[o + 1] : ng) * (1 - blend) + ng * blend));
      out[o + 2] = Math.max(0, Math.min(255, (had ? data[o + 2] : nb) * (1 - blend) + nb * blend));
      out[o + 3] = Math.max(data[o + 3], Math.round(255 * coverage));
      painted++;
    }
  }

  console.log(`코인 다시 그림: ${painted}px, ₩ ${glyph.length}px (중심 ${CENTER_X},${CENTER_Y} 반지름 ${RADIUS})`);
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(FILE);
  console.log("완료:", FILE);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
