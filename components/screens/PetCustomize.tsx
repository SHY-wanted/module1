"use client";
// components/screens/PetCustomize.tsx — "캐릭터 커스텀"(디자인 파일 없음, 2026-09-15 사용자가 준 참고
// 이미지 기반 신규 구현). 개인 펫 전용 — 그룹 펫은 커스텀 대상이 아니다(사용자 확인: "개인용 펫만").
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getPersonalPet } from "@/lib/selectors";
import { PET_COLOR_PALETTE, PET_COLOR_PARTS, type PetColorPart } from "@/lib/pets";
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
          <PetMascot pet={{ stage_index: pet.stage_index, body_color: colors.body, ledger_color: colors.ledger, bag_color: colors.bag, eye_color: colors.eyes, leaf_color: colors.leaf }} size={120} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PET_COLOR_PARTS.map(({ key, label }) => (
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
