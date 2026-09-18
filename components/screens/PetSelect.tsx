"use client";
// components/screens/PetSelect.tsx — P1. 펫 선택(디자인 파일 없음, docs/08-pet-feature-spec.md §1 근거,
// 2026-09-15 신규 구현 → 같은 날 사용자 확인으로 종 선택을 없애고 마스코트 하나로 통일).
// scope가 personal이면 개인 펫, group이면 그 그룹의 그룹 펫을 만든다(§9: 개인+그룹 둘 다 존재하는 구조).
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import type { CategoryScope } from "@/lib/categories";
import PetMascot from "../PetMascot";
import { ChevronLeftIcon } from "../icons";

export default function PetSelect({ scope }: { scope: CategoryScope }) {
  const nav = useNav();
  const store = useStore();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await store.createPet(scope, name);
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
        {scope.kind === "personal" ? "저금통 펫을 데려와요" : "그룹 펫을 데려와요"}
      </div>
      <div style={{ fontSize: 13, color: "var(--shoot-text-muted)", marginTop: 6, fontWeight: 600 }}>
        {scope.kind === "personal" ? "지출을 아낄수록 함께 자라요. 색상은 나중에 꾸미기에서 바꿀 수 있어요" : "그룹원이 함께 돌보는 펫이에요"}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
        <PetMascot
          pet={{ stage_index: 1, body_color: "#8C81E0", ledger_color: "#6A5ECF", bag_color: "#BDB2F2", eye_color: "#2D2A3E", leaf_color: "#6FC5BA" }}
          size={110}
        />
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>이름(선택)</div>
        <input
          type="text"
          placeholder="비워두면 기본 이름으로 시작해요"
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
          background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)",
          color: "#3F3480",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          fontWeight: 800,
          boxShadow: "0 8px 18px rgba(106,94,207,0.3)",
          cursor: "pointer",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {scope.kind === "personal" ? "펫 데려오기" : "그룹 펫 데려오기"}
      </div>
    </div>
  );
}
