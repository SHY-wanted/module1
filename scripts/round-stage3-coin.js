/*
 * scripts/round-stage3-coin.js
 * ------------------------------------------------------------------
 * public/stage_3_adult.png 의 코인을 정원으로 다시 만든다.
 *
 * scripts/repair-stage3-coin.js가 캔버스 오른쪽 끝에서 잘려 있던 코인을 복원했지만, 그 복원은
 * 코인을 타원(가로 반지름 ≈46.5, 세로 반지름 ≈50.5)으로 보고 만들었다. 세로는 원본에서 잘리지
 * 않았으니 세로 반지름은 믿을 수 있는 값이지만, 가로가 그보다 8.6% 좁아서 오른쪽이 실제보다
 * 덜 나와 있다 — 사용자 신고: "코인 오른쪽이 조금 짤리는데 동그랗게 만들어달라".
 *
 * 그래서 세로 반지름(50.5, 안 잘렸으므로 신뢰)을 기준으로 코인 전체를 정원으로 다시 계산한다.
 * 왼쪽 절반(센터 x=328.5 기준)은 한 번도 잘리거나 합성된 적 없는 원본 그대로이므로, 그 절반을
 * 오른쪽으로 늘려 붙이는 방식을 쓴다 — 새 디자인을 지어내는 게 아니라 같은 코인의 왼쪽 절반을
 * 그대로 다시 쓰는 것이다.
 *
 * [행마다 다시 재는 대신 상수 비율을 쓰는 이유]
 * 처음엔 행마다 실측한 왼쪽 끝(정수 픽셀)으로 그 행의 확대 비율을 따로 계산했는데, 실측값이
 * 정수 단위로 계단져 있어서(예: 46.5가 세 행 연속 그대로 있다가 45.5로 뚝 떨어짐) 그대로 쓰면
 * 거울에 비친 오른쪽 테두리가 톱니처럼 울퉁불퉁해졌다. 두 타원이 세로 반지름을 공유하면 같은
 * 행에서 가로로 뻗은 거리의 비율은 어느 행에서나 항상 같은 상수(가로반지름/세로반지름)라는
 * 성질을 이용해, 행마다 다시 재지 않고 이 상수 하나로 매끄럽게 늘린다. 실측값은 "원본 그림을
 * 넘어서 배경(또는 코인을 쥔 팔)까지 잘못 읽지 않도록" 막는 안전판으로만 쓴다.
 *
 * 바깥 테두리 1~2px는 원본의 안티에일리어싱(더 좁은 타원 기울기에 맞춰져 있던 것) 대신, 새
 * 원의 반지름 기준으로 매끄럽게 다시 계산한 알파를 얹는다 — 안 그러면 늘어난 만큼 안티에일리어싱
 * 폭도 어긋나 가장자리가 거칠어 보인다.
 *
 * 코인 오른쪽 아래는 캐릭터가 코인을 쥔 팔(보라색)에 맞닿아 있다. 이 스크립트는 캔버스 중심선
 * (x=328.5) 왼쪽은 절대 읽지도 쓰지도 않으므로 팔은 건드리지 않는다.
 *
 * 실행: node scripts/round-stage3-coin.js
 * (반드시 scripts/repair-stage3-coin.js 다음에 실행 — 이 스크립트는 이미 폭이 넓어진 380px
 *  캔버스를 입력으로 기대한다.)
 */
const sharp = require("sharp");
const path = require("path");

const FILE = path.join(__dirname, "..", "public", "stage_3_adult.png");
/** 코인이 정원 반지름(50.5) + 안티에일리어싱 여유까지 온전히 들어갈 캔버스 폭. */
const NEW_WIDTH = 384;
/** 바깥 경계에서 이만큼은 원의 반지름 기준으로 다시 매끄럽게 페이드아웃시킨다. */
const EDGE_FEATHER = 3;
/** 실측: 코인 왼쪽(잘린 적 없는) 절반의 가로 반지름. */
const RADIUS_X = 46.5;
/** 코인의 가로 중심 x. 잘리지 않은 행들의 좌우 중점을 평균한, 여러 차례 검증된 값. */
const CENTER_X = 328.5;

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
  const W0 = meta.width, H = meta.height;
  const { data } = await sharp(FILE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // 코인(가장 큰 금색 덩어리) 찾기 — repair-stage3-coin.js와 같은 방식.
  const seen = new Uint8Array(W0 * H);
  let coin = null;
  for (let i = 0; i < W0 * H; i++) {
    const o = i * 4;
    if (seen[i] || data[o + 3] < 60 || !isGold(data[o], data[o + 1], data[o + 2])) continue;
    const stack = [i];
    seen[i] = 1;
    const pix = [];
    while (stack.length) {
      const cur = stack.pop();
      pix.push(cur);
      const cx = cur % W0, cy = (cur - cx) / W0;
      const nb = [];
      if (cx > 0) nb.push(cur - 1);
      if (cx < W0 - 1) nb.push(cur + 1);
      if (cy > 0) nb.push(cur - W0);
      if (cy < H - 1) nb.push(cur + W0);
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

  const inCoin = new Uint8Array(W0 * H);
  let y0 = H, y1 = 0;
  for (const id of coin) {
    inCoin[id] = 1;
    const y = (id - (id % W0)) / W0;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  // 세로는 원본에서 한 번도 잘린 적이 없으므로 위아래 끝이 곧 진짜 세로 지름이다.
  const centerY = (y0 + y1) / 2;
  const radiusY = (y1 - y0) / 2;
  const stretch = radiusY / RADIUS_X;
  console.log(`coin y0=${y0} y1=${y1} centerY=${centerY} radiusY=${radiusY} stretch=${stretch.toFixed(4)}`);

  // 캔버스를 넓히고 원본을 그대로 옮긴다. 새로 생긴 칸은 Buffer.alloc이 이미 투명(0)으로 채운다.
  const out = Buffer.alloc(NEW_WIDTH * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W0; x++) {
      const src = (y * W0 + x) * 4;
      const dst = (y * NEW_WIDTH + x) * 4;
      out[dst] = data[src]; out[dst + 1] = data[src + 1]; out[dst + 2] = data[src + 2]; out[dst + 3] = data[src + 3];
    }
  }

  function sampleBilinear(fx, y) {
    const x0 = Math.floor(fx), x1 = x0 + 1;
    const t = fx - x0;
    const o0 = (y * W0 + Math.max(0, Math.min(W0 - 1, x0))) * 4;
    const o1 = (y * W0 + Math.max(0, Math.min(W0 - 1, x1))) * 4;
    const px = [0, 0, 0, 0];
    for (let c = 0; c < 4; c++) px[c] = data[o0 + c] * (1 - t) + data[o1 + c] * t;
    return px;
  }

  function authenticLeftEdge(y) {
    for (let x = 0; x <= Math.floor(CENTER_X); x++) {
      if (inCoin[y * W0 + x]) return x;
    }
    return -1;
  }

  let rewritten = 0;
  for (let y = Math.max(0, y0 - 3); y <= Math.min(H - 1, y1 + 3); y++) {
    const dy = y - centerY;
    const targetSq = radiusY * radiusY - dy * dy;
    if (targetSq < 0) continue;
    const targetDist = Math.sqrt(targetSq);
    const maxOffset = targetDist + EDGE_FEATHER;

    const lx = authenticLeftEdge(y);
    const leftCap = lx < 0 ? RADIUS_X : CENTER_X - lx + 1.5; // 실측 경계 + 약간의 여유

    // 이 행의 예전(타원 기준) 오른쪽 절반을 지우고 새로 그린다.
    const clearTo = Math.min(NEW_WIDTH - 1, Math.ceil(CENTER_X + maxOffset + 2));
    for (let x = Math.ceil(CENTER_X); x <= clearTo; x++) {
      const dst = (y * NEW_WIDTH + x) * 4;
      out[dst] = 0; out[dst + 1] = 0; out[dst + 2] = 0; out[dst + 3] = 0;
    }

    for (let offset = 0.5; offset <= maxOffset; offset += 1) {
      const sourceOffset = Math.min(offset / stretch, leftCap);
      const px = sampleBilinear(CENTER_X - sourceOffset, y);
      if (px[3] < 1) continue;

      // 원의 반지름 기준 매끄러운 페이드아웃 — 원본 안티에일리어싱은 더 좁은 타원 기울기에
      // 맞춰져 있어 그대로 늘리면 가장자리가 거칠어진다.
      const dist = Math.sqrt(offset * offset + dy * dy);
      const edgeT = (radiusY + EDGE_FEATHER - dist) / EDGE_FEATHER;
      const edgeMul = edgeT >= 1 ? 1 : edgeT <= 0 ? 0 : edgeT * edgeT * (3 - 2 * edgeT);
      const alpha = (px[3] / 255) * edgeMul;
      if (alpha < 0.01) continue;

      const destX = Math.round(CENTER_X + offset);
      if (destX >= NEW_WIDTH) continue;
      const dst = (y * NEW_WIDTH + destX) * 4;
      out[dst] = px[0]; out[dst + 1] = px[1]; out[dst + 2] = px[2]; out[dst + 3] = Math.round(alpha * 255);
      rewritten++;
    }
  }
  console.log(`다시 그린 픽셀 ${rewritten}개, 캔버스 폭 ${W0} → ${NEW_WIDTH}`);

  await sharp(out, { raw: { width: NEW_WIDTH, height: H, channels: 4 } }).png().toFile(FILE);
  console.log("완료:", FILE);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
