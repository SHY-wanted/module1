"use client";
// components/screens/GroupNameBase.tsx — 3b-1~6 공통 뼈대. GroupName{Family,Married,Couple,Roommate,Club,Other}.tsx가 이걸 감싼다.
// design/shoot/GroupNameCouple.dc.html에만 있던 controlled input 로직(state.groupName)을 6개 화면 모두에 동일하게 적용한다
// (다른 5개 파일엔 스크립트가 없어 정적 placeholder뿐이었지만, 실제로 타이핑이 되어야 그룹 생성 플로우가 동작하므로).
import { useState, type ReactNode } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import type { GroupType } from "@/lib/mock";

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

  const canSubmit = name.trim().length > 0; // P1: 그룹 이름 없으면 그룹 생성 불가

  function handleSubmit() {
    if (!canSubmit) return;
    const group = store.createGroup(name, groupType);
    nav.push({ id: "groupCreateDone", groupId: group.id });
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", padding: "20px 24px 28px", background: "#F6F5FC", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <div style={{ height: 4, flex: 1, borderRadius: 2, background: "#6A5ECF" }} />
        <div style={{ height: 4, flex: 1, borderRadius: 2, background: "#6A5ECF" }} />
        <div style={{ height: 4, flex: 1, borderRadius: 2, background: "#E8E4F4" }} />
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, color: "#2D2A3E" }}>그룹 이름을 지어주세요</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#F0EEFF", borderRadius: 10, padding: "6px 12px", marginTop: 10, width: "fit-content" }}>
        {badgeIcon}
        <span style={{ fontSize: 12, fontWeight: 800, color: badgeColor }}>{badgeLabel}</span>
      </div>
      <div style={{ marginTop: 40 }}>
        <input
          type="text"
          placeholder={placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", height: 52, borderRadius: 16, border: "2px solid #6A5ECF", background: "#fff", padding: "0 18px", fontSize: 16, fontWeight: 800, color: "#2D2A3E", textAlign: "center" }}
        />
      </div>
      <div style={{ fontSize: 12, color: "#6B6980", fontWeight: 700, marginTop: 16 }}>이런 이름 어때요?</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        {chips.map((chip) => (
          // 디자인 스크립트에 칩 클릭 동작이 없어(정적 표시) 그대로 둔다 — 클릭 시 입력칸을 채우는 동작은 지어내지 않는다.
          <div key={chip} style={{ fontSize: 12, fontWeight: 700, color: "#2D2A3E", background: "#F0EEFF", padding: "6px 12px", borderRadius: 10 }}>
            {chip}
          </div>
        ))}
      </div>
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
        }}
      >
        그룹 만들기
      </div>
    </div>
  );
}
