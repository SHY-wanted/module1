/*
 * scripts/generate-character-masks.js
 * ------------------------------------------------------------------
 * public/ 의 원본 캐릭터 PNG 4장에서 부위별 Pixel Mask를 뽑아 public/masks/ 에 저장한다.
 * 원본 PNG는 읽기만 하고 절대 수정하지 않는다.
 *
 * 마스크는 "실제 PNG 픽셀"에서 만든다 — 도형이나 Bounding Box로 영역을 추정하지 않는다.
 * 방식: 색(HSL) 기준으로 후보 픽셀을 고른 뒤, 지정한 씨앗(seed) 픽셀과 연결된 덩어리
 * (connected component)만 남긴다. 씨앗은 "그 부위 안의 한 점"일 뿐이고, 마스크의 경계는
 * 전적으로 픽셀 색이 정한다.
 *
 * 부위 구성(Stage별로 실제 존재하는 것만):
 *   Stage 0 알       : body, leaf
 *   Stage 1 유년기   : body, eye, leaf
 *   Stage 2 청소년기 : body, eye, leaf, wallet(가계부)
 *   Stage 3 성년기   : body, eye, leaf, bag(가방)
 *
 * 마스크에서 반드시 제외하는 것:
 *   - 금색 코인/반짝임(항상 원본 금색 유지)
 *   - 분홍 볼터치
 *   - 진한 잉크(눈동자를 뺀 외곽선·입)
 *   - 캐릭터 밖 배경/투명 영역
 *   - 원본 PNG에 같이 들어있는 "Stage N" 라벨 배지와 옆 캐릭터가 잘려 들어온 자국
 *     (crop 영역 밖은 통째로 제외한다)
 *
 * [음영 처리 방침 — 2026-09-16 사용자 확정]
 * 스펙 문서의 4번("그림자·하이라이트를 마스크에서 제외")과 8번("몸을 파란색으로 바꾸면 몸의
 * 그림자와 밝은 부분도 자연스럽게 파란색 계열로 변해야 한다")이 글자 그대로는 서로 어긋난다.
 * 사용자 확인을 받아 4번을 "외곽선은 건드리지 않는다"는 뜻으로 읽고 8번을 따르기로 했다:
 *   - 부위의 음영(그림자·하이라이트)은 마스크에 포함한다 → 색을 바꾸면 명암도 같은 색 계열로 따라온다.
 *   - 대신 진한 외곽선(밝기 45% 미만)은 모든 마스크에서 빼서 원본 윤곽이 그대로 남는다.
 * 그래서 아래 isInk() 로 걸러낸 픽셀은 어느 마스크에도 들어가지 않는다.
 *
 * 실행: node scripts/generate-character-masks.js
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const OUT_DIR = path.join(PUBLIC_DIR, "masks");

/** 원본 PNG 안에서 캐릭터만 들어있는 영역 — lib/characterStages.ts 의 stageImageCrop 과 같은 값. */
const STAGES = {
  0: {
    file: "stage_0_egg.png",
    prefix: "stage_0_egg",
    crop: { x: 50, y: 225, w: 200, h: 300 },
    // 잎사귀: 머리 위쪽 영역에서 몸통보다 어두운 보라 덩어리.
    leaf: { seed: [95, 55], maxL: 84, window: { y1: 110 } },
    eye: null, // 알 단계에는 눈동자가 없다(감은 눈은 선이라 커스터마이징 대상 아님)
  },
  1: {
    file: "stage_1_child.png",
    prefix: "stage_1_child",
    crop: { x: 5, y: 209, w: 236, h: 316 },
    leaf: { seed: [100, 40], maxL: 84, window: { y1: 100 } },
    eye: { count: 2 },
  },
  2: {
    file: "stage_2_teen.png",
    prefix: "stage_2_teen",
    crop: { x: 5, y: 137, w: 261, h: 398 },
    leaf: { seed: [100, 60], maxL: 84, window: { y1: 120 } },
    eye: { count: 2 },
    // 가계부: 몸 앞에 안고 있는 책. 몸통(L 80 이상)보다 확실히 어둡다.
    wallet: { seed: [150, 290], maxL: 74, window: { y0: 200 } },
  },
  3: {
    file: "stage_3_adult.png",
    prefix: "stage_3_adult",
    crop: { x: 8, y: 50, w: 367, h: 492 },
    leaf: { seed: [120, 80], maxL: 84, window: { y1: 140 } },
    eye: { count: 2 },
    // 가방: 왼쪽 옆구리에 멘 파우치.
    bag: { seed: [50, 390], maxL: 74, window: { y0: 280, x1: 175 } },
  },
};

function toHsl(r, g, b) {
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
  return [h * 360, s * 100, l * 100];
}

/** 씨앗과 연결된 덩어리만 남긴다(4방향). pred를 만족하는 픽셀만 통과. */
function floodFrom(seeds, W, H, pred) {
  const mask = new Uint8Array(W * H);
  const stack = [];
  for (const [sx, sy] of seeds) {
    const id = sy * W + sx;
    if (!pred(sx, sy) || mask[id]) continue;
    mask[id] = 1;
    stack.push(id);
  }
  while (stack.length) {
    const cur = stack.pop();
    const cx = cur % W, cy = (cur - cx) / W;
    const nb = [];
    if (cx > 0) nb.push(cur - 1);
    if (cx < W - 1) nb.push(cur + 1);
    if (cy > 0) nb.push(cur - W);
    if (cy < H - 1) nb.push(cur + W);
    for (const ni of nb) {
      if (mask[ni]) continue;
      const nx = ni % W, ny = (ni - nx) / W;
      if (!pred(nx, ny)) continue;
      mask[ni] = 1;
      stack.push(ni);
    }
  }
  return mask;
}

/** pred를 만족하는 모든 연결 덩어리를 크기순으로 반환. */
function allComponents(W, H, pred) {
  const seen = new Uint8Array(W * H);
  const out = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const id = y * W + x;
      if (seen[id]) continue;
      if (!pred(x, y)) { seen[id] = 1; continue; }
      const stack = [id];
      seen[id] = 1;
      const pixels = [];
      while (stack.length) {
        const cur = stack.pop();
        pixels.push(cur);
        const cx = cur % W, cy = (cur - cx) / W;
        const nb = [];
        if (cx > 0) nb.push(cur - 1);
        if (cx < W - 1) nb.push(cur + 1);
        if (cy > 0) nb.push(cur - W);
        if (cy < H - 1) nb.push(cur + W);
        for (const ni of nb) {
          if (seen[ni]) continue;
          const nx = ni % W, ny = (ni - nx) / W;
          if (!pred(nx, ny)) { seen[ni] = 1; continue; }
          seen[ni] = 1;
          stack.push(ni);
        }
      }
      out.push(pixels);
    }
  }
  return out.sort((a, b) => b.length - a.length);
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const key of [0, 1, 2, 3]) {
    const cfg = STAGES[key];
    const src = path.join(PUBLIC_DIR, cfg.file);
    const meta = await sharp(src).metadata();
    const FW = meta.width, FH = meta.height;

    const { data } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const CH = 4;

    const at = (x, y) => {
      const i = (y * FW + x) * CH;
      return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    };
    const inCrop = (x, y) =>
      x >= cfg.crop.x && x < cfg.crop.x + cfg.crop.w &&
      y >= cfg.crop.y && y < cfg.crop.y + cfg.crop.h;

    // ---- 분류 헬퍼 (전부 원본 픽셀 색 기준) ----
    const isOpaque = (x, y) => inCrop(x, y) && at(x, y)[3] >= 160;
    const isGold = (x, y) => {
      const [r, g, b, a] = at(x, y);
      if (a < 60) return false; // 반짝임 가장자리까지 넉넉히 금색으로 본다
      const [h, s] = toHsl(r, g, b);
      return h >= 25 && h <= 70 && s > 35;
    };
    const isPink = (x, y) => {
      const [r, g, b] = at(x, y);
      const [h, s, l] = toHsl(r, g, b);
      return (h >= 300 || h < 25) && s > 20 && l > 55;
    };
    const isInk = (x, y) => toHsl(...at(x, y).slice(0, 3))[2] < 45;

    const masks = {};

    // ---- 잎사귀 ----
    {
      const w = cfg.leaf.window || {};
      const pred = (x, y) => {
        if (!isOpaque(x, y) || isGold(x, y) || isPink(x, y)) return false;
        const gy = y - cfg.crop.y, gx = x - cfg.crop.x;
        if (w.y1 !== undefined && gy > w.y1) return false;
        if (w.y0 !== undefined && gy < w.y0) return false;
        if (w.x1 !== undefined && gx > w.x1) return false;
        const [, , l] = toHsl(...at(x, y).slice(0, 3));
        return l < cfg.leaf.maxL && l >= 42;
      };
      const seed = [cfg.crop.x + cfg.leaf.seed[0], cfg.crop.y + cfg.leaf.seed[1]];
      masks.leaf = floodFrom([seed], FW, FH, pred);
    }

    // ---- 눈동자 ----
    // 1단계: 아주 진한 잉크 덩어리 중 가장 큰 2개를 찾는다(= 좌/우 눈동자의 진한 부분. 입은 더 작다).
    // 2단계: 그 덩어리에서 시작해 "흰자보다 어두운" 픽셀로 넓힌다 — 눈동자 아래쪽 밝은 부분까지
    //        포함시키기 위해서다(진한 부분만 칠하면 눈이 위아래 두 색으로 갈라져 보인다).
    //        눈동자를 빙 둘러싼 흰자(L 90 이상)가 자연스러운 울타리 역할을 해서 밖으로 새지 않는다.
    if (cfg.eye) {
      const inkPred = (x, y) => isOpaque(x, y) && !isGold(x, y) && isInk(x, y);
      const cores = allComponents(FW, FH, inkPred)
        .filter((c) => c.length >= 300)
        .slice(0, cfg.eye.count);

      const eye = new Uint8Array(FW * FH);
      for (const core of cores) {
        let x0 = FW, x1 = 0, y0 = FH, y1 = 0;
        for (const id of core) {
          const cx = id % FW, cy = (id - cx) / FW;
          if (cx < x0) x0 = cx; if (cx > x1) x1 = cx;
          if (cy < y0) y0 = cy; if (cy > y1) y1 = cy;
        }
        const pad = 18;
        const grow = (x, y) => {
          if (x < x0 - pad || x > x1 + pad || y < y0 - pad || y > y1 + pad) return false;
          if (!isOpaque(x, y) || isGold(x, y) || isPink(x, y)) return false;
          return toHsl(...at(x, y).slice(0, 3))[2] < 82;
        };
        const seeds = core.map((id) => [id % FW, (id - (id % FW)) / FW]);
        const grown = floodFrom(seeds, FW, FH, grow);
        for (let i = 0; i < grown.length; i++) if (grown[i]) eye[i] = 1;
      }
      masks.eye = eye;
    }

    // ---- 가계부 / 가방 ----
    for (const part of ["wallet", "bag"]) {
      if (!cfg[part]) continue;
      const conf = cfg[part];
      const w = conf.window || {};
      const pred = (x, y) => {
        if (!isOpaque(x, y) || isGold(x, y) || isPink(x, y)) return false;
        const gy = y - cfg.crop.y, gx = x - cfg.crop.x;
        if (w.y0 !== undefined && gy < w.y0) return false;
        if (w.y1 !== undefined && gy > w.y1) return false;
        if (w.x1 !== undefined && gx > w.x1) return false;
        const [, , l] = toHsl(...at(x, y).slice(0, 3));
        return l < conf.maxL && l >= 42;
      };
      const seed = [cfg.crop.x + conf.seed[0], cfg.crop.y + conf.seed[1]];
      masks[part] = floodFrom([seed], FW, FH, pred);
    }

    // ---- 몸통 = 남은 전부 (코인·볼·잉크·다른 부위 제외) ----
    // 단, 캐릭터 주변에 흩어져 있는 작은 장식(하트·느낌표·효과선)은 몸이 아니므로 뺀다.
    // 몸에 붙어 있지 않은 작은 덩어리를 걸러내는 방식이라, 발처럼 큰 부위는 그대로 남는다.
    {
      const bodyPred = (x, y) => {
        const id = y * FW + x;
        if (!isOpaque(x, y)) return false;
        if (isGold(x, y) || isPink(x, y) || isInk(x, y)) return false;
        if (masks.leaf?.[id] || masks.eye?.[id] || masks.wallet?.[id] || masks.bag?.[id]) return false;
        return true;
      };
      const body = new Uint8Array(FW * FH);
      for (const comp of allComponents(FW, FH, bodyPred)) {
        if (comp.length < 400) continue; // 작은 장식 조각은 원본 색 그대로 둔다
        for (const id of comp) body[id] = 1;
      }
      masks.body = body;
    }

    // ---- 가장자리 부드럽게 + 부위끼리 겹치지 않게 정리 ----
    // 각 마스크를 살짝 흐리게 하면 부위 경계가 부드러워지는 대신 이웃 부위와 1~2px 겹친다.
    // 그대로 두면 "몸 색을 바꿨는데 가방 마스크 안 픽셀도 바뀌는" 상태가 되므로, 픽셀마다
    // 알파가 가장 큰 부위 하나만 남기고 나머지는 0으로 만들어 서로 겹치지 않게 한다.
    const feathered = {};
    for (const [part, bits] of Object.entries(masks)) {
      const out = Buffer.alloc(FW * FH * 4);
      for (let i = 0; i < bits.length; i++) {
        if (!bits[i]) continue;
        const o = i * 4;
        out[o] = 255; out[o + 1] = 255; out[o + 2] = 255;
        out[o + 3] = data[i * 4 + 3]; // 원본 알파를 물려받아 실루엣 가장자리 계단현상을 줄인다
      }
      feathered[part] = await sharp(out, { raw: { width: FW, height: FH, channels: 4 } })
        .blur(0.7).raw().toBuffer();
    }

    const partNames = Object.keys(feathered);
    for (let i = 0; i < FW * FH; i++) {
      const x = i % FW, y = (i - (i % FW)) / FW;
      // 코인과 크롭 영역 밖은 어떤 마스크에도 넣지 않는다.
      if (!inCrop(x, y) || isGold(x, y)) {
        for (const p of partNames) feathered[p][i * 4 + 3] = 0;
        continue;
      }
      let best = null, bestA = 0;
      for (const p of partNames) {
        const a = feathered[p][i * 4 + 3];
        if (a > bestA) { bestA = a; best = p; }
      }
      for (const p of partNames) if (p !== best) feathered[p][i * 4 + 3] = 0;
    }

    // ---- PNG로 저장 ----
    for (const part of partNames) {
      const name = `${cfg.prefix}_${part}_mask.png`;
      await sharp(feathered[part], { raw: { width: FW, height: FH, channels: 4 } })
        .png().toFile(path.join(OUT_DIR, name));
      let count = 0;
      for (let i = 0; i < FW * FH; i++) if (feathered[part][i * 4 + 3] > 0) count++;
      console.log(`  ${name}  (${count} px)`);
    }
    console.log(`stage ${key} 완료`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
