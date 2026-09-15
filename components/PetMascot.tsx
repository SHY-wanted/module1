"use client";
// components/PetMascot.tsx — 저금통 펫 마스코트(디자인 파일 없음). 2026-09-15 사용자가 준 참고
// 이미지("Stage 0-Egg / Stage 1 / Stage 2 / Stage 3 / Stage 2-Sulking" 5장 세트)의 그림체를
// 참고해 SVG로 다시 그렸다 — 부위별 색상 커스텀(몸/가계부/가방/눈/잎사귀)은 그대로 유지해야 해서
// 실제 이미지 파일 대신 벡터로 재현했다(2026-09-15 사용자 확인: "이 그림체를 참고해서 SVG를 다시
// 그림 (부위별 색상 유지)"). 정교한 3D 렌더는 아니고, 참고 이미지의 구도(둥근 몸+두 갈래 잎사귀 새싹+
// 큰 눈+가계부/가방/코인 소품+시무룩 변형)를 단순화해 옮긴 것.
import type { Pet } from "@/lib/mock";
import { MAX_STAGE_INDEX } from "@/lib/pets";

// 단계가 올라갈수록 조금씩 커지게(참고 이미지의 "성장 단계 미리보기"처럼). stage_index는 1~4(1=알).
const STAGE_SIZE = [56, 70, 84, 98];

export function petMascotSize(stageIndex: number): number {
  return STAGE_SIZE[Math.min(Math.max(stageIndex, 1), MAX_STAGE_INDEX) - 1] ?? STAGE_SIZE[0];
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
  // 1=알, 2=유년기, 3=청소년기(가계부), 4=성체(코인+가방) — lib/pets.ts PET_STAGE_LABELS과 동일 기준.
  const isEgg = pet.stage_index <= 1;
  const showLedger = pet.stage_index === 3 && !sulking;
  const showCoinAndBag = pet.stage_index === 4 && !sulking;
  const ink = pet.eye_color;

  return (
    <svg width={px} height={px} viewBox="0 0 100 112" style={{ display: "block", overflow: "visible" }}>
      {/* 바닥 그림자 */}
      <ellipse cx="50" cy="102" rx="26" ry="6" fill="#000000" opacity="0.08" />

      {/* 잎사귀 새싹(머리 위) — 알 단계는 아직 안 자란 작은 새싹만 */}
      {isEgg ? (
        <path d="M50 28 C 47 22, 53 22, 50 28 Z" fill={pet.leaf_color} />
      ) : (
        <>
          <path d="M50 26 C 40 8, 50 6, 50 26 Z" fill={pet.leaf_color} />
          <path d="M50 26 C 60 12, 68 16, 50 26 Z" fill={pet.leaf_color} />
        </>
      )}

      {/* 시무룩할 때 머리 위 한숨 구름 */}
      {sulking && (
        <g opacity="0.55">
          <circle cx="70" cy="20" r="5" fill="#9A97B0" />
          <circle cx="76" cy="14" r="3.5" fill="#9A97B0" />
        </g>
      )}

      {/* 몸통 */}
      <ellipse cx="50" cy="64" rx={isEgg ? 27 : 31} ry={isEgg ? 32 : 33} fill={pet.body_color} />
      {/* 상단 하이라이트(광택) */}
      <ellipse cx="39" cy="46" rx="9" ry="6" fill="#ffffff" opacity="0.25" />
      {/* 하단 음영 */}
      <ellipse cx="50" cy="88" rx={isEgg ? 22 : 25} ry="10" fill="#000000" opacity="0.06" />

      {/* 발(알 단계는 몸에 파묻혀 안 보임) */}
      {!isEgg && (
        <>
          <ellipse cx="36" cy="94" rx="8" ry="6" fill={pet.body_color} />
          <ellipse cx="64" cy="94" rx="8" ry="6" fill={pet.body_color} />
        </>
      )}

      {/* 가방(성체 전용, 옆구리에 살짝) */}
      {showCoinAndBag && (
        <>
          <circle cx="22" cy="70" r="11" fill={pet.bag_color} />
          <path d="M22 64 C 19 61, 25 61, 22 64 Z" fill={pet.leaf_color} />
        </>
      )}

      {/* 가계부(청소년기 전용, 안고 있는 모습) */}
      {showLedger && (
        <>
          <ellipse cx="30" cy="76" rx="7" ry="8" fill={pet.body_color} />
          <ellipse cx="70" cy="76" rx="7" ry="8" fill={pet.body_color} />
          <rect x="35" y="66" width="30" height="24" rx="4" fill={pet.ledger_color} />
          <text x="50" y="83" fontSize="13" fontWeight="800" fill="#ffffff" textAnchor="middle">
            ₩
          </text>
        </>
      )}

      {/* 코인 들어올린 팔(성체 전용) */}
      {showCoinAndBag && (
        <>
          <ellipse cx="76" cy="58" rx="7" ry="14" fill={pet.body_color} transform="rotate(-18 76 58)" />
          <circle cx="80" cy="42" r="9" fill="#F2C64C" />
          <text x="80" y="46" fontSize="9" fontWeight="800" fill="#8A6A17" textAnchor="middle">
            ₩
          </text>
          <path d="M90 30 l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6 Z" fill="#F2C64C" />
        </>
      )}

      {/* 시무룩할 때 앞으로 모은 팔 */}
      {sulking && !isEgg && (
        <>
          <ellipse cx="38" cy="86" rx="8" ry="7" fill={pet.body_color} />
          <ellipse cx="62" cy="86" rx="8" ry="7" fill={pet.body_color} />
        </>
      )}

      {/* 볼 홍조 */}
      {!isEgg && !sulking && (
        <>
          <ellipse cx="32" cy="66" rx="5" ry="3.2" fill="#FF9FBF" opacity="0.4" />
          <ellipse cx="68" cy="66" rx="5" ry="3.2" fill="#FF9FBF" opacity="0.4" />
        </>
      )}

      {/* 눈 */}
      {isEgg ? (
        // 알 단계 — 편안하게 감은 눈(웃는 아치)
        <>
          <path d="M38 58 Q42 53 46 58" stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M54 58 Q58 53 62 58" stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round" />
        </>
      ) : sulking ? (
        <>
          {/* 처진 눈썹 */}
          <path d="M35 50 L45 54" stroke={ink} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M65 50 L55 54" stroke={ink} strokeWidth={2.6} strokeLinecap="round" />
          {/* 아래를 보는 눈 */}
          <ellipse cx="41" cy="60" rx="6" ry="7" fill="#ffffff" />
          <ellipse cx="59" cy="60" rx="6" ry="7" fill="#ffffff" />
          <circle cx="41" cy="63" r="3.4" fill={ink} />
          <circle cx="59" cy="63" r="3.4" fill={ink} />
        </>
      ) : (
        <>
          <ellipse cx="41" cy="58" rx="7" ry="8.4" fill="#ffffff" />
          <ellipse cx="59" cy="58" rx="7" ry="8.4" fill="#ffffff" />
          <circle cx="41.5" cy="59" r="4" fill={ink} />
          <circle cx="59.5" cy="59" r="4" fill={ink} />
          <circle cx="43" cy="56.5" r="1.3" fill="#ffffff" />
          <circle cx="61" cy="56.5" r="1.3" fill="#ffffff" />
        </>
      )}

      {/* 입 */}
      {sulking ? (
        <path d="M45 72 Q50 69 55 72" stroke={ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      ) : !isEgg ? (
        <path d="M44 70 Q50 76 56 70" stroke={ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}
