// 참고 이미지(사용자 제공, design-assets/pet-mascot-reference.png)를 부위별 레이어로 분리하는
// 스크립트(2026-09-15, 3차 수정) — public/pets/*-gray.png·*-fixed.png가 이 스크립트의 결과물이다.
// 재실행: `node design-assets/extract-pet-layers.js` (프로젝트 루트에서, sharp가 있어야 함).
//
// 이력:
// - 1차: 원본 이미지에서 부위별로 크롭 후 도형(타원/사각형) 마스크로 분리.
// - 2차: 알 단계 눈이 얇은 곡선인데 타원으로 근사해서 "회색 동그라미"로 보이던 문제, 잎사귀 타원이
//   실제보다 작아 색이 안 바뀌던 문제를 고침.
// - 3차(이번): 두 가지 버그를 더 고침 —
//   1) sharp의 dest-in/dest-out은 마스크 이미지의 "알파 채널"로 동작하는데, luma 임계값 마스크를
//      1채널(회색값만) PNG로 만들었더니 알파가 없어 "전체 불투명"으로 취급돼 마스크가 사실상 무시됨
//      → 알 단계 body-gray가 통째로 비어서 몸/잎사귀 색이 전혀 안 바뀌는 버그로 이어졌다. 마스크는
//      항상 RGBA로 만들고 패턴을 알파 채널에 넣도록 통일(buildMaskFromPredicate).
//   2) 유년기·청소년기·성체의 "흰자" 부분을 눈 타원보다 크게 잡아 fixed로 굳혀놔서, 몸 색을 바꿔도
//      눈 주위에 원래 라벤더색 고리/동그라미가 남아있었다(사용자 신고: "안에 원같은거 있고"). 타원
//      대신 실제 흰색에 가까운 픽셀만 임계값으로 골라내는 방식으로 교체.
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
    // 알 단계 눈은 얇게 감은 곡선이라 타원 마스크 대신 이 사각형 범위 안에서 어두운 픽셀만 고른다.
    eyeLumaBox: { boxes: [{ x0: 100, x1: 225, y0: 180, y1: 225 }], mode: "dark", threshold: 170 },
    fixed: [ellipse(95, 232, 26, 16), ellipse(228, 220, 26, 16)], // 볼
  },
  "stage-2": {
    leaf: [ellipse(134, 42, 74, 46)],
    pupils: [ellipse(97, 157, 17, 19), ellipse(182, 150, 17, 19)],
    // 흰자 — 타원 대신, 눈 주변 넉넉한 범위 안에서 "거의 흰색(채도 낮고 아주 밝음)"인 픽셀만 고른다.
    eyeWhiteBox: { boxes: [{ x0: 45, x1: 155, y0: 105, y1: 205 }, { x0: 130, x1: 240, y0: 98, y1: 200 }] },
    fixed: [
      ellipse(148, 197, 19, 13),
      ellipse(70, 188, 20, 14), ellipse(213, 182, 20, 14),
      ellipse(240, 50, 26, 26),
    ],
  },
  "stage-3": {
    leaf: [ellipse(135, 48, 78, 56)],
    pupils: [ellipse(100, 178, 19, 21), ellipse(205, 168, 19, 21)],
    ledger: [rect(130, 246, 92, 64, 10)],
    eyeWhiteBox: { boxes: [{ x0: 45, x1: 160, y0: 120, y1: 235 }, { x0: 150, x1: 265, y0: 110, y1: 225 }] },
    fixed: [
      ellipse(168, 214, 21, 15),
      ellipse(75, 205, 23, 16), ellipse(240, 198, 23, 16),
      rect(228, 10, 45, 65),
    ],
  },
  "stage-4": {
    leaf: [ellipse(220, 50, 105, 60)],
    pupils: [ellipse(140, 205, 23, 27), ellipse(258, 193, 21, 25)],
    bag: [ellipse(75, 375, 60, 60), ellipse(65, 345, 15, 11)],
    eyeWhiteBox: { boxes: [{ x0: 65, x1: 210, y0: 135, y1: 280 }, { x0: 185, x1: 330, y0: 125, y1: 265 }] },
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
    pupils: [ellipse(108, 248, 19, 21), ellipse(220, 238, 19, 21)],
    eyeWhiteBox: { boxes: [{ x0: 50, x1: 165, y0: 190, y1: 305 }, { x0: 160, x1: 275, y0: 180, y1: 295 }] },
    fixed: [
      ellipse(165, 286, 19, 11),
      ellipse(80, 266, 21, 14), ellipse(225, 259, 21, 14),
      rect(240, 50, 100, 120),
    ],
  },
};

// 픽셀 단위 마스크 공통 빌더 — predicate(r,g,b,a,x,y)가 true인 픽셀만 알파 255로 채운 RGBA PNG를
// 만든다. dest-in/dest-out은 "알파 채널"로만 동작하므로 항상 4채널로 만들어야 한다(3차 수정 참고).
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

    // 부위별 회색 레이어(재염색용) — 도형 기반
    for (const part of ["leaf", "pupils", "ledger", "bag"]) {
      const shapes = cfg[part];
      if (!shapes) continue;
      const mask = maskSvg(w, h, shapes);
      holeBuffers.push(mask);
      await sharp(grayBuf).composite([{ input: mask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-${part}-gray.png`));
    }

    // 알 단계 눈(얇은 곡선) — 지정 범위 안의 어두운 픽셀만.
    if (cfg.eyeLumaBox) {
      const { boxes, threshold } = cfg.eyeLumaBox;
      const eyeMask = await buildMaskFromPredicate(srcBuf, (r, g, b, a, x, y) => {
        if (!inBoxes(boxes, x, y)) return false;
        const luma = 0.3 * r + 0.59 * g + 0.11 * b;
        return luma < threshold;
      });
      holeBuffers.push(eyeMask);
      await sharp(grayBuf).composite([{ input: eyeMask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-pupils-gray.png`));
    }

    // 흰자 — 지정 범위 안의 "거의 흰색(중성, 아주 밝음)" 픽셀만. 몸통(라벤더)은 b채널이 확연히 높아서
    // 채도(최대-최소 채널 차)로 구분된다.
    let fixedShapes = cfg.fixed ? [maskSvg(w, h, cfg.fixed)] : [];
    if (cfg.eyeWhiteBox) {
      const { boxes } = cfg.eyeWhiteBox;
      const whiteMask = await buildMaskFromPredicate(srcBuf, (r, g, b, a, x, y) => {
        if (!inBoxes(boxes, x, y) || a <= 40) return false;
        const minC = Math.min(r, g, b), maxC = Math.max(r, g, b);
        return minC > 200 && maxC - minC < 22;
      });
      fixedShapes.push(whiteMask);
    }

    // 고정 요소(원색 그대로) = 흰자 마스크 ∪ 나머지 fixed 도형들 — 전부 알파 채널만 보고 합친다.
    if (fixedShapes.length > 0) {
      const bufs = await Promise.all(fixedShapes.map((s) => sharp(s).raw().toBuffer({ resolveWithObject: true })));
      const { width, height, channels } = bufs[0].info;
      const union = Buffer.alloc(width * height * channels);
      for (const { data } of bufs) {
        for (let i = channels - 1; i < data.length; i += channels) {
          if (data[i] > union[i]) union[i] = data[i];
        }
      }
      const fixedMask = await sharp(union, { raw: { width, height, channels } }).png().toBuffer();
      holeBuffers.push(fixedMask);
      await sharp(srcBuf).composite([{ input: fixedMask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-fixed.png`));
    }

    // body = 원본 알파 - 모든 구멍(도형/luma/흰자 마스크)
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
