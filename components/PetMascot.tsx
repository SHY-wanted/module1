"use client";
// components/PetMascot.tsx — 저금통 펫 마스코트. 2026-09-15 세 번째 전환: 사용자가 준 참고 이미지를
// 실제로 잘라 붙이는 방식(래스터 추출 + 마스킹)으로 두 번 시도했지만, 눈/잎사귀/가계부/가방 경계를
// 색 임계값으로 아무리 정밀하게 잡아도 "덜 칠해지거나 안 칠해지는 부분"이 계속 남았다(사용자 신고
// 다수). 사용자가 최종적으로 "비슷하게 그려서 커스터마이징하기 편하게 하라"고 요청 — 참고 이미지를
// 그림체 참고용으로만 쓰고, 실제로는 SVG로 다시 그린다. 벡터 도형은 색을 채우는 것뿐이라 부위 경계가
// 흐릿해지거나 잘려나가는 문제가 구조적으로 없다.
//
// 부위 구성(2026-09-15 사용자 최종 확인 — v2 참고 이미지의 스테이지별 라벨과는 다르다):
//   1=알: 몸+잎사귀만
//   2=유년기: 몸+눈+잎사귀
//   3=청소년기: 몸+눈+잎사귀+가계부(₩ 표시 책, 안고 있음)
//   4=성년기: 몸+눈+잎사귀+가방(옆구리에 멤) — 들고 있는 코인은 고정 장식(커스텀 대상 아님)
// lib/pets.ts의 colorPartsForStage()가 이 표를 그대로 코드로 옮긴 것.
//
// 입체감(하이라이트·그림자)은 반투명 흰색/검은색 오버레이 도형으로 흉내낸다 — 사용자 색을 얼마든지
// 바꿔도 그 위에 얹은 하이라이트/그림자 도형은 그대로 남아 "명암이 사라지지 않는다"는 요구를 만족한다.
import type { Pet } from "@/lib/mock";
import { MAX_STAGE_INDEX } from "@/lib/pets";

const STAGE_SIZE = [56, 70, 88, 104]; // stage_index 1~4(1=알)에 대응, 성장할수록 커짐
const VIEW_W = 120;
const VIEW_H = 128;

export function petMascotSize(stageIndex: number): number {
  return STAGE_SIZE[Math.min(Math.max(stageIndex, 1), MAX_STAGE_INDEX) - 1] ?? STAGE_SIZE[0];
}

type PetColorProps = Pick<Pet, "stage_index" | "body_color" | "ledger_color" | "bag_color" | "eye_color" | "leaf_color">;

// 고정(커스텀 대상 아님) 색상 — 흰자, 볼터치, 입, 코인, 하이라이트/그림자 오버레이.
const FIXED = {
  eyeWhite: "#FFFFFF",
  cheek: "#FF9EC4",
  mouth: "#5A3D52",
  coin: "#F2C64C",
  coinText: "#8A6A17",
  highlight: "rgba(255,255,255,0.35)",
  shadow: "rgba(0,0,0,0.08)",
};

function Leaf({ color, small = false }: { color: string; small?: boolean }) {
  return small ? (
    <path d="M60 40 C 57 32, 63 32, 60 40 Z" fill={color} />
  ) : (
    <>
      <path d="M60 38 C 46 14, 60 8, 60 38 Z" fill={color} />
      <path d="M60 38 C 76 18, 88 24, 60 38 Z" fill={color} />
      <rect x="57" y="35" width="6" height="14" rx="3" fill={color} />
    </>
  );
}

function Eyes({ color, sulking }: { color: string; sulking: boolean }) {
  if (sulking) {
    return (
      <>
        <path d="M40 62 L52 68" stroke={color} strokeWidth={3} strokeLinecap="round" />
        <path d="M80 62 L68 68" stroke={color} strokeWidth={3} strokeLinecap="round" />
        <ellipse cx="46" cy="74" rx="8" ry="9" fill={FIXED.eyeWhite} />
        <ellipse cx="74" cy="74" rx="8" ry="9" fill={FIXED.eyeWhite} />
        <circle cx="46" cy="78" r="4.2" fill={color} />
        <circle cx="74" cy="78" r="4.2" fill={color} />
      </>
    );
  }
  return (
    <>
      <ellipse cx="46" cy="70" rx="9.5" ry="11" fill={FIXED.eyeWhite} />
      <ellipse cx="74" cy="70" rx="9.5" ry="11" fill={FIXED.eyeWhite} />
      <circle cx="47" cy="71" r="5.4" fill={color} />
      <circle cx="75" cy="71" r="5.4" fill={color} />
      <circle cx="49" cy="68" r="1.6" fill="#fff" />
      <circle cx="77" cy="68" r="1.6" fill="#fff" />
    </>
  );
}

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
  const stage = Math.min(Math.max(pet.stage_index, 1), MAX_STAGE_INDEX);
  const isEgg = stage === 1;
  const hasLedger = stage === 3 && !sulking; // 시무룩할 땐 안고 있던 가계부를 내려놓은 모습(팔짱)으로 대체
  const hasBag = stage >= 4;
  const bodyRy = 30 + stage * 3;
  const bodyCy = 66 + stage * 2;

  return (
    <svg
      width={px * (VIEW_W / VIEW_H)}
      height={px}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="shoot-pet-bounce"
      style={{ display: "block", overflow: "visible" }}
    >
      {/* 바닥 그림자 */}
      <ellipse cx="60" cy="120" rx="28" ry="6" fill="#000000" opacity="0.08" />

      {/* 잎사귀(머리 위) */}
      <Leaf color={pet.leaf_color} small={isEgg} />

      {/* 시무룩할 때 머리 위 한숨 구름 */}
      {sulking && (
        <g opacity="0.5">
          <circle cx="86" cy="30" r="5" fill="#9A97B0" />
          <circle cx="93" cy="24" r="3.5" fill="#9A97B0" />
        </g>
      )}

      {/* 몸통 */}
      <ellipse cx="60" cy={bodyCy} rx={isEgg ? 30 : 36} ry={bodyRy} fill={pet.body_color} />
      <ellipse cx="47" cy={bodyCy - 18} rx="10" ry="7" fill={FIXED.highlight} />
      <ellipse cx="60" cy={bodyCy + bodyRy - 10} rx={isEgg ? 22 : 26} ry="10" fill={FIXED.shadow} />

      {/* 가방(성년기, 옆구리) — 몸통 위에 걸쳐서 그려야 가려지지 않고 온전히 보인다. */}
      {hasBag && (
        <>
          <circle cx="16" cy="88" r="13" fill={pet.bag_color} />
          <path d="M16 81 C 12 77, 20 77, 16 81 Z" fill={pet.leaf_color} />
        </>
      )}

      {/* 발 */}
      {!isEgg && (
        <>
          <ellipse cx="42" cy={bodyCy + bodyRy - 4} rx="9" ry="6.5" fill={pet.body_color} />
          <ellipse cx="78" cy={bodyCy + bodyRy - 4} rx="9" ry="6.5" fill={pet.body_color} />
        </>
      )}

      {/* 코인 들고 있는 팔(성년기 전용, 고정 장식) */}
      {hasBag && !sulking && (
        <>
          <ellipse cx="92" cy="66" rx="8" ry="16" fill={pet.body_color} transform="rotate(-16 92 66)" />
          <circle cx="97" cy="46" r="10" fill={FIXED.coin} />
          <text x="97" y="50" fontSize="10" fontWeight={800} fill={FIXED.coinText} textAnchor="middle">
            ₩
          </text>
          <path d="M110 32 l1.8 3.8 3.8 1.8 -3.8 1.8 -1.8 3.8 -1.8 -3.8 -3.8 -1.8 3.8 -1.8 Z" fill={FIXED.coin} />
        </>
      )}

      {/* 가계부(청소년기 전용, 안고 있는 모습) */}
      {hasLedger && (
        <>
          <ellipse cx="38" cy={bodyCy + 14} rx="9" ry="10" fill={pet.body_color} />
          <ellipse cx="82" cy={bodyCy + 14} rx="9" ry="10" fill={pet.body_color} />
          <rect x="42" y={bodyCy} width="36" height="28" rx="5" fill={pet.ledger_color} />
          <rect x="46" y={bodyCy + 4} width="28" height="4" rx="2" fill="#ffffff" opacity="0.55" />
          <text x="60" y={bodyCy + 21} fontSize="14" fontWeight={800} fill="#ffffff" textAnchor="middle">
            ₩
          </text>
        </>
      )}

      {/* 시무룩할 때 팔짱(가계부를 내려놓은 자리) */}
      {sulking && stage === 3 && (
        <>
          <ellipse cx="44" cy={bodyCy + 16} rx="9" ry="8" fill={pet.body_color} />
          <ellipse cx="76" cy={bodyCy + 16} rx="9" ry="8" fill={pet.body_color} />
        </>
      )}

      {/* 볼 홍조 */}
      {!isEgg && (
        <>
          <ellipse cx="35" cy="80" rx="5.5" ry="3.6" fill={FIXED.cheek} opacity="0.45" />
          <ellipse cx="85" cy="80" rx="5.5" ry="3.6" fill={FIXED.cheek} opacity="0.45" />
        </>
      )}

      {/* 눈 */}
      {isEgg ? (
        <>
          <path d="M44 64 Q49 58 54 64" stroke={FIXED.mouth} strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M66 64 Q71 58 76 64" stroke={FIXED.mouth} strokeWidth={3} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <Eyes color={pet.eye_color} sulking={sulking} />
      )}

      {/* 입 — 눈(cy≈71)·볼(cy=80) 사이에 오도록 위치 조정(전엔 몸통 아래쪽 가장자리에 걸쳐 보였다). */}
      {sulking && !isEgg ? (
        <path d="M53 83 Q60 80 67 83" stroke={FIXED.mouth} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      ) : !isEgg ? (
        <path d="M52 81 Q60 87 68 81" stroke={FIXED.mouth} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}
