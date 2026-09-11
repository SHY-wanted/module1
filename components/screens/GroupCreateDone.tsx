"use client";
// components/screens/GroupCreateDone.tsx — 3c. 그룹 생성 완료(design/shoot/GroupCreateDone.dc.html)
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { CheckIcon, ShareIcon } from "../icons";

export default function GroupCreateDone({ groupId }: { groupId: string }) {
  const nav = useNav();
  const store = useStore();
  const [shared, setShared] = useState(false);
  const group = store.groups.find((g) => g.id === groupId);

  async function handleShare() {
    if (!group) return;
    const text = `[ShooT] "${group.name}" 그룹 초대 코드: ${group.invite_code}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // 사용자가 공유를 취소한 경우 등 — 조용히 무시
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(group.invite_code);
      setShared(true);
      window.setTimeout(() => setShared(false), 1500);
    }
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", padding: "20px 24px 28px", background: "#F6F5FC", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", overflowY: "auto" }}>
      <div style={{ display: "flex", gap: 6, width: "100%", marginBottom: 8 }}>
        <div style={{ height: 4, flex: 1, borderRadius: 2, background: "#6A5ECF" }} />
        <div style={{ height: 4, flex: 1, borderRadius: 2, background: "#6A5ECF" }} />
        <div style={{ height: 4, flex: 1, borderRadius: 2, background: "#6A5ECF" }} />
      </div>
      <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#F0EEFF", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 22 }}>
        <CheckIcon size={32} color="#6A5ECF" strokeWidth={2.4} />
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, color: "#2D2A3E", marginTop: 18 }}>그룹이 만들어졌어요!</div>
      <div style={{ fontSize: 13, color: "#6B6980", marginTop: 6, fontWeight: 600 }}>&quot;{group?.name ?? ""}&quot;을(를) 시작해볼까요?</div>
      <div style={{ marginTop: 24, width: "100%", background: "#F5F3FF", border: "2px dashed rgba(106,94,207,0.35)", borderRadius: 18, padding: 20 }}>
        <div style={{ fontSize: 12, color: "#6B6980", fontWeight: 700 }}>초대 코드</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#2D2A3E", letterSpacing: 5, marginTop: 8, fontFamily: "'Courier New',monospace" }}>{group?.invite_code ?? ""}</div>
        <div style={{ fontSize: 11, color: "#6B6980", marginTop: 8, lineHeight: 1.5 }}>이 코드를 공유해서 멤버를 초대하세요</div>
      </div>
      <div
        onClick={handleShare}
        style={{ width: "100%", height: 48, borderRadius: 16, background: "#F0EEFF", border: "2px solid rgba(106,94,207,0.4)", color: "#6A5ECF", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 800, marginTop: 14, cursor: "pointer" }}
      >
        <ShareIcon size={15} color="#6A5ECF" />
        {shared ? "복사했어요!" : "초대 코드 공유하기"}
      </div>
      <div style={{ flex: 1 }} />
      <div
        onClick={() => nav.resetStackToHome()}
        style={{ width: "100%", height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer" }}
      >
        홈으로 가기
      </div>
    </div>
  );
}
