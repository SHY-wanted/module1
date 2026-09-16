"use client";
// components/screens/PetCustomize.tsx — "캐릭터 커스텀"(디자인 파일 없음, 2026-09-15 사용자가 준 참고
// 이미지 기반 신규 구현). 개인 펫 전용 — 그룹 펫은 커스텀 대상이 아니다(사용자 확인: "개인용 펫만").
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getPersonalPet } from "@/lib/selectors";
import { PET_COLOR_PALETTE, PET_COLOR_PARTS, PET_STAGE_LABELS, colorPartsForStage, type PetColorPart } from "@/lib/pets";
import PetMascot from "../PetMascot";
import { ChevronLeftIcon } from "../icons";

export default function PetCustomize() {
  const nav = useNav();
  const store = useStore();
  const pet = getPersonalPet(store.pets, store.currentUserId);

  const [colors, setColors] = useState(() =>
    pet
      ? { body: pet.body_color, ledger: pet.ledger_color, bag: pet.bag_color, eyes: pet.eye_color, leaf: pet.leaf_color }
      : { body: "#8C81E0", ledger: "#6A5ECF", bag: "#BDB2F2", eyes: "#2D2A3E", leaf: "#6FC5BA" }
  );
  const [saving, setSaving] = useState(false);
  // 개발 중 미리보기용 — 실제 XP를 안 쌓아도 4단계 그림을 전부 볼 수 있게 임시로 넣었다(2026-09-15
  // 사용자 요청 "다 해금 해서 보여줘"). pet.stage_index 자체는 안 바꾸고 화면 미리보기만 바꾼다.
  const [previewStage, setPreviewStage] = useState(pet?.stage_index ?? 1);

  function setPart(part: PetColorPart, color: string) {
    setColors((prev) => ({ ...prev, [part]: color }));
  }

  async function handleApply() {
    if (!pet || saving) return;
    setSaving(true);
    await store.setPetColors(pet.id, colors);
    setSaving(false);
    store.showToast("펫을 꾸몄어요");
    nav.back();
  }

  if (!pet) {
    return (
      <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
            <ChevronLeftIcon size={18} color="var(--shoot-text)" />
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--shoot-text-muted)", fontSize: 13, fontWeight: 600 }}>
          아직 개인 펫이 없어요
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)" }}>캐릭터 커스텀</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 20px" }}>
          <PetMascot pet={{ stage_index: previewStage, body_color: colors.body, ledger_color: colors.ledger, bag_color: colors.bag, eye_color: colors.eyes, leaf_color: colors.leaf }} size={120} />
        </div>

        {/* 개발 중 미리보기 — 실제 성장 단계(pet.stage_index)와 무관하게 4단계를 다 볼 수 있다. */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 18 }}>
          {PET_STAGE_LABELS.map((label, i) => {
            const stage = i + 1;
            const selected = stage === previewStage;
            return (
              <div
                key={stage}
                onClick={() => setPreviewStage(stage)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: selected ? "var(--shoot-accent)" : "var(--shoot-surface-alt)",
                  color: selected ? "#fff" : "var(--shoot-text-muted)",
                }}
              >
                {label}
              </div>
            );
          })}
        </div>

        {/* 성장 단계마다 실제로 존재하는 부위만 보여준다(사용자 확인 — 참고 이미지 자체에 스테이지별
            "변경 가능 색상" 라벨이 적혀 있음). 예: 알엔 눈·가계부·가방이 없어서 그 스와치를 숨긴다. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PET_COLOR_PARTS.filter(({ key }) => colorPartsForStage(previewStage).includes(key)).map(({ key, label }) => (
            <div key={key} style={{ background: "var(--shoot-surface)", border: "1px solid var(--shoot-border)", borderRadius: 16, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text)", marginBottom: 10 }}>{label}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PET_COLOR_PALETTE.map((hex) => {
                  const selected = colors[key] === hex;
                  return (
                    <div
                      key={hex}
                      onClick={() => setPart(key, hex)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: hex,
                        cursor: "pointer",
                        border: selected ? "3px solid var(--shoot-text)" : "2px solid var(--shoot-border)",
                        boxSizing: "border-box",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div
          onClick={handleApply}
          style={{ marginTop: 20, height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
          적용하기
        </div>
      </div>
    </div>
  );
}
