"use client";
// components/PetMascot.tsx — 저금통 펫 마스코트. 2026-09-15 사용자가 실제로 준 참고 이미지
// ("Stage 0-Egg/1/2/3/2-Sulking" 5장, design-assets/pet-mascot-reference.png)를 실제로 잘라서
// 쓴다 — SVG로 다시 그리는 방식은 "이 캐릭터가 아니다"라며 거부당해 폐기했다(2026-09-15).
//
// 부위별 색상 커스텀(몸/가계부/가방/눈/잎사귀)은 그대로 유지해야 해서, 이미지를 통째로 쓰는 대신
// design-assets/extract-pet-layers.js로 부위별 레이어(그레이스케일 + 실루엣 알파)를 미리 뽑아
// public/pets/에 저장해뒀다. 화면에서는 각 레이어를:
//   1) 그레이스케일 이미지를 그대로 그리고
//   2) 그 위에 같은 실루엣을 CSS mask-image로 쓰는 단색 오버레이를, mix-blend-mode:color로 얹는다
// 이렇게 하면 원본의 음영·하이라이트(명도)는 유지한 채 색상(색조)만 사용자가 고른 색으로 바뀐다
// ("듀오톤 컬러라이즈" 기법). 흰자·볼터치·입·코인처럼 색을 바꾸면 안 되는 요소는 "fixed" 레이어로
// 따로 떼어 원색 그대로 그 위에 얹는다.
//
// [주의] 마스크 좌표는 참고 이미지를 육안으로 보고 잡은 근사치라(design-assets/extract-pet-layers.js
// 참고) 부위 경계에 약간의 오차가 있을 수 있다 — 완벽한 픽셀 단위 분리보다 "실제로 색이 바뀌는 것"을
// 우선한 실용적 타협.
import type { CSSProperties } from "react";
import type { Pet } from "@/lib/mock";
import { MAX_STAGE_INDEX } from "@/lib/pets";

const STAGE_SIZE = [56, 70, 84, 98]; // stage_index 1~4(1=알)에 대응, 참고 이미지의 "성장 미리보기"처럼 커짐

// 레이어 원본 픽셀 크기(design-assets/extract-pet-layers.js의 크롭 크기와 동일해야 함) — 스테이지마다
// 이미지 비율이 달라서, 컨테이너 안에서 object-fit: contain으로 비율을 유지한 채 바닥에 맞춰 앉힌다.
type PetAssetPart = "leaf" | "ledger" | "bag";
interface PetAsset {
  key: string;
  w: number;
  h: number;
  parts: readonly PetAssetPart[];
}
const STAGE_ASSET: Record<1 | 2 | 3 | 4, PetAsset> = {
  1: { key: "stage-1-egg", w: 265, h: 330, parts: [] },
  2: { key: "stage-2", w: 278, h: 345, parts: ["leaf"] },
  3: { key: "stage-3", w: 286, h: 425, parts: ["leaf", "ledger"] },
  4: { key: "stage-4", w: 361, h: 515, parts: ["leaf", "bag"] },
};
const SULKING_ASSET: PetAsset = { key: "stage-3-sulking", w: 346, h: 430, parts: ["leaf"] };

export function petMascotSize(stageIndex: number): number {
  return STAGE_SIZE[Math.min(Math.max(stageIndex, 1), MAX_STAGE_INDEX) - 1] ?? STAGE_SIZE[0];
}

function ColorLayer({ src, color }: { src: string; color: string }) {
  const layerStyle: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };
  return (
    <div style={{ ...layerStyle, isolation: "isolate" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- public/ 정적 에셋, next/image 최적화 불필요 */}
      <img src={src} alt="" style={{ width: "100%", height: "100%", display: "block" }} draggable={false} />
      <div
        style={{
          ...layerStyle,
          backgroundColor: color,
          mixBlendMode: "color",
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      />
    </div>
  );
}

export default function PetMascot({
  pet,
  size,
  sulking = false,
}: {
  pet: Pick<Pet, "stage_index" | "body_color" | "ledger_color" | "bag_color" | "eye_color" | "leaf_color">;
  size?: number;
  sulking?: boolean;
}) {
  const px = size ?? petMascotSize(pet.stage_index);
  // 참고 이미지의 "Stage 2-Sulking"은 청소년기(stage_index=3) 그림의 시무룩 변형 하나뿐이라,
  // 다른 단계에서 시무룩할 때도 이 그림을 그대로 재사용한다(성장 단계 사진을 따로 만들지 않음 —
  // 06-data.md "시무룩" 참고, 단계 자체는 안 내려가고 화면 표시만 바뀌는 파생 상태).
  const asset = sulking ? SULKING_ASSET : STAGE_ASSET[pet.stage_index as 1 | 2 | 3 | 4] ?? STAGE_ASSET[1];
  const base = `/pets/${asset.key}`;
  const aspect = asset.w / asset.h;
  const boxHeight = px;
  const boxWidth = px * aspect;

  return (
    <div style={{ width: boxWidth, height: boxHeight, position: "relative", display: "block" }} className="shoot-pet-bounce">
      <ColorLayer src={`${base}-body-gray.png`} color={pet.body_color} />
      {asset.parts.includes("leaf") && <ColorLayer src={`${base}-leaf-gray.png`} color={pet.leaf_color} />}
      {asset.parts.includes("ledger") && <ColorLayer src={`${base}-ledger-gray.png`} color={pet.ledger_color} />}
      {asset.parts.includes("bag") && <ColorLayer src={`${base}-bag-gray.png`} color={pet.bag_color} />}
      {/* eslint-disable-next-line @next/next/no-img-element -- public/ 정적 에셋, next/image 최적화 불필요 */}
      <img
        src={`${base}-fixed.png`}
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
        draggable={false}
      />
      <ColorLayer src={`${base}-pupils-gray.png`} color={pet.eye_color} />
    </div>
  );
}
