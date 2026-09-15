// 참고 이미지(사용자 제공, design-assets/pet-mascot-reference.png)를 부위별 레이어로 분리하는
// 스크립트(2026-09-15, 6차 수정) — public/pets/*-gray.png·*-fixed.png가 이 스크립트의 결과물이다.
// 재실행: `node design-assets/extract-pet-layers.js` (프로젝트 루트에서, sharp가 있어야 함).
//
// 이력(요약): 1차 도형 마스크 → 2차 알 단계 눈·잎사귀 보정 → 3차 dest-in/out이 알파 채널로만
// 동작한다는 걸 몰라서 1채널 마스크가 무시되던 버그 수정 + 흰자 타원이 커서 몸 색 바꿔도 눈 주위에
// 고리가 남던 문제 수정 → 4차 "눈동자(pupils)" 타원도 흰자와 똑같은 문제(실제보다 큰 타원 → 기본
// 눈 색이 큰 범위에 칠해져 회색 동그라미로 튐)를 색 임계값(eyeBoxes) 방식으로 수정 → 5차(이번):
// stage-2(유년기)에서 왼쪽 눈 "아래쪽"이 안 바뀌는 문제·새싹 색이 잘 안 바뀌는 문제가 남아있었다
// (사용자 신고, 2026-09-15) — eyeBoxes가 실제 눈동자 하단을 살짝 잘라내고 있었고(픽셀 스캔으로
// 확인: 실제 눈동자가 상자 경계 y1 바로 너머까지 이어짐), leaf 타원도 여전히 작았다. 전 스테이지의
// eyeBoxes·leaf 타원을 픽셀 단위 다크/알파 스캔으로 다시 재서 넉넉하게 키웠다(스캔할 때 입·가계부·
// 가방·코인처럼 눈동자와 무관한 어두운 요소가 섞여 들어오지 않도록 탐색 범위를 얼굴 부분으로 좁혀서
// 오염을 피했다 — 자세한 좌표 근거는 git 히스토리의 스캔 로그 참고).
const sharp = require("sharp");
const path = require("path");

const REF = path.join(__dirname, "pet-mascot-reference.png");
const DIR = path.join(__dirname, "..", "public", "pets");

function ellipse(cx, cy, rx, ry) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white"/>`;
}
function rect(x, y, w, h, rx = 0) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="white"/>`;
}
function maskSvg(width, height, shapes) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${shapes.join("")}</svg>`);
}

// 1536x1024 합성본에서 스테이지별로 크롭할 좌표(참고 이미지를 육안+알파 스캔으로 잡음).
const CROPS = {
  "stage-1-egg": { left: 0, top: 385, width: 265, height: 330 },
  "stage-2": { left: 265, top: 370, width: 278, height: 345 },
  "stage-3": { left: 543, top: 290, width: 286, height: 425 },
  "stage-4": { left: 829, top: 200, width: 361, height: 515 },
  "stage-3-sulking": { left: 1190, top: 285, width: 346, height: 430 },
};

// 부위별 마스크. leaf/ledger/bag/볼/입처럼 경계가 뚜렷한 부위는 타원·사각형 도형으로, 눈동자·흰자처럼
// 타원으로 근사하면 주변 픽셀까지 크게 잡혀버리는 부위는 eyeBoxes(탐색 범위) 안에서 색 임계값으로
// 골라낸다(pupilDark=어두운 픽셀, eyeWhite=거의 흰 픽셀).
const STAGES = {
  "stage-1-egg": {
    leaf: [ellipse(140, 65, 66, 50)],
    eyeBoxes: [{ x0: 100, x1: 225, y0: 180, y1: 225 }], // 감은 눈(얇은 곡선) — pupilDark만 해당
    pupilDark: true,
    fixed: [ellipse(95, 232, 26, 16), ellipse(228, 220, 26, 16)], // 볼
  },
  "stage-2": {
    // 잎사귀·눈동자 범위 둘 다 실제 알파/색 경계를 픽셀 단위로 스캔해서 넓혔다(2026-09-15 사용자
    // 신고: 왼쪽 눈 아래·새싹 색이 안 바뀜 — 이전 범위가 실제 모양보다 작아서 잘려나갔던 게 원인).
    leaf: [ellipse(138, 60, 80, 50)],
    eyeBoxes: [{ x0: 75, x1: 148, y0: 145, y1: 222 }, { x0: 132, x1: 225, y0: 135, y1: 218 }],
    pupilDark: true,
    eyeWhite: true,
    // 볼·입은 좌표를 눈대중으로 잡았더니 실제 위치와 안 맞아서(2026-09-15 사용자 스크린샷 신고:
    // "입 근처 타원 하나, 왼쪽 눈 옆 타원 하나") 엉뚱한 자리에 떠 있는 타원처럼 보였다 — 흰자와
    // 같은 방식으로, 색(핑크빛: R·B는 높고 G만 낮음, 라벤더 몸통과 다름)으로 실제 위치를 찾는다.
    cheekMouthBox: { boxes: [{ x0: 0, x1: 278, y0: 150, y1: 260 }] },
    fixed: [ellipse(240, 50, 26, 26)], // 하트 장식만 도형으로 남김
  },
  "stage-3": {
    leaf: [ellipse(135, 70, 95, 62)],
    ledger: [rect(130, 246, 92, 64, 10)],
    eyeBoxes: [{ x0: 85, x1: 155, y0: 175, y1: 252 }, { x0: 145, x1: 248, y0: 155, y1: 250 }],
    pupilDark: true,
    eyeWhite: true,
    cheekMouthBox: { boxes: [{ x0: 0, x1: 286, y0: 180, y1: 290 }] },
    fixed: [rect(228, 10, 45, 65)], // 우측 상단 모션 라인만 도형으로 남김
  },
  "stage-4": {
    leaf: [ellipse(147, 85, 112, 72)],
    bag: [ellipse(75, 375, 60, 60), ellipse(65, 345, 15, 11)],
    eyeBoxes: [{ x0: 110, x1: 205, y0: 210, y1: 296 }, { x0: 185, x1: 302, y0: 180, y1: 300 }],
    pupilDark: true,
    eyeWhite: true,
    // 코인·반짝임은 y<175에만 있어서(rect 255,0,106,175) x는 안 끊어도 안전 — 오른쪽 볼이 x=284
    // 근처까지 있어서 처음에 x1을 250으로 좁혔다가 오른쪽 볼이 통째로 잘려나갔었다(수정).
    cheekMouthBox: { boxes: [{ x0: 0, x1: 340, y0: 220, y1: 340 }] },
    fixed: [rect(255, 0, 106, 175)], // 코인+반짝임만 도형으로 남김
  },
  "stage-3-sulking": {
    // 크롭 직후 좌상단에 stage-4의 코인/반짝임이 새어 들어와서 지워야 한다(eraseFirst).
    eraseFirst: [rect(0, 0, 42, 148), rect(0, 140, 16, 40)],
    leaf: [ellipse(150, 90, 85, 62)],
    eyeBoxes: [{ x0: 55, x1: 170, y0: 225, y1: 305 }, { x0: 160, x1: 260, y0: 220, y1: 296 }],
    pupilDark: true,
    eyeWhite: true,
    fixed: [
      ellipse(165, 286, 19, 11),
      ellipse(80, 266, 21, 14), ellipse(225, 259, 21, 14),
      rect(240, 50, 100, 120),
    ],
  },
};

const DARK_LUMA_THRESHOLD = 140; // 이보다 어두우면 눈동자(잉크)로 인정
const WHITE_MIN_CHANNEL = 200; // 이보다 밝고
const WHITE_MAX_SPREAD = 22; // 채널 간 차이가 이보다 작으면(=채도 낮음) 흰자로 인정

// 픽셀 단위 마스크 공통 빌더 — predicate(r,g,b,a,x,y)가 true인 픽셀만 알파 255로 채운 RGBA PNG를
// 만든다. dest-in/dest-out은 "알파 채널"로만 동작하므로 항상 4채널로 만들어야 한다.
async function buildMaskFromPredicate(srcBuf, predicate) {
  const { data, info } = await sharp(srcBuf).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (predicate(r, g, b, a, x, y)) {
        const o = (y * width + x) * 4;
        out[o] = 255; out[o + 1] = 255; out[o + 2] = 255; out[o + 3] = 255;
      }
    }
  }
  return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

function inBoxes(boxes, x, y) {
  return boxes.some((b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1);
}

async function unionAlpha(pngBuffers) {
  const bufs = await Promise.all(pngBuffers.map((s) => sharp(s).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
  const { width, height, channels } = bufs[0].info;
  const out = Buffer.alloc(width * height * channels);
  for (const { data } of bufs) {
    for (let i = channels - 1; i < data.length; i += channels) {
      if (data[i] > out[i]) out[i] = data[i];
    }
  }
  return sharp(out, { raw: { width, height, channels } }).png().toBuffer();
}

async function run() {
  for (const [stage, cfg] of Object.entries(STAGES)) {
    const crop = CROPS[stage];
    let srcPipeline = sharp(REF).extract(crop);
    if (cfg.eraseFirst) {
      srcPipeline = srcPipeline.composite([{ input: maskSvg(crop.width, crop.height, cfg.eraseFirst), blend: "dest-out" }]);
    }
    const srcBuf = await srcPipeline.png().toBuffer();
    const w = crop.width, h = crop.height;

    const grayBuf = await sharp(srcBuf).greyscale().png().toBuffer();
    const holeBuffers = []; // body에서 뺄 마스크들 — dest-out에 그대로 쓴다.

    // 경계가 뚜렷한 부위(잎사귀/가계부/가방) — 도형 기반
    for (const part of ["leaf", "ledger", "bag"]) {
      const shapes = cfg[part];
      if (!shapes) continue;
      const mask = maskSvg(w, h, shapes);
      holeBuffers.push(mask);
      await sharp(grayBuf).composite([{ input: mask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-${part}-gray.png`));
    }

    // 눈동자 — eyeBoxes 안에서 어두운 픽셀만(타원 대신 색 임계값, 2026-09-15 4차 수정으로 도입).
    if (cfg.pupilDark) {
      const pupilMask = await buildMaskFromPredicate(srcBuf, (r, g, b, a, x, y) => {
        if (!inBoxes(cfg.eyeBoxes, x, y) || a <= 40) return false;
        return 0.3 * r + 0.59 * g + 0.11 * b < DARK_LUMA_THRESHOLD;
      });
      holeBuffers.push(pupilMask);
      await sharp(grayBuf).composite([{ input: pupilMask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-pupils-gray.png`));
    }

    // 고정 요소(원색 그대로) = 흰자·볼·입(색 임계값, 있으면) ∪ 나머지 fixed 도형들
    const fixedParts = cfg.fixed ? [maskSvg(w, h, cfg.fixed)] : [];
    if (cfg.eyeWhite) {
      const whiteMask = await buildMaskFromPredicate(srcBuf, (r, g, b, a, x, y) => {
        if (!inBoxes(cfg.eyeBoxes, x, y) || a <= 40) return false;
        const minC = Math.min(r, g, b), maxC = Math.max(r, g, b);
        return minC > WHITE_MIN_CHANNEL && maxC - minC < WHITE_MAX_SPREAD;
      });
      fixedParts.push(whiteMask);
    }
    if (cfg.cheekMouthBox) {
      // 볼 홍조·입은 라벤더 몸통과 달리 R·B가 높고 G만 낮은 핑크빛 — 이 색 신호로 실제 위치를 찾는다
      // (2026-09-15 5차 수정에서 좌표를 눈대중으로 잡았다가 엉뚱한 자리에 떠서 이번에 바꿨다).
      const pinkMask = await buildMaskFromPredicate(srcBuf, (r, g, b, a, x, y) => {
        if (!inBoxes(cfg.cheekMouthBox.boxes, x, y) || a <= 40) return false;
        return (r + b) / 2 - g > 30 && Math.abs(r - b) < 15;
      });
      fixedParts.push(pinkMask);
    }
    if (fixedParts.length > 0) {
      const fixedMask = await unionAlpha(fixedParts);
      holeBuffers.push(fixedMask);
      await sharp(srcBuf).composite([{ input: fixedMask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-fixed.png`));
    }

    // body = 원본 알파 - 모든 구멍(도형/눈동자/흰자 마스크)
    await sharp(grayBuf)
      .composite(holeBuffers.map((buf) => ({ input: buf, blend: "dest-out" })))
      .png()
      .toFile(path.join(DIR, `${stage}-body-gray.png`));

    console.log("done", stage);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
