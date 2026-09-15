// 2026-09-15 — 사용자가 새로 준, 스테이지별 커스텀 색상 항목까지 명시된 참고 이미지
// (design-assets/pet-mascot-reference-v2.png)에서 부위별 레이어를 뽑는 스크립트.
// v1(extract-pet-layers.js)과 달리 처음부터 "타원 눈대중" 대신 색 임계값(채도/밝기/색조)으로 각
// 부위의 실제 픽셀 영역을 찾아 마스크를 만든다 — 이전에 에러가 반복된 이유(타원 좌표를 눈대중으로
// 잡아서 몸통까지 침범하거나 잘려나감)를 원천적으로 피하려는 것.
//
// 이 참고 이미지는 4단계만 있고(알/유년기/청소년기/성년기) "시무룩" 그림은 없다 — 시무룩은 기존
// public/pets/stage-3-sulking-*.png(구 참고 이미지에서 추출)를 그대로 계속 쓴다.
//
// 부위 구성(이미지 자체에 적힌 "변경 가능 색상" 라벨 기준, 사용자 확인):
//   알: 몸, 잎사귀
//   유년기: 몸, 눈, 잎사귀
//   청소년기: 몸, 눈, 잎사귀, 가방(=들고 있는 나비 아이콘 책 + 옆구리 나비 아이콘 파우치, 둘 다 같은 색)
//   성년기: 몸, 눈, 잎사귀, 가계부(=₩ 아이콘 책), 가방(=옆구리 나비 아이콘 파우치)
const sharp = require("sharp");
const path = require("path");

const REF = path.join(__dirname, "pet-mascot-reference-v2.png");
const DIR = path.join(__dirname, "..", "public", "pets");

function rect(x, y, w, h, rx = 0) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="white"/>`;
}
function maskSvg(width, height, shapes) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${shapes.join("")}</svg>`);
}

const CROPS = {
  "stage-1-egg": { left: 40, top: 320, width: 300, height: 325 },
  "stage-2": { left: 340, top: 258, width: 360, height: 387 },
  "stage-3": { left: 700, top: 205, width: 344, height: 440 },
  "stage-4": { left: 1044, top: 122, width: 456, height: 523 },
};

const STAGES = {
  "stage-1-egg": {
    leafSat: { y1: 90 }, // 줄기-몸통 경계 아래로(픽셀 스캔 확인) 안 넘어가게
    eyeLumaBox: { boxes: [{ x0: 63, x1: 229, y0: 178, y1: 218 }], threshold: 175 }, // 감은 눈(얇은 곡선)
    // 오른쪽 볼은 핑크 임계값으로 잡히지만 왼쪽은 채도가 낮아 안 잡혀서 대칭으로 보정.
    pinkBoxes: [{ x0: 210, x1: 270, y0: 185, y1: 225 }],
    fixedFallback: [rect(55, 190, 55, 30, 15)], // 왼쪽 볼 — 오른쪽과 대칭 위치, 색 임계값으로 못 찾아서 도형으로.
  },
  "stage-2": {
    leafSat: { y1: 106 },
    eyeBoxes: [{ x0: 120, x1: 182, y0: 175, y1: 246 }, { x0: 184, x1: 281, y0: 158, y1: 236 }],
    pupilDark: true,
    eyeWhite: true,
    cheekMouthBox: [{ x0: 0, x1: 360, y0: 195, y1: 280 }],
  },
  "stage-3": {
    leafSat: { y1: 101 },
    eyeBoxes: [{ x0: 107, x1: 176, y0: 171, y1: 264 }, { x0: 167, x1: 267, y0: 151, y1: 264 }],
    pupilDark: true,
    eyeWhite: true,
    cheekMouthBox: [{ x0: 0, x1: 344, y0: 190, y1: 280 }],
    // 청소년기 = "가방" 하나로 통합(들고 있는 나비 책 + 옆구리 나비 파우치 둘 다).
    heldRegions: { bag: { x0: 0, x1: 300, y0: 228, y1: 420 } },
  },
  "stage-4": {
    leafSat: { y1: 121 },
    eyeBoxes: [{ x0: 157, x1: 228, y0: 193, y1: 275 }, { x0: 232, x1: 344, y0: 178, y1: 294 }],
    pupilDark: true,
    eyeWhite: true,
    cheekMouthBox: [{ x0: 0, x1: 456, y0: 220, y1: 315 }],
    // 처음엔 사각형(rect)으로 bbox를 잡았는데, 사각형 모서리가 실제 책/파우치의 둥근 테두리
    // 밖으로 튀어나와 몸통·팔에 색이 번진 사각형 잔상으로 보였다(사용자 신고: "규격이 안 맞음").
    // 사각형 대신 실제 색 경계를 그대로 추적하고, 안의 흰 아이콘(₩·나비) 구멍만 블러+재이진화로
    // 메우는 방식(형태학적 closing 근사)으로 바꿔 진짜 모양 그대로 잘라낸다.
    heldRegions: {
      ledger: { x0: 190, x1: 380, y0: 228, y1: 418 }, // 들고 있는 책(₩ 아이콘) = "가계부"
      bag: { x0: 0, x1: 190, y0: 260, y1: 420 }, // 옆구리 파우치(나비 아이콘) = "가방"
    },
  },
};

// 가계부·가방처럼 색은 뚜렷하지만 안에 흰 아이콘(₩·나비) 구멍이 있는 부위용 — 지정한 범위 안에서
// 채도(b-r) 임계값으로 실제 색 경계를 추적한 뒤, 블러+재이진화로 아이콘 크기의 구멍만 메운다
// (사각형 bbox를 쓰면 모서리가 실제 둥근 테두리 밖으로 튀어나와 "규격이 안 맞는" 잔상이 생긴다).
async function buildClosedRegionMask(srcBuf, box) {
  const { data, info } = await sharp(srcBuf).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const raw = Buffer.alloc(width * height * 4);
  for (let y = box.y0; y < box.y1; y++) {
    for (let x = box.x0; x < box.x1; x++) {
      const i = (y * width + x) * channels;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a > 100 && b - r > 65) {
        const o = (y * width + x) * 4;
        raw[o] = 255; raw[o + 1] = 255; raw[o + 2] = 255; raw[o + 3] = 255;
      }
    }
  }
  const blurred = await sharp(raw, { raw: { width, height, channels: 4 } }).blur(9).raw().toBuffer({ resolveWithObject: true });
  const closed = Buffer.alloc(width * height * 4);
  for (let i = 0; i < blurred.data.length; i += 4) {
    if (blurred.data[i + 3] > 45) {
      closed[i] = 255; closed[i + 1] = 255; closed[i + 2] = 255; closed[i + 3] = 255;
    }
  }
  return sharp(closed, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

const DARK_LUMA_THRESHOLD = 140;
const WHITE_MIN_CHANNEL = 200;
const WHITE_MAX_SPREAD = 22;
// b-r > 이 값이면 잎사귀/줄기(채도 높은 진보라)로 인정. 처음엔 55였는데, 하이라이트가 강하게
// 들어간 잎사귀 "끝부분"은 채도가 40 정도까지 떨어져서 55 기준으론 몸통으로 잘못 분류돼 색이 안
// 바뀌는(파란 티) 문제가 있었다(실측: 끝부분 b-r≈40, 몸통 solid 픽셀은 b-r≤22) — 30으로 낮춤.
const LEAF_SAT_THRESHOLD = 30;

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
    const srcBuf = await sharp(REF).extract(crop).png().toBuffer();
    const w = crop.width, h = crop.height;
    const grayBuf = await sharp(srcBuf).greyscale().png().toBuffer();
    const holeBuffers = [];

    // 잎사귀 — 채도(b-r) 임계값, y1 아래로는 절대 안 넘어가게(몸통 침범 버그 재발 방지)
    if (cfg.leafSat) {
      const leafMask = await buildMaskFromPredicate(srcBuf, (r, g, b, a, x, y) => {
        if (y > cfg.leafSat.y1 || a <= 100) return false;
        return b - r > LEAF_SAT_THRESHOLD;
      });
      holeBuffers.push(leafMask);
      await sharp(grayBuf).composite([{ input: leafMask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-leaf-gray.png`));
    }

    // 가계부/가방 — 실제 색 경계 추적 + 아이콘 구멍 closing(buildClosedRegionMask). 사각형 bbox를
    // 쓰면 모서리가 실제 둥근 테두리 밖으로 튀어나와 몸통에 색 잔상이 생긴다(2026-09-15 사용자
    // 신고로 rect 방식 폐기).
    if (cfg.heldRegions) {
      for (const [part, box] of Object.entries(cfg.heldRegions)) {
        const mask = await buildClosedRegionMask(srcBuf, box);
        holeBuffers.push(mask);
        await sharp(grayBuf).composite([{ input: mask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-${part}-gray.png`));
      }
    }

    // 눈동자
    if (cfg.pupilDark) {
      const pupilMask = await buildMaskFromPredicate(srcBuf, (r, g, b, a, x, y) => {
        if (!inBoxes(cfg.eyeBoxes, x, y) || a <= 40) return false;
        return 0.3 * r + 0.59 * g + 0.11 * b < DARK_LUMA_THRESHOLD;
      });
      holeBuffers.push(pupilMask);
      await sharp(grayBuf).composite([{ input: pupilMask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-pupils-gray.png`));
    }
    if (cfg.eyeLumaBox) {
      const { boxes, threshold } = cfg.eyeLumaBox;
      const eyeMask = await buildMaskFromPredicate(srcBuf, (r, g, b, a, x, y) => {
        if (!inBoxes(boxes, x, y) || a <= 40) return false;
        return 0.3 * r + 0.59 * g + 0.11 * b < threshold;
      });
      holeBuffers.push(eyeMask);
      await sharp(grayBuf).composite([{ input: eyeMask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-pupils-gray.png`));
    }

    // 고정 요소(흰자·볼·입, 원색 그대로)
    const fixedParts = [];
    if (cfg.eyeWhite) {
      const whiteMask = await buildMaskFromPredicate(srcBuf, (r, g, b, a, x, y) => {
        if (!inBoxes(cfg.eyeBoxes, x, y) || a <= 40) return false;
        const minC = Math.min(r, g, b), maxC = Math.max(r, g, b);
        return minC > WHITE_MIN_CHANNEL && maxC - minC < WHITE_MAX_SPREAD;
      });
      fixedParts.push(whiteMask);
    }
    if (cfg.cheekMouthBox) {
      const pinkMask = await buildMaskFromPredicate(srcBuf, (r, g, b, a, x, y) => {
        if (!inBoxes(cfg.cheekMouthBox, x, y) || a <= 40) return false;
        return (r + b) / 2 - g > 30 && Math.abs(r - b) < 15;
      });
      fixedParts.push(pinkMask);
    }
    if (cfg.pinkBoxes) {
      const pinkMask = await buildMaskFromPredicate(srcBuf, (r, g, b, a, x, y) => {
        if (!inBoxes(cfg.pinkBoxes, x, y) || a <= 40) return false;
        return (r + b) / 2 - g > 15;
      });
      fixedParts.push(pinkMask);
    }
    if (cfg.fixedFallback) fixedParts.push(maskSvg(w, h, cfg.fixedFallback));
    if (fixedParts.length > 0) {
      const fixedMask = await unionAlpha(fixedParts);
      holeBuffers.push(fixedMask);
      await sharp(srcBuf).composite([{ input: fixedMask, blend: "dest-in" }]).png().toFile(path.join(DIR, `${stage}-fixed.png`));
    }

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
