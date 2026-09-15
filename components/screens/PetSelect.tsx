"use client";
// components/screens/PetSelect.tsx — P1. 펫 선택(디자인 파일 없음, docs/08-pet-feature-spec.md §1 근거,
// 2026-09-15 신규 구현). scope가 personal이면 개인 펫, group이면 그 그룹의 그룹 펫을 만든다
// (§9 종민 확인: 개인 펫 + 그룹 펫 둘 다 존재하는 구조 — 배타적으로 한쪽만 채워진다).
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import type { CategoryScope } from "@/lib/categories";
import { PET_SPECIES_LIST, PET_SPECIES_META, type PetSpecies } from "@/lib/pets";
import { ChevronLeftIcon } from "../icons";

export default function PetSelect({ scope }: { scope: CategoryScope }) {
  const nav = useNav();
  const store = useStore();
  const [species, setSpecies] = useState<PetSpecies | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!species || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await store.createPet(scope, species, name);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "펫을 만들지 못했어요");
      return;
    }
    nav.push({ id: "petDetail", scope });
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", padding: "20px 24px 28px", background: "var(--shoot-bg)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex", width: "fit-content", marginBottom: 14 }}>
        <ChevronLeftIcon size={18} color="var(--shoot-text)" />
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, color: "var(--shoot-text)" }}>
        {scope.kind === "personal" ? "저금통 펫을 골라주세요" : "그룹 펫을 골라주세요"}
      </div>
      <div style={{ fontSize: 13, color: "var(--shoot-text-muted)", marginTop: 6, fontWeight: 600 }}>
        {scope.kind === "personal" ? "지출을 아낄수록 함께 자라요" : "그룹원이 함께 돌보는 펫이에요"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 22 }}>
        {PET_SPECIES_LIST.map((s) => {
          const meta = PET_SPECIES_META[s];
          const selected = species === s;
          return (
            <div
              key={s}
              onClick={() => setSpecies(s)}
              style={{
                borderRadius: 18,
                padding: "20px 10px",
                background: selected ? "var(--shoot-accent)" : "var(--shoot-surface)",
                border: `2px solid ${selected ? "var(--shoot-accent)" : "var(--shoot-border)"}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                boxShadow: selected ? "0 6px 16px rgba(106,94,207,0.35)" : "0 2px 6px rgba(45,42,62,0.06)",
              }}
            >
              <div style={{ fontSize: 44 }}>{meta.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: selected ? "#fff" : "var(--shoot-text)" }}>{meta.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>이름(선택)</div>
        <input
          type="text"
          placeholder={species ? `비워두면 "${PET_SPECIES_META[species].defaultName}"` : "먼저 종을 골라주세요"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: "2px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)" }}
        />
      </div>

      {error && <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B", textAlign: "center", marginTop: 14 }}>{error}</div>}

      <div style={{ flex: 1 }} />
      <div
        onClick={handleSubmit}
        style={{
          height: 50,
          borderRadius: 16,
          background: species ? "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)" : "#E9E7F3",
          color: species ? "#3F3480" : "#A9A2B8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          fontWeight: 800,
          boxShadow: species ? "0 8px 18px rgba(106,94,207,0.3)" : "none",
          cursor: species ? "pointer" : "default",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {scope.kind === "personal" ? "펫 데려오기" : "그룹 펫 데려오기"}
      </div>
    </div>
  );
}
