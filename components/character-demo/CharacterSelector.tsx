"use client";
// components/character-demo/CharacterSelector.tsx — 해금된 캐릭터를 자유롭게 고르는 카드 목록.
// 카드를 눌러도 maxStage는 절대 바뀌지 않는다 — 바뀌는 건 selectedStage(화면에 보여줄 캐릭터)뿐이다.
// stage > maxStage 인 단계는 잠금 상태로 표시하고 클릭할 수 없다.
import { ALL_STAGES, stageNames, type CharacterStage } from "@/lib/characterStages";
import StageImage from "./StageImage";
import styles from "./characterDemo.module.css";

export default function CharacterSelector({
  maxStage,
  selectedStage,
  onSelect,
}: {
  maxStage: CharacterStage;
  selectedStage: CharacterStage;
  onSelect: (stage: CharacterStage) => void;
}) {
  return (
    <section className={styles.selectorSection} aria-label="캐릭터 선택">
      <h2 className={styles.sectionTitle}>캐릭터 선택</h2>

      <div className={styles.stageGrid}>
        {ALL_STAGES.map((stage) => {
          const locked = stage > maxStage;
          const selected = stage === selectedStage;

          return (
            <button
              key={stage}
              type="button"
              className={[
                styles.stageCard,
                selected ? styles.stageCardSelected : "",
                locked ? styles.stageCardLocked : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelect(stage)}
              disabled={locked}
              aria-pressed={selected}
              aria-label={
                locked
                  ? `Stage ${stage} ${stageNames[stage]} 잠김`
                  : `Stage ${stage} ${stageNames[stage]}${selected ? " 현재 캐릭터" : ""}`
              }
            >
              <div className={styles.stageThumbFrame}>
                <StageImage
                  stage={stage}
                  height={72}
                  alt=""
                  imageClassName={locked ? styles.stageThumbLocked : undefined}
                />
                {locked && (
                  <span className={styles.lockMark} aria-hidden="true">
                    🔒
                  </span>
                )}
              </div>

              <span className={styles.stageNo}>STAGE {stage}</span>
              <span className={styles.stageName}>{stageNames[stage]}</span>
              <span className={`${styles.stageState} ${locked ? styles.stageStateLocked : ""}`}>
                {locked ? "잠김" : selected ? "✓ 현재 캐릭터" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
