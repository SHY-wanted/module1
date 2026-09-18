/*
 * scripts/verify-character-masks.js
 * ------------------------------------------------------------------
 * public/masks/ 의 부위별 마스크가 서로 침범하지 않는지 픽셀 단위로 검사한다.
 * 마스크를 다시 만들 때마다(scripts/generate-character-masks.js) 같이 돌려서 확인할 것.
 *
 * 검사 방법: 한 부위 색만 바꿔 렌더링한 뒤, 원본과 달라진 픽셀이 어디에 있는지 센다.
 *   - 대상 마스크 밖에서 바뀐 픽셀      → 0이어야 한다
 *   - 다른 부위 마스크 안에서 바뀐 픽셀 → 0이어야 한다
 *   - 금색(코인/반짝임)에서 바뀐 픽셀   → 0이어야 한다 (가장 중요)
 *
 * 실행: node scripts/verify-character-masks.js
 */
const sharp = require("sharp");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "..", "public");

const STAGES = {
  0: { file: "stage_0_egg.png", prefix: "stage_0_egg", parts: ["body", "leaf"] },
  1: { file: "stage_1_child.png", prefix: "stage_1_child", parts: ["body", "eye", "leaf"] },
  2: { file: "stage_2_teen.png", prefix: "stage_2_teen", parts: ["body", "eye", "leaf", "wallet"] },
  3: { file: "stage_3_adult.png", prefix: "stage_3_adult", parts: ["body", "eye", "leaf", "bag"] },
};

function rgbToHsl(r, g, b) {
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
function hueToRgb(p, q, t) {
  let T = t;
  if (T < 0) T += 1;
  if (T > 1) T -= 1;
  if (T < 1 / 6) return p + (q - p) * 6 * T;
  if (T < 1 / 2) return q;
  if (T < 2 / 3) return p + (q - p) * (2 / 3 - T) * 6;
  return p;
}
function hslToRgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  ];
}
function isGold(r, g, b) {
  const [h, s] = rgbToHsl(r, g, b);
  return h * 360 >= 25 && h * 360 <= 70 && s * 100 > 35;
}

(async () => {
  let allPass = true;

  for (const key of [0, 1, 2, 3]) {
    const cfg = STAGES[key];
    const base = await sharp(path.join(PUBLIC_DIR, cfg.file))
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = base.info.width, H = base.info.height;

    const masks = {};
    for (const part of cfg.parts) {
      masks[part] = await sharp(path.join(PUBLIC_DIR, "masks", `${cfg.prefix}_${part}_mask.png`))
        .ensureAlpha().raw().toBuffer();
    }

    const goldIdx = [];
    for (let i = 0; i < W * H; i++) {
      const o = i * 4;
      if (base.data[o + 3] > 60 && isGold(base.data[o], base.data[o + 1], base.data[o + 2])) goldIdx.push(i);
    }

    for (const target of cfg.parts) {
      const px = Buffer.from(base.data);
      const [ch, cs] = rgbToHsl(255, 0, 0); // 눈에 잘 띄는 빨강으로 바꿔본다
      const m = masks[target];
      for (let i = 0; i < W * H; i++) {
        const w = m[i * 4 + 3] / 255;
        if (w <= 0) continue;
        const o = i * 4;
        const [, , l] = rgbToHsl(px[o], px[o + 1], px[o + 2]);
        const [nr, ng, nb] = hslToRgb(ch, cs, l);
        px[o] = Math.round(px[o] * (1 - w) + nr * w);
        px[o + 1] = Math.round(px[o + 1] * (1 - w) + ng * w);
        px[o + 2] = Math.round(px[o + 2] * (1 - w) + nb * w);
      }

      const changed = (i) => {
        const o = i * 4;
        return px[o] !== base.data[o] || px[o + 1] !== base.data[o + 1] || px[o + 2] !== base.data[o + 2];
      };

      let outside = 0;
      for (let i = 0; i < W * H; i++) if (changed(i) && m[i * 4 + 3] === 0) outside++;

      const bleed = {};
      for (const other of cfg.parts) {
        if (other === target) continue;
        let n = 0;
        for (let i = 0; i < W * H; i++) {
          if (masks[other][i * 4 + 3] === 0) continue;
          if (changed(i)) n++;
        }
        if (n > 0) bleed[other] = n;
      }

      let coinChanged = 0;
      for (const i of goldIdx) if (changed(i)) coinChanged++;

      const ok = outside === 0 && Object.keys(bleed).length === 0 && coinChanged === 0;
      if (!ok) allPass = false;
      console.log(
        `${ok ? "PASS" : "FAIL"}  stage ${key} / ${target}  ` +
        `마스크밖=${outside}  다른부위침범=${JSON.stringify(bleed)}  ` +
        `코인변경=${coinChanged}px (금색 ${goldIdx.length}px 중)`
      );
    }
  }

  console.log(allPass ? "\n전체 통과" : "\n실패 항목 있음");
  if (!allPass) process.exit(1);
})();
