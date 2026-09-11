"use client";
// components/screens/GroupCreateType.tsx — 3a. 그룹 생성 — 모임 선택(design/shoot/GroupCreateType.dc.html)
import { useState } from "react";
import { useNav } from "../NavContext";
import { GROUP_TYPE_CARD_TO_ENUM } from "@/lib/nav";
import { ClubIcon, CoupleTypeIcon, EtcTypeIcon, FamilyTypeIcon, MarriageTypeIcon, RoommateTypeIcon } from "./typeIcons";

type CardId = "family" | "marriage" | "couple" | "roommate" | "club" | "etc";

const TYPE_ACCENTS: Record<CardId, { accent: string; light: string; label: string; Icon: (p: { color: string }) => React.ReactNode }> = {
  family: { accent: "#279E88", light: "#E8F9F7", label: "가족", Icon: (p) => <FamilyTypeIcon {...p} /> },
  marriage: { accent: "#C24C77", light: "#FFF0F6", label: "부부", Icon: (p) => <MarriageTypeIcon {...p} /> },
  couple: { accent: "#6A5ECF", light: "#F0EEFF", label: "커플", Icon: (p) => <CoupleTypeIcon {...p} /> },
  roommate: { accent: "#2E7AB8", light: "#EBF5FF", label: "룸메이트", Icon: (p) => <RoommateTypeIcon {...p} /> },
  club: { accent: "#8A6A12", light: "#FFFBE8", label: "모임·동아리", Icon: (p) => <ClubIcon {...p} /> },
  etc: { accent: "#2E8B57", light: "#EDFAF3", label: "기타", Icon: (p) => <EtcTypeIcon {...p} /> },
};

export default function GroupCreateType() {
  const nav = useNav();
  const [selected, setSelected] = useState<CardId>("family");

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", padding: "20px 20px 28px", background: "#F6F5FC", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <div style={{ height: 4, flex: 1, borderRadius: 2, background: "#6A5ECF" }} />
        <div style={{ height: 4, flex: 1, borderRadius: 2, background: "#E8E4F4" }} />
        <div style={{ height: 4, flex: 1, borderRadius: 2, background: "#E8E4F4" }} />
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, color: "#2D2A3E" }}>어떤 모임인가요?</div>
      <div style={{ fontSize: 13, color: "#6B6980", marginTop: 5, fontWeight: 600 }}>모임 성격에 맞는 유형을 선택해주세요</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
        {(Object.keys(TYPE_ACCENTS) as CardId[]).map((id) => {
          const t = TYPE_ACCENTS[id];
          const sel = selected === id;
          return (
            <div
              key={id}
              onClick={() => setSelected(id)}
              style={{
                borderRadius: 16,
                padding: "14px 10px",
                background: sel ? t.accent : "#FFFFFF",
                border: `2px solid ${sel ? t.accent : "#E8E4F4"}`,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                boxShadow: sel ? `0 6px 16px ${t.accent}55` : "0 2px 6px rgba(45,42,62,0.06)",
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 10, background: sel ? "rgba(255,255,255,0.22)" : t.light, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {t.Icon({ color: sel ? "#FFFFFF" : t.accent })}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: sel ? "#FFFFFF" : "#2D2A3E" }}>{t.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div
        onClick={() => nav.push({ id: "groupName", groupType: GROUP_TYPE_CARD_TO_ENUM[selected] })}
        style={{ height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer" }}
      >
        다음으로
      </div>
    </div>
  );
}
