/*
 * scripts/generate-character-masks.js
 * ------------------------------------------------------------------
 * public/ 의 원본 캐릭터 PNG 4장에서 부위별 Pixel Mask를 뽑아 public/masks/ 에 저장한다.
 * 원본 PNG는 읽기만 하고 절대 수정하지 않는다.
 *
 * [마스크를 만드는 방법 — 2026-09-16 전면 재작성]
 * 이전에는 "밝기/채도가 이 범위면 그 부위"라는 식으로 픽셀을 골랐는데, 오브젝트끼리 색이 겹치는
 * 구간에서 경계를 못 찾고 서로의 영역을 물어뜯는 문제가 계속 났다(몸↔가계부, 몸↔가방 등).
 *
 * 그래서 색 범위가 아니라 "그림의 실제 경계선"을 기준으로 바꿨다. 인접 픽셀 간 색 변화량을 재보면
 *   - 오브젝트 안쪽(그라데이션): 0~5
 *   - 오브젝트 경계:            38~74
 * 로 확연히 갈린다. 이 차이를 이용해 그림을 "경계선으로 둘러싸인 평탄한 조각(patch)"들로 먼저
 * 쪼갠 뒤, 조각 단위로 부위를 배정한다. 조각의 테두리가 곧 그림의 실제 오브젝트 경계이므로
 * 색이 비슷하다는 이유로 옆 오브젝트를 끌어오는 일이 구조적으로 생기지 않는다.
 *
 * 조각들은 서로 겹치지 않으므로 마스크끼리도 자동으로 겹치지 않는다(BODY ∩ LEAF = 없음 …).
 * 경계의 안티에일리어싱 픽셀은 어느 조각에도 확실히 속하지 않으므로 아무 마스크에도 넣지 않는다
 * — 그 픽셀은 원본 색 그대로 남아서 "살짝 물드는" 현상이 생기지 않는다.
 *
 * 부위 구성(Stage별로 실제 존재하는 것만):
 *   Stage 0 알       : body, leaf
 *   Stage 1 유년기   : body, eye, leaf
 *   Stage 2 청소년기 : body, eye, leaf, wallet(가계부)
 *   Stage 3 성년기   : body, eye, leaf, bag(가방)
 *
 * 어떤 마스크에도 넣지 않는 것:
 *   - 금색 코인/반짝임 (항상 원본 금색 유지)
 *   - 분홍 볼터치·입 안쪽
 *   - 캐릭터 몸에 붙어있지 않은 장식(하트·느낌표·효과선)
 *   - 진한 외곽선(밝기 45% 미만) — 눈동자는 예외로 자기 마스크가 가진다
 *   - 캐릭터 밖 배경/투명 영역
 *   - 원본 PNG에 같이 들어있는 "Stage N" 라벨 배지와 옆 캐릭터가 잘려 들어온 자국
 *
 * [음영 처리 방침 — 2026-09-16 사용자 확정]
 * 스펙 4번("그림자·하이라이트를 마스크에서 제외")과 8번("몸을 파란색으로 바꾸면 그림자·밝은
 * 부분도 같은 색 계열로 변해야 한다")이 글자 그대로는 어긋난다. 4번을 "외곽선은 건드리지
 * 않는다"는 뜻으로 읽고 8번을 따르기로 확정했다:
 *   - 오브젝트 자체의 음영은 그 오브젝트 마스크에 포함(조각 단위로 잡히므로 자연히 포함된다)
 *   - 진한 외곽선(L<45)만 빼서 원본 윤곽을 남긴다
 * 물건 안쪽에 갇힌 밝은 부분(책등의 밝은 띠, ₩ 표시, 가방의 나비 무늬)은 그 물건의 하이라이트
 * 이므로 구멍 메우기로 같이 포함한다. 단 가방 고리 안쪽의 팔처럼 큰 구멍은 몸이 비쳐 보이는
 * 것이므로 메우지 않는다.
 *
 * 실행: node scripts/generate-character-masks.js
 * 검사: node scripts/verify-character-masks.js
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const OUT_DIR = path.join(PUBLIC_DIR, "masks");

/** 인접 픽셀 색 변화량이 이 값 이상이면 "오브젝트 경계"로 본다(안쪽 0~5, 경계 38~74). */
const EDGE_THRESHOLD = 9;
/** 이보다 큰 구멍은 물건 안쪽 무늬가 아니라 몸이 비쳐 보이는 것으로 본다. */
const MAX_HOLE = 1500;
/** 이보다 어두우면 외곽선으로 보고 눈동자를 뺀 모든 마스크에서 제외한다. */
const OUTLINE_MAX_L = 45;
/** 몸의 최소 채도. 이보다 낮으면 다른 오브젝트이거나 흰 하이라이트라서 몸 마스크에서 뺀다. */
const BODY_MIN_S = 55;

/** 원본 PNG 안에서 캐릭터만 들어있는 영역 — lib/characterStages.ts 의 stageImageCrop 과 같은 값. */
const STAGES = {
  0: {
    file: "stage_0_egg.png",
    prefix: "stage_0_egg",
    crop: { x: 50, y: 225, w: 200, h: 300 },
    leafMaxY: 110,
    hasEye: false, // 알 단계는 감은 눈(선)이라 커스터마이징 대상이 아니다
  },
  1: {
    file: "stage_1_child.png",
    prefix: "stage_1_child",
    crop: { x: 5, y: 209, w: 236, h: 316 },
    leafMaxY: 100,
    hasEye: true,
  },
  2: {
    file: "stage_2_teen.png",
    prefix: "stage_2_teen",
    crop: { x: 5, y: 137, w: 261, h: 398 },
    leafMaxY: 120,
    hasEye: true,
    // 가계부: 몸 앞에 안고 있는 책. 얼굴 아래쪽에서 찾는다.
    wallet: { window: { y0: 200 } },
  },
  3: {
    file: "stage_3_adult.png",
    prefix: "stage_3_adult",
    crop: { x: 8, y: 50, w: 367, h: 492 },
    leafMaxY: 140,
    hasEye: true,
    // 가방: 왼쪽 옆구리의 파우치 + 고리.
    bag: { window: { y0: 280, x1: 180 } },
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

async function buildStage(key) {
  const cfg = STAGES[key];
  const src = path.join(PUBLIC_DIR, cfg.file);
  const meta = await sharp(src).metadata();
  const W = meta.width, H = meta.height;
  const { data } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const rgba = (x, y) => {
    const i = (y * W + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  const inCrop = (x, y) =>
    x >= cfg.crop.x && x < cfg.crop.x + cfg.crop.w &&
    y >= cfg.crop.y && y < cfg.crop.y + cfg.crop.h;
  const isOpaque = (x, y) => inCrop(x, y) && data[(y * W + x) * 4 + 3] >= 160;
  const colorGap = (a, b) =>
    Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));

  const neighbors = (id) => {
    const x = id % W, y = (id - x) / W;
    const out = [];
    if (x > 0) out.push(id - 1);
    if (x < W - 1) out.push(id + 1);
    if (y > 0) out.push(id - W);
    if (y < H - 1) out.push(id + W);
    return out;
  };

  // ── 1. 경계선으로 둘러싸인 평탄한 조각으로 쪼갠다 ─────────────────────────
  const patchOf = new Int32Array(W * H).fill(-1);
  const patches = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const id = y * W + x;
      if (patchOf[id] !== -1 || !isOpaque(x, y)) continue;
      const index = patches.length;
      const pixels = [];
      const stack = [id];
      patchOf[id] = index;
      while (stack.length) {
        const cur = stack.pop();
        pixels.push(cur);
        const cx = cur % W, cy = (cur - cx) / W;
        const curColor = rgba(cx, cy);
        for (const ni of neighbors(cur)) {
          if (patchOf[ni] !== -1) continue;
          const nx = ni % W, ny = (ni - nx) / W;
          if (!isOpaque(nx, ny)) continue;
          if (colorGap(curColor, rgba(nx, ny)) >= EDGE_THRESHOLD) continue;
          patchOf[ni] = index;
          stack.push(ni);
        }
      }
      let x0 = W, x1 = 0, y0 = H, y1 = 0, sr = 0, sg = 0, sb = 0;
      for (const p of pixels) {
        const px = p % W, py = (p - px) / W;
        if (px < x0) x0 = px; if (px > x1) x1 = px;
        if (py < y0) y0 = py; if (py > y1) y1 = py;
        const c = rgba(px, py); sr += c[0]; sg += c[1]; sb += c[2];
      }
      const n = pixels.length;
      patches.push({ index, pixels, n, x0, x1, y0, y1, hsl: toHsl(sr / n, sg / n, sb / n) });
    }
  }

  // ── 2. 캐릭터 본체 실루엣(장식은 몸에 안 붙어 있으므로 여기서 걸러진다) ──
  const biggest = patches.reduce((a, b) => (b.n > a.n ? b : a));
  const bodySeed = biggest.pixels[0];
  const attached = new Uint8Array(W * H);
  {
    const stack = [bodySeed];
    attached[bodySeed] = 1;
    while (stack.length) {
      const cur = stack.pop();
      for (const ni of neighbors(cur)) {
        if (attached[ni]) continue;
        const nx = ni % W, ny = (ni - nx) / W;
        if (!isOpaque(nx, ny)) continue;
        attached[ni] = 1;
        stack.push(ni);
      }
    }
  }

  // ── 3. 조각을 부위에 배정한다 ──────────────────────────────────────────
  const isGoldPatch = (p) => p.hsl[0] >= 25 && p.hsl[0] <= 70 && p.hsl[1] > 35;
  const isPinkPatch = (p) => (p.hsl[0] >= 300 || p.hsl[0] < 25) && p.hsl[1] > 20 && p.hsl[2] > 55;
  const isAttached = (p) => attached[p.pixels[0]] === 1;

  const usable = patches.filter((p) => isAttached(p) && !isGoldPatch(p) && !isPinkPatch(p));
  const assigned = new Map(); // patch index -> part

  // 눈: 어두운 조각 중 가장 큰 2개(입은 그보다 작아서 안 걸린다).
  // 알 단계는 눈이 "감은 선"이라 커스터마이징 대상이 아니지만, 그렇다고 몸에 딸려 들어가면
  // 몸 색을 바꿀 때 눈까지 물드므로 어느 마스크에도 넣지 않는다(_fixed 로 표시만 해둔다).
  {
    const dark = usable
      .filter((p) => p.hsl[2] < 55 && p.n >= 150)
      .sort((a, b) => b.n - a.n)
      .slice(0, 2);
    for (const p of dark) assigned.set(p.index, cfg.hasEye ? "eye" : "_fixed");
  }

  // 잎사귀: 머리 위쪽에만 있는 조각 중 가장 큰 것(하트 같은 장식은 이미 걸러졌고, 크기로도 밀린다)
  {
    const leafCandidates = usable.filter(
      (p) => !assigned.has(p.index) && p.y1 - cfg.crop.y < cfg.leafMaxY && p.n >= 500
    );
    if (leafCandidates.length) {
      const leaf = leafCandidates.reduce((a, b) => (b.n > a.n ? b : a));
      assigned.set(leaf.index, "leaf");
    }
  }

  // 가계부 / 가방: 몸(채도 80 이상)보다 확실히 채도가 낮은 조각. 실측값 — 책·가방 S 54~68,
  // 몸·팔·다리 S 81~89. 밝기만으로는 겹쳐서 구분이 안 되므로 채도를 쓴다.
  for (const part of ["wallet", "bag"]) {
    const conf = cfg[part];
    if (!conf) continue;
    const w = conf.window || {};
    for (const p of usable) {
      if (assigned.has(p.index)) continue;
      if (p.n < 300) continue;
      const gy0 = p.y0 - cfg.crop.y, gx1 = p.x1 - cfg.crop.x;
      if (w.y0 !== undefined && gy0 < w.y0) continue;
      if (w.x1 !== undefined && gx1 > w.x1) continue;
      const [, s, l] = p.hsl;
      if (s >= 75 || l < 45 || l >= 80) continue;
      assigned.set(p.index, part);
    }
  }

  // 몸: 남은 조각 전부(팔·다리·발 포함). 작은 조각까지 받아들이는 이유는, 안 받으면 배 표면의
  // 미세한 질감 조각들이 마스크에서 빠져 색을 바꿨을 때 원래 보라색 점으로 남기 때문이다.
  // 눈·가계부·가방·외곽선은 이미 앞에서 배정·제외됐고, 아래 픽셀 단위 검사(채도·밝기)가 한 번 더
  // 막아주므로 작은 조각을 받아도 다른 오브젝트를 물지 않는다.
  for (const p of usable) {
    if (assigned.has(p.index)) continue;
    if (p.hsl[2] < OUTLINE_MAX_L) continue; // 진한 외곽선 덩어리는 제외
    assigned.set(p.index, "body");
  }

  // ── 4. 픽셀 마스크로 펼친다 ────────────────────────────────────────────
  const parts = ["body", "leaf", "eye", "wallet", "bag"].filter((part) =>
    [...assigned.values()].includes(part)
  );
  const masks = {};
  for (const part of parts) masks[part] = new Uint8Array(W * H);
  for (const [patchIndex, part] of assigned) {
    if (!masks[part]) continue; // "_fixed"(어느 마스크에도 안 넣는 조각)는 건너뛴다
    for (const id of patches[patchIndex].pixels) masks[part][id] = 1;
  }

  // ── 5. 물건 안쪽에 갇힌 작은 무늬(책등의 밝은 띠, ₩, 나비)를 그 물건에 포함 ──
  // 몸에는 적용하지 않는다 — 몸 안쪽에는 눈·입·볼터치처럼 "일부러 뺀" 것들이 있어서
  // 구멍 메우기를 하면 도로 들어와 버린다(실제로 알 단계 감은 눈이 그렇게 다시 들어왔었다).
  for (const part of parts) {
    if (part === "body" || part === "eye") continue;
    const bits = masks[part];
    const outside = new Uint8Array(W * H);
    const queue = [];
    const pushEdge = (id) => {
      if (!bits[id] && !outside[id]) { outside[id] = 1; queue.push(id); }
    };
    for (let x = 0; x < W; x++) { pushEdge(x); pushEdge((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { pushEdge(y * W); pushEdge(y * W + W - 1); }
    while (queue.length) {
      const cur = queue.pop();
      for (const ni of neighbors(cur)) {
        if (outside[ni] || bits[ni]) continue;
        outside[ni] = 1;
        queue.push(ni);
      }
    }
    // 바깥에서 못 닿은 칸 = 갇힌 구멍
    const seen = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
      if (bits[i] || outside[i] || seen[i]) continue;
      const hole = [];
      const stack = [i];
      seen[i] = 1;
      while (stack.length) {
        const cur = stack.pop();
        hole.push(cur);
        for (const ni of neighbors(cur)) {
          if (seen[ni] || bits[ni] || outside[ni]) continue;
          seen[ni] = 1;
          stack.push(ni);
        }
      }
      if (hole.length > MAX_HOLE) continue;
      // 코인·볼터치는 구멍이어도 넣지 않는다. 이미 다른 부위가 가져간 픽셀도 건드리지 않는다
      // (안 그러면 마스크끼리 겹쳐서 "가방 색을 바꿨는데 몸도 바뀌는" 상태가 된다).
      let blocked = false;
      for (const id of hole) {
        for (const other of parts) {
          if (other !== part && masks[other][id]) { blocked = true; break; }
        }
        if (blocked) break;
        const x = id % W, y = (id - x) / W;
        const [h, s, l] = toHsl(...rgba(x, y).slice(0, 3));
        if ((h >= 25 && h <= 70 && s > 35) || ((h >= 300 || h < 25) && s > 20 && l > 55)) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;
      for (const id of hole) bits[id] = 1;
    }
  }

  // ── 6. 픽셀 단위 최종 제외 (반드시 구멍 메우기 "뒤"에 와야 한다) ──────────
  // 조각 평균색으로만 걸러내면 조각 가장자리에 섞여 들어온 금색/분홍 픽셀이 남는다
  // (실제로 몸 마스크에 코인 가장자리가 수십 픽셀 들어갔었다).
  //   - 금색(코인·반짝임): 모든 마스크에서 제외 → 어떤 색을 골라도 원본 금색 유지
  //   - 분홍(볼터치·입 안쪽): 모든 마스크에서 제외
  //   - 진한 외곽선(L<45): 눈동자를 뺀 모든 마스크에서 제외
  //   - 몸은 채도가 일관되게 높다(실측 76~94). 가계부·가방·감은 눈매는 42~68, 흰 하이라이트는
  //     13~20이라 채도로 걸러낼 수 있다. 조각 나누기만으로는 안티에일리어싱 경로를 타고 몸
  //     조각에 붙어버리는 경우가 있어서(알 단계 감은 눈 한쪽이 그랬다) 한 번 더 막는다.
  for (const part of parts) {
    const bits = masks[part];
    for (let i = 0; i < bits.length; i++) {
      if (!bits[i]) continue;
      const x = i % W, y = (i - x) / W;
      const [h, s, l] = toHsl(...rgba(x, y).slice(0, 3));
      const gold = h >= 25 && h <= 70 && s > 35;
      const pink = (h >= 300 || h < 25) && s > 20 && l > 55;
      if (gold || pink) { bits[i] = 0; continue; }
      if (part !== "eye" && l < OUTLINE_MAX_L) { bits[i] = 0; continue; }
      if (part === "body" && s < BODY_MIN_S) bits[i] = 0;
    }
  }

  // ── 7. PNG로 저장(원본 알파를 물려받아 실루엣 가장자리를 매끄럽게) ──────
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const part of parts) {
    const bits = masks[part];
    const out = Buffer.alloc(W * H * 4);
    let count = 0;
    for (let i = 0; i < bits.length; i++) {
      if (!bits[i]) continue;
      const o = i * 4;
      out[o] = 255; out[o + 1] = 255; out[o + 2] = 255;
      out[o + 3] = data[o + 3];
      count++;
    }
    const name = `${cfg.prefix}_${part}_mask.png`;
    await sharp(out, { raw: { width: W, height: H, channels: 4 } })
      .png()
      .toFile(path.join(OUT_DIR, name));
    console.log(`  ${name}  (${count} px)`);
  }
}

(async () => {
  for (const key of [0, 1, 2, 3]) {
    await buildStage(key);
    console.log(`stage ${key} 완료`);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
