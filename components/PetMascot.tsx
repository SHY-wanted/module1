"use client";
// components/PetMascot.tsx — 저금통 펫 마스코트(디자인 파일 없음, 2026-09-15 사용자 확인으로 종
// 선택 대신 마스코트 하나 + 색상 커스텀으로 통일). 실제 3D 캐릭터 에셋은 없어서, 참고 이미지(둥근
// 몸+가계부+가방+눈+잎사귀)를 간단한 SVG로 스타일화했다 — 정교한 일러스트가 아니라 "색상이 실제로
// 반영되는 걸 보여주는" 용도에 맞춘 단순화.
import type { Pet } from "@/lib/mock";
import { MAX_STAGE_INDEX } from "@/lib/pets";

// 단계가 올라갈수록 조금씩 커지게(참고 이미지의 "성장 단계 미리보기"처럼).
const STAGE_SIZE = [56, 68, 82, 96];

export function petMascotSize(stageIndex: number): number {
  return STAGE_SIZE[Math.min(stageIndex, MAX_STAGE_INDEX) - 1] ?? STAGE_SIZE[0];
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
  // 알(1단계)일 땐 가계부·가방·잎사귀 없이 몸통(알)만 보여준다.
  const isEgg = pet.stage_index <= 1;

  return (
    <svg width={px} height={px} viewBox="0 0 100 100" className={sulking ? "shoot-pet-bounce" : "shoot-pet-bounce"} style={{ display: "block" }}>
      {/* 몸 */}
      <ellipse cx="50" cy={isEgg ? 55 : 58} rx={isEgg ? 30 : 34} ry={isEgg ? 36 : 32} fill={pet.body_color} />
      {!isEgg && (
        <>
          {/* 잎사귀(머리 위) */}
          <path d="M50 22 C 44 10, 56 10, 50 22 Z" fill={pet.leaf_color} />
          {/* 가방(등 뒤 살짝 보이게, 옆) */}
          <rect x="14" y="52" width="16" height="20" rx="5" fill={pet.bag_color} />
          {/* 가계부(안고 있는 모습) */}
          <rect x="40" y="62" width="26" height="20" rx="4" fill={pet.ledger_color} />
          <text x="53" y="76" fontSize="11" fontWeight="800" fill="#ffffff" textAnchor="middle">
            ₩
          </text>
        </>
      )}
      {/* 눈 — 시무룩하면 처진 반원, 아니면 동그란 눈 */}
      {sulking ? (
        <>
          <path d="M38 50 Q42 56 46 50" stroke={pet.eye_color} strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d="M54 50 Q58 56 62 50" stroke={pet.eye_color} strokeWidth={4} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="42" cy="52" r="4.5" fill={pet.eye_color} />
          <circle cx="58" cy="52" r="4.5" fill={pet.eye_color} />
        </>
      )}
      {/* 입 */}
      {sulking ? (
        <path d="M44 64 Q50 60 56 64" stroke={pet.eye_color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      ) : (
        <path d="M44 62 Q50 68 56 62" stroke={pet.eye_color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}
