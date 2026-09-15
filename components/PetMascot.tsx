"use client";
// components/PetMascot.tsx — 저금통 펫 마스코트. 2026-09-15 사용자가 스테이지별 커스텀 색상
// 항목까지 명시한 참고 이미지(알/유년기/청소년기/성년기 4장, design-assets/pet-mascot-reference-v2
// .png)를 실제로 잘라서 쓴다 — SVG로 다시 그리는 방식은 "이 캐릭터가 아니다"라며 거부당해 폐기했다.
//
// 부위별 색상 커스텀은 그대로 유지해야 해서, 이미지를 통째로 쓰는 대신 design-assets/
// extract-pet-layers-v2.js로 부위별 레이어(그레이스케일 + 실루엣 알파)를 미리 뽑아 public/pets/에
// 저장해뒀다. 화면에서는 각 레이어를:
//   1) 그레이스케일 이미지를 그대로 그리고
//   2) 그 위에 같은 실루엣을 CSS mask-image로 쓰는 단색 오버레이를, mix-blend-mode:color로 얹는다
// 이렇게 하면 원본의 음영·하이라이트(명도)는 유지한 채 색상(색조)만 사용자가 고른 색으로 바뀐다
// ("듀오톤 컬러라이즈" 기법). 흰자·볼터치·입처럼 색을 바꾸면 안 되는 요소는 "fixed" 레이어로 따로
// 떼어 원색 그대로 그 위에 얹는다.
//
// 부위 구성(참고 이미지 자체에 적힌 "변경 가능 색상" 라벨 기준, 2026-09-15 사용자 확인) — 성장
// 단계마다 존재하는 부위가 다르다:
//   1=알: 몸+잎사귀만(눈·가계부·가방 없음)
//   2=유년기: 몸+눈+잎사귀(가계부·가방 없음)
//   3=청소년기: 몸+눈+잎사귀+가방(들고 있는 나비 책 + 옆구리 나비 파우치, 둘 다 가방 색 하나로 묶임 — 가계부 없음)
//   4=성년기: 몸+눈+잎사귀+가계부(₩ 책)+가방(옆구리 파우치) 전부
// lib/pets.ts의 colorPartsForStage()가 이 표를 그대로 코드로 옮긴 것 — 화면(PetCustomize)에서
// 스와치를 보여줄지 말지 그 함수로 판단한다. 시무룩(stage-3-sulking)은 구버전 참고 이미지(5스테이지,
// design-assets/pet-mascot-reference.png)에서 뽑은 걸 그대로 쓴다 — 새 참고 이미지엔 시무룩이 없다.
import type { CSSProperties } from "react";
import type { Pet } from "@/lib/mock";
import { MAX_STAGE_INDEX } from "@/lib/pets";

const STAGE_SIZE = [56, 70, 84, 98]; // stage_index 1~4(1=알)에 대응, 참고 이미지의 "성장 미리보기"처럼 커짐

// 레이어 원본 픽셀 크기(design-assets/extract-pet-layers-v2.js의 크롭 크기와 동일해야 함) — 스테이지
// 마다 이미지 비율이 달라서, 컨테이너 안에서 비율을 유지한 채 바닥에 맞춰 앉힌다.
type PetAssetPart = "leaf" | "ledger" | "bag";
interface PetAsset {
  key: string;
  w: number;
  h: number;
  parts: readonly PetAssetPart[];
}
const STAGE_ASSET: Record<1 | 2 | 3 | 4, PetAsset> = {
  1: { key: "stage-1-egg", w: 300, h: 325, parts: ["leaf"] },
  2: { key: "stage-2", w: 360, h: 387, parts: ["leaf"] },
  3: { key: "stage-3", w: 344, h: 440, parts: ["leaf", "bag"] },
  4: { key: "stage-4", w: 456, h: 523, parts: ["leaf", "ledger", "bag"] },
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
