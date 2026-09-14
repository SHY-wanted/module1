"use client";
// components/screens/GroupNameBase.tsx — 3b-1~6 공통 뼈대. GroupName{Family,Married,Couple,Roommate,Club,Other}.tsx가 이걸 감싼다.
// design/shoot/GroupNameCouple.dc.html에만 있던 controlled input 로직(state.groupName)을 6개 화면 모두에 동일하게 적용한다
// (다른 5개 파일엔 스크립트가 없어 정적 placeholder뿐이었지만, 실제로 타이핑이 되어야 그룹 생성 플로우가 동작하므로).
import { useState, type ReactNode } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import type { GroupType } from "@/lib/mock";
import { ChevronLeftIcon } from "../icons";

export interface GroupNameBaseProps {
  groupType: GroupType;
  badgeIcon: ReactNode;
  badgeColor: string;
  badgeLabel: string;
  placeholder: string;
  chips: string[];
}

export default function GroupNameBase({ groupType, badgeIcon, badgeColor, badgeLabel, placeholder, chips }: GroupNameBaseProps) {
  const nav = useNav();
  const store = useStore();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0; // P1: 그룹 이름 없으면 그룹 생성 불가

  // 2026-09-18 추가: 실제 groups·group_members INSERT라 네트워크 실패 등으로 실패할 수 있다.
  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await store.createGroup(name, groupType);
    setSubmitting(false);
    if (!result.ok || !result.data) {
      setError(result.error ?? "그룹을 만들지 못했어요");
      return;
    }
    nav.push({ id: "groupCreateDone", groupId: result.data.id });
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", padding: "20px 24px 28px", background: "var(--shoot-bg)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* 2026-09-14 팀 결정: 뒤로가기 버튼 추가 — 3a(유형 선택)로 pop. */}
      <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex", width: "fit-content", marginBottom: 14 }}>
        <ChevronLeftIcon size={18} color="var(--shoot-text)" />
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <div style={{ height: 4, flex: 1, borderRadius: 2, background: "var(--shoot-accent)" }} />
        <div style={{ height: 4, flex: 1, borderRadius: 2, background: "var(--shoot-accent)" }} />
        <div style={{ height: 4, flex: 1, borderRadius: 2, background: "var(--shoot-border)" }} />
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, color: "var(--shoot-text)" }}>그룹 이름을 지어주세요</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--shoot-surface-alt)", borderRadius: 10, padding: "6px 12px", marginTop: 10, width: "fit-content" }}>
        {badgeIcon}
        <span style={{ fontSize: 12, fontWeight: 800, color: badgeColor }}>{badgeLabel}</span>
      </div>
      <div style={{ marginTop: 40 }}>
        <input
          type="text"
          placeholder={placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", height: 52, borderRadius: 16, border: "2px solid var(--shoot-accent)", background: "var(--shoot-surface)", padding: "0 18px", fontSize: 16, fontWeight: 800, color: "var(--shoot-text)", textAlign: "center" }}
        />
      </div>
      <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", fontWeight: 700, marginTop: 16 }}>이런 이름 어때요?</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        {chips.map((chip) => (
          // 2026-09-18 팀 요청: 누르면 위 입력칸에 그 문구를 그대로 채운다.
          <div
            key={chip}
            onClick={() => setName(chip)}
            style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text)", background: "var(--shoot-surface-alt)", padding: "6px 12px", borderRadius: 10, cursor: "pointer" }}
          >
            {chip}
          </div>
        ))}
      </div>
      {error && <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B", textAlign: "center", marginTop: 10 }}>{error}</div>}
      <div style={{ flex: 1 }} />
      <div
        onClick={handleSubmit}
        style={{
          height: 50,
          borderRadius: 16,
          background: canSubmit ? "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)" : "#E9E7F3",
          color: canSubmit ? "#3F3480" : "#A9A2B8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          fontWeight: 800,
          boxShadow: canSubmit ? "0 8px 18px rgba(106,94,207,0.3)" : "none",
          cursor: canSubmit ? "pointer" : "default",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        그룹 만들기
      </div>
    </div>
  );
}
