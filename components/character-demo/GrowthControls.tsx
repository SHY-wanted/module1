"use client";
// components/character-demo/GrowthControls.tsx — "성장하기" 버튼.
// 비활성 조건은 오직 하나: 이미 최종 단계(maxStage === 3)일 때.
// selectedStage가 낮다고 해서(이전 캐릭터를 보고 있다고 해서) 비활성화되면 안 된다.
import { FINAL_STAGE, type CharacterStage } from "@/lib/characterStages";
import styles from "./characterDemo.module.css";

export default function GrowthControls({
  maxStage,
  onGrow,
}: {
  maxStage: CharacterStage;
  onGrow: () => void;
}) {
  const isFinal = maxStage === FINAL_STAGE;

  return (
    <button type="button" className={styles.growButton} onClick={onGrow} disabled={isFinal}>
      {isFinal ? "최종 성장 완료!" : "성장하기"}
    </button>
  );
}
