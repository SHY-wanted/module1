/*
 * scripts/repair-stage3-coin.js
 * ------------------------------------------------------------------
 * public/stage_3_adult.png 의 코인이 이미지 오른쪽 끝에서 잘려 있는 것을 복원한다.
 *
 * 원본 파일 자체가 잘려 있다 — 코인의 오른쪽 끝이 캔버스 마지막 열(x=374)에 맞닿아 있고 그 너머의
 * 픽셀은 파일에 없다. 그래서 오른쪽 테두리의 둥근 호와 부드러운 가장자리가 사라지고, 칼로 자른
 * 듯한 직선으로 보인다.
 *
 * 코인의 모양은 정원이 아니라 살짝 눕힌 타원이다. 잘리지 않은 행들에서 좌우 끝의 한가운데를 재면
 * 가로 중심이 나오고, 세로는 잘리지 않았으므로 위아래 끝이 그대로 세로 지름이 된다. 측정값:
 *   가로 중심 x ≈ 328.5, 가로 반지름 ≈ 46.5
 *   세로 중심 y ≈ 177.5, 세로 반지름 ≈ 50.5  (즉 오른쪽 끝은 x ≈ 375)
 * 예전 버전은 이걸 정원으로 보고 반지름을 세로 기준(50.5)으로 잡는 바람에 중심이 4px 오른쪽으로
 * 밀렸고, 채운 조각이 코인 본체에서 떨어져 나와 초승달처럼 떠 보였다.
 *
 * 없는 픽셀은 만들어낼 수밖에 없는데, 코인은 좌우가 대칭이다. 그래서 캔버스를 오른쪽으로 조금
 * 넓힌 뒤 "코인 자신의 왼쪽 테두리"를 가로 중심선 기준으로 거울처럼 옮겨 빈 곳만 채운다. 이미
 * 그려져 있는 픽셀은 하나도 건드리지 않는다(투명한 자리에만 쓴다). 새 디자인을 지어내는 게 아니라
 * 같은 코인의 반대쪽을 그대로 쓰는 것이라 크기·색·디자인이 그대로 유지된다.
 *
 * 같은 파일에 두 번 돌려도 안전하다(이미 복원돼 있으면 그냥 넘어간다).
 *
 * 실행: node scripts/repair-stage3-coin.js
 */
const sharp = require("sharp");
const path = require("path");

const FILE = path.join(__dirname, "..", "public", "stage_3_adult.png");
/** 잘린 1~2px + 캐릭터가 화면 끝에 붙어 보이지 않을 만큼의 여백. */
const NEW_WIDTH = 380;
/** 타원 경계에서 이만큼 바깥까지는 가장자리(안티에일리어싱)로 보고 같이 채운다. */
const EDGE_SLACK = 1.5;

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
  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    if (seen[i] || data[o + 3] < 60 || !isGold(data[o], data[o + 1], data[o + 2])) continue;
    const stack = [i];
    seen[i] = 1;
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
  if (!coin) throw new Error("코인을 찾지 못했습니다");

  const inCoin = new Uint8Array(W * H);
  let y0 = H, y1 = 0;
  for (const id of coin) {
    inCoin[id] = 1;
    const y = (id - (id % W)) / W;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }

  // 세로는 잘리지 않았으므로 위아래 끝이 곧 세로 지름이다.
  const centerY = (y0 + y1) / 2;
  const radiusY = (y1 - y0) / 2;

  // 가로 중심은 "잘리지 않은 행"에서만 좌우 끝의 한가운데를 모아 평균낸다. 캔버스 마지막 열에
  // 닿은 행은 오른쪽 끝을 믿을 수 없으므로 뺀다.
  const mids = [];
  let minLeft = W;
  for (let y = y0; y <= y1; y++) {
    let lx = -1, rx = -1;
    for (let x = 0; x < W; x++) {
      if (!inCoin[y * W + x]) continue;
      if (lx < 0) lx = x;
      rx = x;
    }
    if (lx < 0) continue;
    if (lx < minLeft) minLeft = lx;
    if (rx < W - 1) mids.push((lx + rx) / 2);
  }
  if (mids.length < 8) throw new Error("잘리지 않은 행이 너무 적어 중심을 잴 수 없습니다");
  const centerX = mids.reduce((a, b) => a + b, 0) / mids.length;
  const radiusX = centerX - minLeft;
  console.log(
    `코인 중심 (${centerX.toFixed(1)}, ${centerY}) 반지름 가로 ${radiusX.toFixed(1)} / 세로 ${radiusY}` +
    ` → 오른쪽 끝 x ≈ ${Math.round(centerX + radiusX)} (캔버스는 ${W - 1}에서 끝남)`
  );

  // 캔버스를 넓히고 원본을 그대로 옮긴다.
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

  // 타원 안쪽인데 비어 있는 자리만 왼쪽에서 거울로 채운다.
  let filled = 0;
  const ax = radiusX + EDGE_SLACK, by = radiusY + EDGE_SLACK;
  for (let y = Math.floor(centerY - by); y <= Math.ceil(centerY + by); y++) {
    if (y < 0 || y >= H) continue;
    for (let x = Math.floor(centerX); x < NEW_WIDTH; x++) {
      const u = (x - centerX) / ax, v = (y - centerY) / by;
      if (u * u + v * v > 1) continue;
      const dst = (y * NEW_WIDTH + x) * 4;
      if (out[dst + 3] >= 8) continue; // 이미 그려진 픽셀은 건드리지 않는다
      const mirrorX = Math.round(2 * centerX - x);
      if (mirrorX < 0 || mirrorX >= W) continue;
      const src = (y * W + mirrorX) * 4;
      if (data[src + 3] < 8) continue;
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
