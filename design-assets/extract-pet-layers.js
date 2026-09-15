// 참고 이미지(사용자 제공, design-assets/pet-mascot-reference.png)를 부위별 레이어로 분리하는
// 1회성 스크립트(2026-09-15) — public/pets/*-gray.png·*-fixed.png가 이 스크립트의 결과물이다.
// 재실행하려면 이 파일을 실행하기 전에 아래 순서가 필요하다:
//   1) pet-mascot-reference.png(1536x1024, 5스테이지 합성본)에서 스테이지별로 크롭
//      — stage-1-egg: {left:0,top:385,width:265,height:330}
//      — stage-2:     {left:265,top:370,width:278,height:345}
//      — stage-3:     {left:543,top:290,width:286,height:425}
//      — stage-4:     {left:829,top:200,width:361,height:515}
//      — stage-3-sulking: {left:1190,top:285,width:346,height:430} (크롭 후 좌상단 0,140~16,180
//        영역에 stage-4의 코인/반짝임 장식이 새어 들어오므로 dest-out으로 지워야 함)
//   2) 각 크롭을 public/pets/{stage}.png로 저장
//   3) 이 스크립트 실행(각 스테이지 PNG에서: leaf/pupils/ledger/bag는 그레이스케일+마스크로,
//      fixed(눈흰자·볼·입·코인 등 고정 요소)는 원색 그대로 마스크로 추출. body는
//      "전체 알파 - (leaf∪pupils∪ledger∪bag∪fixed)"로 계산)
//   4) 결과물({stage}-*.png)만 남기고 1)의 임시 크롭 파일은 지운다(런타임에 안 쓴다)
// 마스크 좌표(ellipse/rect)는 참고 이미지를 육안으로 보고 잡은 근사치라 부위 경계에 약간의
// 오차(예: 입 주변에 살짝 남는 몸통색 여백)가 있을 수 있다 — 완벽한 픽셀 단위 분리가 아니라
// "부위별 색상이 실제로 바뀌는 것"을 우선한 실용적 타협.
const sharp = require("sharp");
const path = require("path");

const DIR = "C:/planning/public/pets";

function ellipse(cx, cy, rx, ry) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white"/>`;
}
function rect(x, y, w, h, rx = 0) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="white"/>`;
}
function maskSvg(width, height, shapes) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${shapes.join("")}</svg>`);
}

const STAGES = {
  "stage-1-egg": {
    w: 265, h: 330,
    leaf: [ellipse(117, 62, 26, 34)],
    pupils: [ellipse(82, 205, 26, 13), ellipse(178, 200, 26, 13)], // 감은 눈 아치도 eye_color로 취급
    fixed: [ellipse(78, 222, 22, 14), ellipse(185, 215, 22, 14)], // 볼
  },
  "stage-2": {
    w: 278, h: 345,
    leaf: [ellipse(140, 35, 58, 40)],
    pupils: [ellipse(97, 157, 17, 19), ellipse(182, 150, 17, 19)],
    fixed: [
      ellipse(97, 157, 32, 34), ellipse(182, 150, 32, 34), // 눈 흰자
      ellipse(148, 197, 19, 13), // 입
      ellipse(70, 188, 20, 14), ellipse(213, 182, 20, 14), // 볼
      ellipse(240, 50, 26, 26), // 하트 장식
    ],
  },
  "stage-3": {
    w: 286, h: 425,
    leaf: [ellipse(155, 45, 62, 50)],
    pupils: [ellipse(100, 178, 19, 21), ellipse(205, 168, 19, 21)],
    ledger: [rect(130, 246, 92, 64, 10)],
    fixed: [
      ellipse(100, 178, 35, 39), ellipse(205, 168, 35, 39),
      ellipse(168, 214, 21, 15),
      ellipse(75, 205, 23, 16), ellipse(240, 198, 23, 16),
      rect(228, 10, 45, 65), // 우측 상단 모션 라인
    ],
  },
  "stage-4": {
    w: 361, h: 515,
    leaf: [ellipse(175, 65, 92, 64)],
    pupils: [ellipse(140, 205, 23, 27), ellipse(258, 193, 21, 25)],
    bag: [ellipse(75, 375, 60, 60), ellipse(65, 345, 15, 11)],
    fixed: [
      ellipse(140, 205, 44, 50), ellipse(258, 193, 42, 48),
      ellipse(222, 259, 27, 17),
      ellipse(115, 271, 27, 17), ellipse(290, 251, 27, 17),
      rect(255, 0, 106, 175), // 코인+반짝임
    ],
  },
  "stage-3-sulking": {
    w: 346, h: 430,
    leaf: [ellipse(150, 95, 57, 47)],
    pupils: [ellipse(108, 248, 19, 21), ellipse(220, 238, 19, 21)],
    fixed: [
      ellipse(108, 248, 37, 41), ellipse(220, 238, 37, 41),
      ellipse(165, 286, 19, 11),
      ellipse(80, 266, 21, 14), ellipse(225, 259, 21, 14),
      rect(240, 50, 100, 120), // 소용돌이 장식
    ],
  },
};

async function run() {
  for (const [stage, cfg] of Object.entries(STAGES)) {
    const srcPath = path.join(DIR, `${stage}.png`);
    const { w, h } = cfg;

    const grayBuf = await sharp(srcPath).greyscale().png().toBuffer();
    const colorBuf = await sharp(srcPath).png().toBuffer();

    // 부위별 회색 레이어(재염색용)
    const partDefs = [
      ["leaf", cfg.leaf],
      ["pupils", cfg.pupils],
      ["ledger", cfg.ledger],
      ["bag", cfg.bag],
    ];
    const allHoles = []; // body에서 빼야 할 마스크 도형(leaf∪pupils∪ledger∪bag∪fixed)
    for (const [part, shapes] of partDefs) {
      if (!shapes) continue;
      allHoles.push(...shapes);
      const mask = maskSvg(w, h, shapes);
      await sharp(grayBuf)
        .composite([{ input: mask, blend: "dest-in" }])
        .png()
        .toFile(path.join(DIR, `${stage}-${part}-gray.png`));
    }

    // 고정 요소(원색 그대로)
    if (cfg.fixed) {
      allHoles.push(...cfg.fixed);
      const fixedMask = maskSvg(w, h, cfg.fixed);
      await sharp(colorBuf)
        .composite([{ input: fixedMask, blend: "dest-in" }])
        .png()
        .toFile(path.join(DIR, `${stage}-fixed.png`));
    }

    // body = 원본 알파 - allHoles
    const holesMask = maskSvg(w, h, allHoles);
    await sharp(grayBuf)
      .composite([{ input: holesMask, blend: "dest-out" }])
      .png()
      .toFile(path.join(DIR, `${stage}-body-gray.png`));

    console.log("done", stage);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
