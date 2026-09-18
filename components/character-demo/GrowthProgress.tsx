"use client";
// components/character-demo/GrowthProgress.tsx — 성장 진행률.
// 진행률은 반드시 maxStage로만 계산한다. 이전 단계 캐릭터를 골라놔도(selectedStage가 낮아도)
// 진행률은 절대 내려가지 않는다 — 두 값을 분리해서 관리하는 이유가 바로 이것이다.
import { growthProgress, stageNames, type CharacterStage } from "@/lib/characterStages";
import styles from "./characterDemo.module.css";

export default function GrowthProgress({
  maxStage,
  selectedStage,
}: {
  maxStage: CharacterStage;
  selectedStage: CharacterStage;
}) {
  const progress = growthProgress(maxStage);

  return (
    <section className={styles.progressCard} aria-label="성장 진행률">
      <div className={styles.progressHead}>
        <h2 className={styles.progressTitle}>성장 진행률</h2>
        <span className={styles.progressValue}>{Math.round(progress)}%</span>
      </div>

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`성장 진행률 ${Math.round(progress)}퍼센트`}
      >
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {selectedStage !== maxStage && (
        <p className={styles.progressNote}>
          지금 보고 있는 캐릭터는 {stageNames[selectedStage]}지만, 성장은 {stageNames[maxStage]}까지
          도달한 상태입니다.
        </p>
      )}
    </section>
  );
}
