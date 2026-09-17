"use client";
// components/PetMascot.tsx — 저금통 펫 마스코트.
// 2026-09-17: 손으로 그린 SVG에서 /character-demo가 쓰는 실제 PNG 원본 + 픽셀 마스크 렌더러로
// 교체했다(사용자 요청: "character-demo쪽 파일을 쓸꺼야"). 이번 세션 내내 다듬은 캐릭터 그림
// (눈 하이라이트, 코인, 부위 경계, 볼터치까지 검증된 마스크)이 이제 실제 펫 화면에도 그대로 쓰인다.
// 이전에 SVG로 바꿨던 이유(래스터 마스킹 경계가 덜 칠해지거나 안 칠해짐)는 이번 세션에서 해결한
// scripts/generate-character-masks.js + scripts/verify-character-masks.js 로 이미 검증됐다.
//
// 부위 이름 대응: DB 컬럼(ledger_color, eye_color)과 캐릭터 마스크 파트명(wallet, eyes)이
// 서로 다르므로 여기서 한 번만 변환한다. Stage 대응도 다르다 — DB는 1(알)~4(성년기),
// 캐릭터 쪽은 0(알)~3(성년기)이라 1을 뺀다. lib/pets.ts의 colorPartsForStage()가 단계별로
// 실제 존재하는 부위를 이미 캐릭터 쪽 stageCustomization과 1:1로 맞춰뒀다(이름만 다름).
//
// "시무룩" 표현은 원래 SVG 버전처럼 눈매·팔 자세를 다시 그리지 않는다 — 원본 PNG에는 그런
// 표정이 없고, 새로 그리려면 전용 마스크를 새로 떠야 한다(이번 교체의 범위 밖). 대신 캐릭터
// 위에 옅은 무채색 톤과 한숨 구름만 얹어 "시무룩함"을 표시한다. 나중에 전용 표정 마스크를
// 만들면 이 오버레이만 교체하면 된다.
import { useMemo } from "react";
import type { Pet } from "@/lib/mock";
import { MAX_STAGE_INDEX } from "@/lib/pets";
import CharacterCanvas from "./character-demo/CharacterCanvas";
import type { CharacterStage, ColorPart } from "@/lib/characterStages";

const STAGE_SIZE = [56, 70, 88, 104]; // stage_index 1~4(1=알)에 대응, 성장할수록 커짐

export function petMascotSize(stageIndex: number): number {
  return STAGE_SIZE[Math.min(Math.max(stageIndex, 1), MAX_STAGE_INDEX) - 1] ?? STAGE_SIZE[0];
}

type PetColorProps = Pick<Pet, "stage_index" | "body_color" | "ledger_color" | "bag_color" | "eye_color" | "leaf_color">;

export default function PetMascot({
  pet,
  size,
  sulking = false,
}: {
  pet: PetColorProps;
  size?: number;
  sulking?: boolean;
}) {
  const px = size ?? petMascotSize(pet.stage_index);
  const stage = (Math.min(Math.max(pet.stage_index, 1), MAX_STAGE_INDEX) - 1) as CharacterStage;

  const colors = useMemo<Record<ColorPart, string>>(
    () => ({
      body: pet.body_color,
      eyes: pet.eye_color,
      leaf: pet.leaf_color,
      wallet: pet.ledger_color,
      bag: pet.bag_color,
    }),
    [pet.body_color, pet.eye_color, pet.leaf_color, pet.ledger_color, pet.bag_color]
  );

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        lineHeight: 0,
        filter: sulking ? "grayscale(0.35) brightness(0.94)" : undefined,
      }}
    >
      <CharacterCanvas stage={stage} colors={colors} height={px} />
      {sulking && (
        <svg
          width={px * 0.4}
          height={px * 0.32}
          viewBox="0 0 40 32"
          style={{ position: "absolute", top: "2%", right: "-8%", opacity: 0.55, pointerEvents: "none" }}
          aria-hidden
        >
          <circle cx="22" cy="16" r="8" fill="#9A97B0" />
          <circle cx="32" cy="8" r="5.5" fill="#9A97B0" />
        </svg>
      )}
    </div>
  );
}
