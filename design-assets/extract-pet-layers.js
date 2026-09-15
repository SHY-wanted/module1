// 참고 이미지(사용자 제공, design-assets/pet-mascot-reference.png)를 부위별 레이어로 분리하는
// 스크립트(2026-09-15, 2차 수정) — public/pets/*-gray.png·*-fixed.png가 이 스크립트의 결과물이다.
// 1차 버전은 stage_index=1(알)의 눈 마스크가 타원이라 실제 얇은 곡선보다 훨씬 크게 잡혀 "회색
// 동그라미"로 보였고(사용자 신고, 2026-09-15), 잎사귀 타원도 실제 잎보다 작아서 색이 잘 안 바뀌는
// 것처럼 보였다 — 이번 버전은 원본 이미지를 이 스크립트가 직접 크롭하는 것부터 다시 하고, 알 단계
// 눈은 밝기(luma) 임계값으로 실제 잉크 픽셀만 골라내고, 잎사귀 타원은 전부 여유 있게 키웠다.
// 재실행: `node design-assets/extract-pet-layers.js` (프로젝트 루트에서, sharp가 있어야 함).
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

// 부위별 마스크 도형. leaf는 실제 알파 경계보다 조금 더 넉넉하게 잡았다(작으면 "색이 안 바뀌는
// 것처럼" 보이고, 조금 크더라도 z-order상 눈·볼 등 fixed/pupils 레이어가 위에 그려져서 티가 안 남).
const STAGES = {
  "stage-1-egg": {
    leaf: [ellipse(140, 65, 66, 50)],
    // 알 단계 눈은 얇게 감은 곡선이라 타원 마스크 대신 luma 임계값을 쓴다(아래 buildEyeMaskByLuma).
    eyeBoxForLumaMask: { x0: 100, x1: 225, y0: 180, y1: 225, lumaMax: 170 },
    fixed: [ellipse(95, 232, 26, 16), ellipse(228, 220, 26, 16)], // 볼
  },
  "stage-2": {
    leaf: [ellipse(134, 42, 74, 46)],
    pupils: [ellipse(97, 157, 17, 19), ellipse(182, 150, 17, 19)],
    fixed: [
      ellipse(97, 157, 32, 34), ellipse(182, 150, 32, 34),
      ellipse(148, 197, 19, 13),
      ellipse(70, 188, 20, 14), ellipse(213, 182, 20, 14),
      ellipse(240, 50, 26, 26),
    ],
  },
  "stage-3": {
    leaf: [ellipse(135, 48, 78, 56)],
    pupils: [ellipse(100, 178, 19, 21), ellipse(205, 168, 19, 21)],
    ledger: [rect(130, 246, 92, 64, 10)],
    fixed: [
      ellipse(100, 178, 35, 39), ellipse(205, 168, 35, 39),
      ellipse(168, 214, 21, 15),
      ellipse(75, 205, 23, 16), ellipse(240, 198, 23, 16),
      rect(228, 10, 45, 65),
    ],
  },
  "stage-4": {
    leaf: [ellipse(220, 50, 105, 60)],
    pupils: [ellipse(140, 205, 23, 27), ellipse(258, 193, 21, 25)],
    bag: [ellipse(75, 375, 60, 60), ellipse(65, 345, 15, 11)],
    fixed: [
      ellipse(140, 205, 44, 50), ellipse(258, 193, 42, 48),
      ellipse(222, 259, 27, 17),
      ellipse(115, 271, 27, 17), ellipse(290, 251, 27, 17),
      rect(255, 0, 106, 175),
    ],
  },
  "stage-3-sulking": {
    // 크롭 직후 좌상단에 stage-4의 코인/반짝임이 새어 들어와서 지워야 한다(eraseFirst).
    eraseFirst: [rect(0, 0, 42, 148), rect(0, 140, 16, 40)],
    leaf: [ellipse(150, 85, 72, 55)],
    pupils: [ellipse(108, 248, 19, 21), ellipse(220, 238, 19, 21)],
    fixed: [
      ellipse(108, 248, 37, 41), ellipse(220, 238, 37, 41),
      ellipse(165, 286, 19, 11),
      ellipse(80, 266, 21, 14), ellipse(225, 259, 21, 14),
      rect(240, 50, 100, 120),
    ],
  },
};

// 알 단계 눈처럼 "얇은 곡선"은 타원으로 근사하면 주변 몸통 픽셀까지 크게 잡혀버려서, 지정한
// 사각형 범위 안에서 실제로 어두운(luma 낮은) 픽셀만 골라 픽셀 단위 마스크를 만든다.
async function buildEyeMaskByLuma(srcPath, w, h, box) {
  const { data, info } = await sharp(srcPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const maskRaw = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const luma = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
      const inBox = x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;
      maskRaw[y * width + x] = inBox && luma < box.lumaMax ? 255 : 0;
    }
  }
  return sharp(maskRaw, { raw: { width, height, channels: 1 } }).png().toBuffer();
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
    const colorBuf = srcBuf;

    const holeBuffers = []; // body에서 뺄 마스크들(도형 마스크 또는 luma 마스크 PNG 버퍼) — dest-out에 그대로 사용

    // 부위별 회색 레이어(재염색용) — 도형 기반
    for (const part of ["leaf", "pupils", "ledger", "bag"]) {
      const shapes = cfg[part];
      if (!shapes) continue;
      const mask = maskSvg(w, h, shapes);
      holeBuffers.push(mask);
      await sharp(grayBuf).composite([{ input: mask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-${part}-gray.png`));
    }

    // 알 단계 눈 — luma 기반
    if (cfg.eyeBoxForLumaMask) {
      const eyeMask = await buildEyeMaskByLuma(srcBuf, w, h, cfg.eyeBoxForLumaMask);
      holeBuffers.push(eyeMask);
      await sharp(grayBuf).composite([{ input: eyeMask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-pupils-gray.png`));
    }

    // 고정 요소(원색 그대로)
    if (cfg.fixed) {
      const fixedMask = maskSvg(w, h, cfg.fixed);
      holeBuffers.push(fixedMask);
      await sharp(colorBuf).composite([{ input: fixedMask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-fixed.png`));
    }

    // body = 원본 알파 - 모든 구멍(도형 마스크 + luma 마스크)
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
