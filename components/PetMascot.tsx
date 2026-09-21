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
// "시무룩" 표현(2026-09-21 교체): 기존엔 성장 단계 그림 위에 회색 필터 + 한숨 구름만 얹어서
// "시무룩해 보이는 성체"였다(사용자 신고). 이제 사용자가 준 전용 일러스트(public/pet_sulking.png,
// 배경 제거·별 반짝이 제거만 거친 원본)를 그대로 쓴다 — 이 그림은 성장 단계별 색상 커스터마이징
// 마스크 대상이 아니라(다른 단계 그림들과 달리 부위별 마스크가 없다) 고정된 색으로 나온다.
// 그래서 시무룩할 때는 그 단계·색 커스터마이징이 잠깐 안 보이는 대신, 실제로 시무룩한 표정이 보인다.
import { useMemo } from "react";
import Image from "next/image";
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

  // 버그 수정(2026-09-21): 알(stage_index 1) 단계는 이 시무룩 그림(다 자란 몸통에 발까지 있는 그림)을
  // 쓰면 안 된다 — 알은 원래 팔다리 없는 계란 모양이라, 시무룩 그림으로 바뀌는 순간 알인데 알처럼
  // 안 보이는 모순이 생긴다. 알 단계는 시무룩 판정이 나도 원래 알 그림(눈 감은 얼굴) 그대로 둔다.
  if (sulking && pet.stage_index > 1) {
    // 원본 비율(286x376)을 그대로 유지 — 다른 단계 그림들과 폭이 아니라 "높이" 기준으로 크기를
    // 맞추므로, 세로 px 그대로 두고 폭은 원본 비율대로 계산한다.
    const width = Math.round(px * (286 / 376));
    return <Image src="/pet_sulking.png" alt="시무룩한 저금통 펫" width={width} height={px} unoptimized />;
  }

  return <CharacterCanvas stage={stage} colors={colors} height={px} />;
}
