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
 * 서로 다른 두 오브젝트에 걸친 경계 조각만 어느 마스크에도 넣지 않아서(원본 유지) "살짝 물드는"
 * 현상이 생기지 않는다.
 *
 * 부위 구성(Stage별로 실제 존재하는 것만):
 *   Stage 0 알       : body, leaf
 *   Stage 1 유년기   : body, eye, leaf
 *   Stage 2 청소년기 : body, eye, leaf, wallet(가계부)
 *   Stage 3 성년기   : body, eye, leaf, bag(가방)
 *
 * 어떤 마스크에도 넣지 않는 것:
 *   - 금색 코인/반짝임 (항상 원본 금색 유지)
 *   - 분홍 볼터치
 *   - 캐릭터 몸에 붙어있지 않은 장식(하트·느낌표·효과선)
 *   - 서로 다른 두 오브젝트 사이의 외곽선(아래 참고)
 *   - 캐릭터 밖 배경/투명 영역
 *   - 원본 PNG에 같이 들어있는 "Stage N" 라벨 배지와 옆 캐릭터가 잘려 들어온 자국
 *
 * [외곽선 vs 내부 그림자 — 2026-09-16 재수정]
 * 처음엔 "밝기 45% 미만이면 외곽선"으로 잘라냈는데, 3D 캐릭터는 오브젝트 안쪽에도 깊은 그림자가
 * 있어서 그것까지 잘려나갔다. 그 결과 색을 바꿔도 가계부·가방·잎사귀 안쪽에 원래 색 조각이
 * 남았다(사용자 신고). 어두운 픽셀이라고 다 외곽선이 아니다.
 *
 * 그래서 밝기가 아니라 기하로 구분한다 — 어느 오브젝트에 둘러싸여 있는지를 본다:
 *   - 한 오브젝트에만 둘러싸인 조각   → 그 오브젝트의 내부 음영 → 그 마스크에 포함
 *   - 서로 다른 두 오브젝트에 걸친 조각 → 둘 사이의 외곽선     → 어디에도 안 넣음(원본 유지)
 * 덕분에 오브젝트 내부는 밝든 어둡든 전부 그 오브젝트 색으로 바뀌고, 오브젝트 사이의 윤곽선만
 * 원본으로 남는다.
 *
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
/**
 * 볼터치를 원본 분홍색 그대로 남길지 여부.
 * false면 볼터치도 몸 마스크에 포함돼 몸 색을 따라간다(분홍 대신 몸 색조의 옅은 홍조가 된다).
 * 2026-09-16 사용자 요청("눈 주변은 깨끗하고 균일한 흰색으로")에 맞춰 false로 둔다 — 볼터치
 * 덩어리 크기가 단계마다 54~148px로 제각각이라, 남기면 어떤 단계는 분홍이고 어떤 단계는 아닌
 * 들쭉날쭉한 상태가 된다. 분홍 볼터치를 되살리려면 이 값만 true로 바꾸면 된다.
 */
const KEEP_CHEEK_PINK = true;

/** 이보다 큰 구멍은 물건 안쪽 무늬가 아니라 몸이 비쳐 보이는 것으로 본다. */
const MAX_HOLE = 1500;

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
    hasMouth: true,
  },
  2: {
    file: "stage_2_teen.png",
    prefix: "stage_2_teen",
    crop: { x: 5, y: 137, w: 261, h: 398 },
    leafMaxY: 120,
    hasEye: true,
    hasMouth: true,
    // 가계부: 몸 앞에 안고 있는 책. 얼굴 아래쪽에서 찾는다.
    wallet: { window: { y0: 200 } },
  },
  3: {
    file: "stage_3_adult.png",
    prefix: "stage_3_adult",
    crop: { x: 8, y: 50, w: 379, h: 492 }, // 코인 복원으로 캔버스가 12px 넓어짐
    leafMaxY: 140,
    hasEye: true,
    hasMouth: true,
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
  // 금색도 분홍과 같은 이유로 덩어리 단위로 본다 — 눈 가장자리에서 보라 몸통과 남색 눈동자가
  // 섞인 픽셀이 색조상 금색 범위로 넘어와, 코인이 없는 유년기·청소년기에도 주황색 점이 흩뿌려졌다.
  // 진짜 코인·반짝임은 182px 이상의 큼직한 덩어리라 아래 기준으로 안전하게 지켜진다.
  const goldAt = (x, y) => {
    const [h, s] = toHsl(...rgba(x, y).slice(0, 3));
    return h >= 25 && h <= 70 && s > 35;
  };
  const GOLD_MIN_BLOB = 100;
  const solidGold = new Uint8Array(W * H);
  {
    const seen = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const id = y * W + x;
        if (seen[id] || data[id * 4 + 3] < 60 || !goldAt(x, y)) continue;
        const blob = [];
        const stack = [id];
        seen[id] = 1;
        while (stack.length) {
          const cur = stack.pop();
          blob.push(cur);
          for (const ni of neighbors(cur)) {
            if (seen[ni] || data[ni * 4 + 3] < 60) continue;
            const nx = ni % W, ny = (ni - nx) / W;
            if (!goldAt(nx, ny)) continue;
            seen[ni] = 1;
            stack.push(ni);
          }
        }
        if (blob.length < GOLD_MIN_BLOB) continue;
        for (const bid of blob) solidGold[bid] = 1;
      }
    }
  }

  const isGoldPatch = (p) => {
    let hit = 0;
    for (const id of p.pixels) if (solidGold[id]) hit++;
    return hit * 2 > p.pixels.length;
  };
  // 분홍 픽셀 판정. 문제는 눈 가장자리의 안티에일리어싱 픽셀(보라 몸통 + 남색 눈동자가 섞인 색)이
  // 색조상 분홍 범위로 넘어와 볼터치로 오인된다는 것이다. 그대로 두면 눈 둘레에 분홍 점이 흩뿌려지고
  // 그 픽셀들이 어느 마스크에도 안 들어가서, 몸 색을 바꿨을 때 눈 주위만 지저분하게 남는다
  // (사용자 신고: "큰 검은 원 바깥쪽의 점·선·얼룩"). 그래서 낱개 픽셀이 아니라 "덩어리"로 본다 —
  // 진짜 볼터치는 큼직한 덩어리이고, 오인된 것들은 잘게 흩어져 있다.
  const pinkAt = (x, y) => {
    const [h, s, l] = toHsl(...rgba(x, y).slice(0, 3));
    return (h >= 300 || h < 25) && s > 20 && l > 55;
  };
  const PINK_MIN_BLOB = 50; // 실측: 진짜 볼터치 54~148px / 눈가 오인 얼룩 ≤44px 라 50에서 갈린다
  const solidPink = new Uint8Array(W * H);
  const pinkBlobs = [];
  {
    const seen = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const id = y * W + x;
        if (seen[id] || !isOpaque(x, y) || !pinkAt(x, y)) continue;
        const blob = [];
        const stack = [id];
        seen[id] = 1;
        while (stack.length) {
          const cur = stack.pop();
          blob.push(cur);
          for (const ni of neighbors(cur)) {
            if (seen[ni]) continue;
            const nx = ni % W, ny = (ni - nx) / W;
            if (!isOpaque(nx, ny) || !pinkAt(nx, ny)) continue;
            seen[ni] = 1;
            stack.push(ni);
          }
        }
        if (!KEEP_CHEEK_PINK || blob.length < PINK_MIN_BLOB) continue;
        let sx = 0, sy = 0;
        for (const bid of blob) { const bx = bid % W; sx += bx; sy += (bid - bx) / W; }
        pinkBlobs.push({ pixels: blob, cx: sx / blob.length, cy: sy / blob.length });
        for (const bid of blob) solidPink[bid] = 1;
      }
    }
  }

  const isPinkPatch = (p) => {
    let hit = 0;
    for (const id of p.pixels) if (solidPink[id]) hit++;
    return hit * 2 > p.pixels.length; // 절반 넘게 볼터치면 볼터치 조각으로 본다
  };
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

    // 입은 볼터치와 달리 몸에 포함시킨다(사용자 요청: "두 큰 원 사이 중앙의 작은 조각은 삭제하고
    // 주변과 같은 흰색으로 채운다"). 입과 볼터치는 둘 다 분홍 덩어리라 위치로 가른다 —
    // 입은 두 눈 사이(가운데)에 있고, 볼터치는 눈 바깥쪽에 있다.
    if (dark.length === 2 && pinkBlobs.length) {
      const eyeCx = dark.map((p) => (p.x0 + p.x1) / 2).sort((a, b) => a - b);
      const eyeCy = dark.reduce((sum, p) => sum + (p.y0 + p.y1) / 2, 0) / 2;
      for (const blob of pinkBlobs) {
        const between = blob.cx > eyeCx[0] && blob.cx < eyeCx[1];
        if (!between || blob.cy < eyeCy) continue; // 두 눈 사이 + 눈보다 아래 = 입
        for (const id of blob.pixels) solidPink[id] = 0;
      }
    }
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

  // 몸: 앞에서 정해진 것 말고, 몸통 덩어리와 이어지는 큰 조각들(팔·다리·발 포함).
  {
    const bodyPatch = patches[patchOf[bodySeed]];
    assigned.set(bodyPatch.index, "body");
    for (const p of usable) {
      if (assigned.has(p.index)) continue;
      if (p.n < 400) continue; // 작은 조각은 아래 "이웃 보고 배정" 단계에서 처리한다
      assigned.set(p.index, "body");
    }
  }

  // ── 3-2. 남은 조각을 "이웃한 오브젝트"를 보고 배정한다 ─────────────────
  // 여기가 외곽선과 내부 그림자를 가르는 지점이다. 밝기로 자르면 오브젝트 안쪽의 깊은 그림자까지
  // 잘려나가 색을 바꿨을 때 원래 색 조각이 남는다(사용자 신고). 대신 기하로 구분한다:
  //   - 한 오브젝트에만 둘러싸인 조각  → 그 오브젝트의 내부 음영이므로 그 마스크에 포함
  //   - 서로 다른 두 오브젝트에 걸친 조각 → 둘 사이의 외곽선이므로 어디에도 넣지 않는다(원본 유지)
  // 배정이 퍼져나가도록 몇 번 반복한다.
  {
    const excluded = new Set();
    for (const p of patches) {
      if (!isAttached(p) || isGoldPatch(p) || isPinkPatch(p)) excluded.add(p.index);
    }
    for (const [idx, part] of assigned) if (part === "_fixed") excluded.add(idx);

    for (let round = 0; round < 6; round++) {
      let changed = 0;
      for (const p of patches) {
        if (assigned.has(p.index) || excluded.has(p.index)) continue;
        const touching = new Set();
        for (const id of p.pixels) {
          for (const ni of neighbors(id)) {
            const np = patchOf[ni];
            if (np === -1 || np === p.index) continue;
            const part = assigned.get(np);
            if (part && part !== "_fixed") touching.add(part);
          }
        }
        if (touching.size === 1) {
          assigned.set(p.index, [...touching][0]);
          changed++;
        }
      }
      if (!changed) break;
    }
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

  // ── 4-2. 떨어져 나온 파편 제거 ─────────────────────────────────────────
  // 가계부·가방·잎사귀·눈은 그림에서 한 덩어리로 붙어 있는 물건이다. 그런데 이웃 보고 배정하는
  // 단계에서 엉뚱한 곳의 작은 조각이 딸려 들어오는 일이 있었다(실제로 가계부 마스크에 입 근처
  // 파편 5개 125px이 붙어서, 입 주변이 가계부 색으로 물들고 그 옆 픽셀은 "두 오브젝트에 걸침"으로
  // 판정돼 원본 보라색으로 남았다). 물건은 이어져 있어야 하므로 가장 큰 덩어리만 남긴다.
  // 몸은 팔·다리가 외곽선으로 끊겨 여러 덩어리일 수 있어 제외한다.
  for (const part of parts) {
    if (part === "body") continue;
    const bits = masks[part];
    const seen = new Uint8Array(W * H);
    const blobs = [];
    for (let i = 0; i < W * H; i++) {
      if (!bits[i] || seen[i]) continue;
      const blob = [];
      const stack = [i];
      seen[i] = 1;
      while (stack.length) {
        const cur = stack.pop();
        blob.push(cur);
        for (const ni of neighbors(cur)) {
          if (seen[ni] || !bits[ni]) continue;
          seen[ni] = 1;
          stack.push(ni);
        }
      }
      blobs.push(blob);
    }
    if (blobs.length <= 1) continue;
    blobs.sort((a, b) => b.length - a.length);
    // "가장 큰 것만 남기기"는 쓰면 안 된다 — 가방은 파우치와 어깨끈 고리가 따로 떨어진 두 덩어리고,
    // 눈도 좌·우 두 덩어리다. 반대로 잘못 붙은 파편은 훨씬 작았다(입 근처 96·11·8·8·2px).
    // 그래서 "가장 큰 덩어리에 비해 확연히 작은 것"만 버린다.
    const minKeep = Math.max(200, blobs[0].length * 0.1);
    for (const blob of blobs) {
      if (blob.length >= minKeep) continue;
      for (const id of blob) bits[id] = 0;
    }
  }

  // ── 4-3. 파편을 지운 자리 주변을 다시 판정한다 ─────────────────────────
  // 파편이 붙어 있는 동안에는 그 옆 픽셀이 "몸과 가계부 두 오브젝트에 걸침"으로 보여 어디에도
  // 배정되지 않았다(= 원본 보라색으로 남는 픽셀). 파편을 지웠으니 이제 한 오브젝트에만 닿는
  // 픽셀은 그 오브젝트에 넣어준다. 판정 기준은 앞과 동일하다(닿는 오브젝트가 하나면 내부, 둘이면 경계).
  {
    const protectedPixels = new Uint8Array(W * H);
    for (const [patchIndex, part] of assigned) {
      if (part !== "_fixed") continue;
      for (const id of patches[patchIndex].pixels) protectedPixels[id] = 1;
    }
    for (let round = 0; round < 3; round++) {
      const additions = [];
      for (let i = 0; i < W * H; i++) {
        const x = i % W, y = (i - x) / W;
        if (!isOpaque(x, y) || protectedPixels[i]) continue;
        let owner = null, ambiguous = false;
        for (const part of parts) {
          if (masks[part][i]) { owner = null; ambiguous = true; break; } // 이미 주인이 있다
        }
        if (ambiguous) continue;
        for (const ni of neighbors(i)) {
          for (const part of parts) {
            if (!masks[part][ni]) continue;
            if (owner === null) owner = part;
            else if (owner !== part) ambiguous = true;
          }
          if (ambiguous) break;
        }
        if (owner && !ambiguous) additions.push([i, owner]);
      }
      if (!additions.length) break;
      for (const [i, part] of additions) masks[part][i] = 1;
    }
  }

  // ── 5. 물건 안쪽에 갇힌 작은 무늬(책등의 밝은 띠, ₩, 나비)를 그 물건에 포함 ──
  // 몸에도 적용한다 — 입처럼 몸에 완전히 둘러싸인 구멍을 메우기 위해서다(사용자 요청: "두 큰 원
  // 사이 중앙의 작은 조각을 삭제하고 주변과 같은 흰색으로 채운다"). 눈은 아래 blocked 검사에서
  // "다른 부위 마스크에 속한 구멍"으로 걸러지므로 도로 들어오지 않는다. 캐릭터에서 떨어져 있는
  // 장식(하트·효과선)과 코인은 애초에 둘러싸인 구멍이 아니라 바깥과 이어져 있어 해당 없다.
  for (const part of parts) {
    if (part === "eye") continue;
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
        if (solidGold[id] || solidPink[id]) {
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
  //   - 분홍(볼터치): 모든 마스크에서 제외
  // 밝기로 "어두우면 외곽선" 처리하던 규칙은 없앴다 — 오브젝트 안쪽의 깊은 그림자까지 잘려나가
  // 색을 바꿨을 때 원래 색 조각이 남았기 때문이다(사용자 신고). 외곽선과 내부 음영은 위 3-2에서
  // 기하(이웃한 오브젝트가 몇 개인가)로 구분한다.
  for (const part of parts) {
    const bits = masks[part];
    for (let i = 0; i < bits.length; i++) {
      if (!bits[i]) continue;
      const x = i % W, y = (i - x) / W;
      const [h, s, l] = toHsl(...rgba(x, y).slice(0, 3));

      if (solidGold[i] || solidPink[i]) bits[i] = 0;
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
