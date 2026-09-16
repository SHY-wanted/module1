"use client";
// components/character-demo/CharacterCustomizer.tsx — 캐릭터 꾸미기(색상 선택) UI.
// 지금 보고 있는 Stage에 "실제로 존재하는 부위"만 보여준다 — stageCustomization 표가 유일한 기준이다.
//   알       : 몸, 잎사귀
//   유년기   : 몸, 눈동자, 잎사귀
//   청소년기 : 몸, 눈동자, 잎사귀, 가계부   (가방 없음)
//   성년기   : 몸, 눈동자, 잎사귀, 가방     (가계부 없음)
// 코인은 커스터마이징 대상이 아니라서 항상 목록에 없다(원본 금색 유지).
import {
  colorPartNames,
  stageCustomization,
  type CharacterStage,
  type ColorPart,
} from "@/lib/characterStages";
import styles from "./characterDemo.module.css";

/** 자유 색상 선택과 함께 쓸 기본 프리셋. */
const PRESETS = [
  "#b8a7f0",
  "#5aa9f0",
  "#5ac2a0",
  "#f0c95a",
  "#f08a5a",
  "#ef7ba8",
  "#18191A",
];

export default function CharacterCustomizer({
  stage,
  colors,
  onChange,
}: {
  stage: CharacterStage;
  colors: Record<ColorPart, string>;
  onChange: (part: ColorPart, hex: string) => void;
}) {
  const parts = stageCustomization[stage];

  return (
    <section className={styles.customizer} aria-label="캐릭터 꾸미기">
      <h2 className={styles.sectionTitle}>캐릭터 꾸미기</h2>

      <div className={styles.partList}>
        {parts.map((part) => (
          <div key={part} className={styles.partRow}>
            <div className={styles.partHead}>
              <label className={styles.partLabel} htmlFor={`color-${part}`}>
                {colorPartNames[part]}
              </label>
              <input
                id={`color-${part}`}
                type="color"
                className={styles.colorInput}
                value={colors[part]}
                onChange={(e) => onChange(part, e.target.value)}
              />
            </div>

            <div className={styles.presetRow}>
              {PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className={[
                    styles.presetDot,
                    colors[part].toLowerCase() === hex.toLowerCase() ? styles.presetDotOn : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ background: hex }}
                  onClick={() => onChange(part, hex)}
                  aria-label={`${colorPartNames[part]} ${hex}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className={styles.customizerNote}>
        코인은 꾸미기 대상이 아니라 항상 원래 금색을 유지합니다.
      </p>
    </section>
  );
}
