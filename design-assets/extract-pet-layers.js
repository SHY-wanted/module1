// 참고 이미지(사용자 제공, design-assets/pet-mascot-reference.png)를 부위별 레이어로 분리하는
// 스크립트(2026-09-15, 4차 수정) — public/pets/*-gray.png·*-fixed.png가 이 스크립트의 결과물이다.
// 재실행: `node design-assets/extract-pet-layers.js` (프로젝트 루트에서, sharp가 있어야 함).
//
// 이력(요약): 1차 도형 마스크 → 2차 알 단계 눈·잎사귀 보정 → 3차 dest-in/out이 알파 채널로만
// 동작한다는 걸 몰라서 1채널 마스크가 무시되던 버그 수정 + 흰자 타원이 커서 몸 색 바꿔도 눈 주위에
// 고리가 남던 문제 수정 → 4차(이번): "눈동자(pupils)" 타원도 흰자와 똑같은 문제가 있었다 — 실제
// 눈동자보다 훨씬 큰 타원이라, 기본 눈 색(#2D2A3E, 채도 낮은 남색)이 그 큰 범위에 통으로 칠해지면서
// 주변보다 확 튀는 "회색/라벤더 동그라미"로 보였다(사용자 신고, 2026-09-15 스크린샷 4장). 흰자와
// 마찬가지로 타원 대신 "그 범위 안에서 실제로 어두운 픽셀만" 골라내는 방식으로 통일했다 — 이제
// 눈동자·흰자 전부 색 임계값 기반이고, 타원은 볼·입·잎사귀·가계부·가방처럼 경계가 뚜렷한 부위에만 쓴다.
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
    leaf: [ellipse(134, 42, 74, 46)],
    eyeBoxes: [{ x0: 45, x1: 155, y0: 105, y1: 205 }, { x0: 130, x1: 240, y0: 98, y1: 200 }],
    pupilDark: true,
    eyeWhite: true,
    fixed: [
      ellipse(148, 197, 19, 13),
      ellipse(70, 188, 20, 14), ellipse(213, 182, 20, 14),
      ellipse(240, 50, 26, 26),
    ],
  },
  "stage-3": {
    leaf: [ellipse(135, 48, 78, 56)],
    ledger: [rect(130, 246, 92, 64, 10)],
    eyeBoxes: [{ x0: 45, x1: 160, y0: 120, y1: 235 }, { x0: 150, x1: 265, y0: 110, y1: 225 }],
    pupilDark: true,
    eyeWhite: true,
    fixed: [
      ellipse(168, 214, 21, 15),
      ellipse(75, 205, 23, 16), ellipse(240, 198, 23, 16),
      rect(228, 10, 45, 65),
    ],
  },
  "stage-4": {
    leaf: [ellipse(220, 50, 105, 60)],
    bag: [ellipse(75, 375, 60, 60), ellipse(65, 345, 15, 11)],
    eyeBoxes: [{ x0: 65, x1: 210, y0: 135, y1: 280 }, { x0: 185, x1: 330, y0: 125, y1: 265 }],
    pupilDark: true,
    eyeWhite: true,
    fixed: [
      ellipse(222, 259, 27, 17),
      ellipse(115, 271, 27, 17), ellipse(290, 251, 27, 17),
      rect(255, 0, 106, 175),
    ],
  },
  "stage-3-sulking": {
    // 크롭 직후 좌상단에 stage-4의 코인/반짝임이 새어 들어와서 지워야 한다(eraseFirst).
    eraseFirst: [rect(0, 0, 42, 148), rect(0, 140, 16, 40)],
    leaf: [ellipse(150, 85, 72, 55)],
    eyeBoxes: [{ x0: 50, x1: 165, y0: 190, y1: 305 }, { x0: 160, x1: 275, y0: 180, y1: 295 }],
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

    // 고정 요소(원색 그대로) = 흰자(색 임계값, 있으면) ∪ 나머지 fixed 도형들
    const fixedParts = cfg.fixed ? [maskSvg(w, h, cfg.fixed)] : [];
    if (cfg.eyeWhite) {
      const whiteMask = await buildMaskFromPredicate(srcBuf, (r, g, b, a, x, y) => {
        if (!inBoxes(cfg.eyeBoxes, x, y) || a <= 40) return false;
        const minC = Math.min(r, g, b), maxC = Math.max(r, g, b);
        return minC > WHITE_MIN_CHANNEL && maxC - minC < WHITE_MAX_SPREAD;
      });
      fixedParts.push(whiteMask);
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
