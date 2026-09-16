"use client";
// components/character-demo/Character.tsx — 지금 선택된 캐릭터(selectedStage)를 크게 보여준다.
// 원본 PNG + 부위별 Pixel Mask + 사용자 색상을 캔버스에서 합쳐 그린다(CharacterCanvas).
// PNG를 SVG나 도형으로 다시 그리지 않고, 원본 파일도 수정하지 않는다.
import { stageNames, type CharacterStage, type ColorPart } from "@/lib/characterStages";
import CharacterCanvas from "./CharacterCanvas";
import styles from "./characterDemo.module.css";

export default function Character({
  selectedStage,
  maxStage,
  colors,
}: {
  selectedStage: CharacterStage;
  maxStage: CharacterStage;
  colors: Record<ColorPart, string>;
}) {
  return (
    <section className={styles.characterCard} aria-label="선택된 캐릭터">
      {/* key를 단계로 두면 단계가 바뀔 때마다 새로 마운트되어 페이드+스케일 애니메이션이 다시 재생된다. */}
      <div key={selectedStage} className={styles.characterEnter}>
        <CharacterCanvas stage={selectedStage} colors={colors} height={240} />
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
