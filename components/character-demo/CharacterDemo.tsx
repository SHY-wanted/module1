"use client";
// components/character-demo/CharacterDemo.tsx — 성장형 캐릭터 데모의 상태 보관소.
// 스펙 원문의 App.tsx 자리(이 프로젝트는 Next.js라서 라우트는 app/character-demo/page.tsx가 맡고,
// 상태·조립은 이 클라이언트 컴포넌트가 맡는다).
//
// 가장 중요한 규칙: maxStage(도달한 최대 성장 단계)와 selectedStage(지금 화면에 보여줄 캐릭터)는
// 절대 한 state로 합치지 않는다.
//   - 캐릭터를 이전 단계로 바꿔도 maxStage는 그대로 → 진행률이 내려가지 않는다.
//   - 성장하면 maxStage가 오르고, 그때는 selectedStage도 새 단계로 따라 올라간다.
//
// 이 컴포넌트는 CharacterDemoClient.tsx에서 ssr:false로 불러오므로 브라우저에서만 렌더링된다.
// 덕분에 스펙 원문처럼 useState 초기화 함수에서 곧바로 localStorage를 읽어도 안전하다
// (서버 렌더링이 없으니 localStorage 미존재 오류도, 하이드레이션 불일치도 생기지 않는다).
import { useEffect, useState } from "react";
import {
  FINAL_STAGE,
  STORAGE_KEYS,
  parseColors,
  parseStage,
  type CharacterStage,
  type ColorPart,
} from "@/lib/characterStages";
import Character from "./Character";
import CharacterCustomizer from "./CharacterCustomizer";
import CharacterSelector from "./CharacterSelector";
import GrowthControls from "./GrowthControls";
import GrowthProgress from "./GrowthProgress";
import styles from "./characterDemo.module.css";

export default function CharacterDemo() {
  const [maxStage, setMaxStage] = useState<CharacterStage>(() =>
    parseStage(localStorage.getItem(STORAGE_KEYS.maxStage))
  );

  const [selectedStage, setSelectedStage] = useState<CharacterStage>(() => {
    const savedMax = parseStage(localStorage.getItem(STORAGE_KEYS.maxStage));
    const savedSelected = parseStage(localStorage.getItem(STORAGE_KEYS.selectedStage));
    // 저장값이 어떤 이유로든 maxStage보다 높으면(수동 편집 등) 해금 범위 안으로 되돌린다.
    return savedSelected > savedMax ? savedMax : savedSelected;
  });

  // 꾸미기 색상. Stage와 무관하게 한 벌만 두고, 각 Stage에서는 존재하는 부위만 골라 쓴다
  // (예: 알에서 몸 색을 바꿔두면 유년기로 자란 뒤에도 그 색이 그대로 이어진다).
  const [colors, setColors] = useState<Record<ColorPart, string>>(() =>
    parseColors(localStorage.getItem(STORAGE_KEYS.colors))
  );

  // 값이 바뀔 때마다 저장 — effect의 정석적인 용도(React 상태를 외부 시스템에 반영).
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.maxStage, String(maxStage));
  }, [maxStage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.selectedStage, String(selectedStage));
  }, [selectedStage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.colors, JSON.stringify(colors));
  }, [colors]);

  function handleGrow() {
    if (maxStage >= FINAL_STAGE) return;
    const next = (maxStage + 1) as CharacterStage;
    setMaxStage(next);
    // 새 단계에 도달하면 새 캐릭터를 자동으로 보여준다.
    setSelectedStage(next);
  }

  function handleSelect(stage: CharacterStage) {
    // 잠긴 단계는 고를 수 없다. 그리고 여기서 maxStage는 절대 건드리지 않는다.
    if (stage > maxStage) return;
    setSelectedStage(stage);
  }

  function handleColorChange(part: ColorPart, hex: string) {
    setColors((prev) => ({ ...prev, [part]: hex }));
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>나의 캐릭터</h1>

        <Character selectedStage={selectedStage} maxStage={maxStage} colors={colors} />
        <GrowthProgress maxStage={maxStage} selectedStage={selectedStage} />
        <GrowthControls maxStage={maxStage} onGrow={handleGrow} />
        <CharacterCustomizer stage={selectedStage} colors={colors} onChange={handleColorChange} />
        <CharacterSelector
          maxStage={maxStage}
          selectedStage={selectedStage}
          onSelect={handleSelect}
          colors={colors}
        />
      </div>
    </main>
  );
}
