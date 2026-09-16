/*
 * scripts/repair-stage3-coin.js
 * ------------------------------------------------------------------
 * public/stage_3_adult.png 의 코인이 이미지 오른쪽 끝에서 잘려 있는 것을 복원한다.
 *
 * 원본 파일 자체가 잘려 있다 — 코인의 금색 픽셀이 마지막 열(x=374)까지 닿아 있고, 그 너머의
 * 픽셀은 파일에 존재하지 않는다. 측정값:
 *   코인 bbox  x 282~374(폭 93) / y 127~228(높이 102)
 *   세로는 안 잘렸으므로 지름 ≈ 102 → 오른쪽으로 약 9px이 사라진 상태
 *
 * 없는 픽셀은 만들어낼 수밖에 없는데, 코인은 원형이라 좌우가 대칭이다. 그래서 캔버스를 오른쪽으로
 * 넓힌 뒤 "코인 자신의 왼쪽 테두리"를 중심선 기준으로 거울처럼 옮겨 빈 곳을 채운다. 새 디자인을
 * 지어내는 게 아니라 같은 코인의 반대쪽을 그대로 쓰는 것이라 크기·색·디자인이 그대로 유지된다.
 * 캐릭터 몸을 비롯한 다른 픽셀은 하나도 건드리지 않는다(캔버스만 오른쪽으로 늘어난다).
 *
 * 같은 파일에 두 번 돌려도 안전하다(이미 복원돼 있으면 그냥 넘어간다).
 *
 * 실행: node scripts/repair-stage3-coin.js
 */
const sharp = require("sharp");
const path = require("path");

const FILE = path.join(__dirname, "..", "public", "stage_3_adult.png");
const NEW_WIDTH = 387; // 375 + 12 (필요한 9px + 여유)

function isGold(r, g, b) {
  const R = r / 255, G = g / 255, B = b / 255;
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
  const l = (mx + mn) / 2;
  if (mx === mn) return false;
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h;
  if (mx === R) h = (G - B) / d + (G < B ? 6 : 0);
  else if (mx === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  h = (h / 6) * 360;
  return h >= 25 && h <= 70 && s * 100 > 35;
}

(async () => {
  const meta = await sharp(FILE).metadata();
  if (meta.width >= NEW_WIDTH) {
    console.log(`이미 복원됨 (폭 ${meta.width}) — 아무것도 하지 않음`);
    return;
  }
  const W = meta.width, H = meta.height;
  const { data } = await sharp(FILE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // 코인(가장 큰 금색 덩어리) 찾기
  const seen = new Uint8Array(W * H);
  let coin = null;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const id = y * W + x;
      const o = id * 4;
      if (seen[id] || data[o + 3] < 60 || !isGold(data[o], data[o + 1], data[o + 2])) continue;
      const stack = [id];
      seen[id] = 1;
      const pix = [];
      while (stack.length) {
        const cur = stack.pop();
        pix.push(cur);
        const cx = cur % W, cy = (cur - cx) / W;
        const nb = [];
        if (cx > 0) nb.push(cur - 1);
        if (cx < W - 1) nb.push(cur + 1);
        if (cy > 0) nb.push(cur - W);
        if (cy < H - 1) nb.push(cur + W);
        for (const ni of nb) {
          const no = ni * 4;
          if (seen[ni] || data[no + 3] < 60 || !isGold(data[no], data[no + 1], data[no + 2])) continue;
          seen[ni] = 1;
          stack.push(ni);
        }
      }
      if (!coin || pix.length > coin.length) coin = pix;
    }
  }
  if (!coin) throw new Error("코인을 찾지 못했습니다");

  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (const id of coin) {
    const x = id % W, y = (id - x) / W;
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  // 세로는 잘리지 않았으므로 세로 지름을 진짜 지름으로 본다.
  const diameter = y1 - y0 + 1;
  const radius = (diameter - 1) / 2;
  const centerY = (y0 + y1) / 2;
  const centerX = x0 + radius; // 왼쪽 끝은 안 잘렸으므로 거기서 반지름만큼이 중심
  console.log(`코인 중심 (${centerX}, ${centerY}) 반지름 ${radius} → 오른쪽 끝 x=${Math.round(centerX + radius)}`);

  // 캔버스를 넓히고 원본을 그대로 옮긴 뒤, 잘려나간 오른쪽 호를 왼쪽에서 거울로 채운다.
  const out = Buffer.alloc(NEW_WIDTH * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const src = (y * W + x) * 4;
      const dst = (y * NEW_WIDTH + x) * 4;
      out[dst] = data[src];
      out[dst + 1] = data[src + 1];
      out[dst + 2] = data[src + 2];
      out[dst + 3] = data[src + 3];
    }
  }

  let filled = 0;
  for (let y = Math.floor(centerY - radius); y <= Math.ceil(centerY + radius); y++) {
    if (y < 0 || y >= H) continue;
    for (let x = W; x < NEW_WIDTH; x++) {
      // 코인 원 안쪽만 채운다
      const dx = x - centerX, dy = y - centerY;
      if (dx * dx + dy * dy > (radius + 0.5) * (radius + 0.5)) continue;
      const mirrorX = Math.round(2 * centerX - x);
      if (mirrorX < 0 || mirrorX >= W) continue;
      const src = (y * W + mirrorX) * 4;
      if (data[src + 3] < 60) continue;
      const dst = (y * NEW_WIDTH + x) * 4;
      out[dst] = data[src];
      out[dst + 1] = data[src + 1];
      out[dst + 2] = data[src + 2];
      out[dst + 3] = data[src + 3];
      filled++;
    }
  }

  await sharp(out, { raw: { width: NEW_WIDTH, height: H, channels: 4 } }).png().toFile(FILE);
  console.log(`폭 ${W} → ${NEW_WIDTH}, 거울로 채운 픽셀 ${filled}개`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
