"use client";
// components/character-demo/Character.tsx — 지금 선택된 캐릭터(selectedStage)를 크게 보여준다.
// public/ 원본 PNG를 그대로 쓴다(SVG·CSS 도형으로 다시 그리지 않는다). 단계마다 원본 비율이
// 달라서 next/image의 fill + object-fit: contain으로 비율을 유지한 채 프레임에 맞춘다.
import { stageNames, type CharacterStage } from "@/lib/characterStages";
import StageImage from "./StageImage";
import styles from "./characterDemo.module.css";

export default function Character({
  selectedStage,
  maxStage,
}: {
  selectedStage: CharacterStage;
  maxStage: CharacterStage;
}) {
  return (
    <section className={styles.characterCard} aria-label="선택된 캐릭터">
      {/* key를 단계로 두면 단계가 바뀔 때마다 새로 마운트되어 페이드+스케일 애니메이션이 다시 재생된다. */}
      <div key={selectedStage} className={styles.characterEnter}>
        <StageImage
          stage={selectedStage}
          height={240}
          alt={`${stageNames[selectedStage]} 캐릭터`}
          priority
        />
      </div>

      <div className={styles.characterMeta}>
        <div className={styles.metaItem}>
          <div className={styles.metaLabel}>현재 선택</div>
          <div className={styles.metaValue}>{stageNames[selectedStage]}</div>
        </div>
        {/* 성장 단계는 선택한 캐릭터가 아니라 도달한 최대 단계(maxStage)를 보여준다. */}
        <div className={styles.metaItem}>
          <div className={styles.metaLabel}>성장 단계</div>
          <div className={styles.metaValue}>
            Stage {maxStage} · {stageNames[maxStage]}
          </div>
        </div>
      </div>
    </section>
  );
}
