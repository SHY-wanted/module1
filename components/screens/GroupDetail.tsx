"use client";
// components/screens/GroupDetail.tsx — 5b. 그룹 상세(피드)(design/shoot/GroupDetail.dc.html)
// GroupList(5a)에서 어떤 그룹 카드를 탭했는지(groupId)를 스택 항목에 담아 그 그룹의 데이터를 조회한다.
import { useState } from "react";
import { useStore } from "@/lib/store";
import { getGroupMembersWithProfile, getGroupFeed } from "@/lib/selectors";
import { GROUP_TYPE_VISUAL } from "@/lib/groupTypeVisual";
import { formatRelativeTime, formatSignedWon, initialOf } from "@/lib/format";
import { getCategoryVisual } from "@/lib/categories";
import { ShareIcon, UsersIcon } from "../icons";
import { typeIconFor } from "./groupIcon";

const AVATAR_PALETTE = ["#FFF0F6", "#F0EEFF", "#E8F9F7", "#FFFBE8", "#EBF5FF"];

export default function GroupDetail({ groupId }: { groupId: string }) {
  const store = useStore();
  const [panelOpen, setPanelOpen] = useState(false);
  const group = store.groups.find((g) => g.id === groupId);
  const members = getGroupMembersWithProfile(store.groupMembers, store.profiles, groupId);
  const feed = getGroupFeed(store.expenses, store.savings, groupId);

  if (!group) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B6980" }}>
        그룹을 찾을 수 없어요.
      </div>
    );
  }

  const visual = GROUP_TYPE_VISUAL[group.group_type];

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 20px", background: "#F0EEFF", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: visual.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {typeIconFor(group.group_type, 22, "#fff")}
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#2D2A3E" }}>{group.name}</div>
              <span style={{ fontSize: 11, fontWeight: 800, color: visual.ink, background: "#fff", padding: "3px 10px", borderRadius: 10 }}>{visual.label}</span>
            </div>
          </div>
          <div
            onClick={() => setPanelOpen((v) => !v)}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
          >
            <UsersIcon size={18} color="#6A5ECF" />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
        {panelOpen && (
          <>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#6B6980", marginBottom: 10 }}>멤버 목록</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {members.map((m, idx) => {
                const name = m.profile?.name ?? "알 수 없음";
                const isMe = m.user_id === store.currentUserId;
                const roleLabel = isMe ? "나" : m.nickname ?? "멤버";
                return (
                  <div key={m.id} style={{ background: "#fff", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(45,42,62,0.05)" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: AVATAR_PALETTE[idx % AVATAR_PALETTE.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#2D2A3E" }}>
                      {initialOf(name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#2D2A3E" }}>{name}</div>
                      <div style={{ fontSize: 12, color: "#6B6980", fontWeight: 600 }}>{roleLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 18, background: "#F5F3FF", border: "2px dashed rgba(106,94,207,0.35)", borderRadius: 18, padding: 16, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6980" }}>초대 코드</div>
                <div
                  onClick={async () => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      await navigator.clipboard.writeText(group.invite_code);
                    }
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 800, color: "#4B3F94", background: "#fff", padding: "5px 12px", borderRadius: 8, cursor: "pointer" }}
                >
                  <ShareIcon size={12} color="#4B3F94" />
                  공유
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#2D2A3E", letterSpacing: 4, fontFamily: "'Courier New',monospace" }}>{group.invite_code}</div>
            </div>
          </>
        )}

        <div style={{ fontSize: 13, fontWeight: 800, color: "#6B6980", marginBottom: 10 }}>지출·저금 피드</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {feed.map((f) => {
            const isSaving = f.kind === "saving";
            const authorName = store.profiles.find((p) => p.id === f.data.user_id)?.name ?? "?";
            const merchant = isSaving ? f.data.title ?? "저금" : f.data.memo ?? "지출";
            const category = isSaving ? "저금" : f.data.category;
            const visualCat = isSaving ? { light: "#E8F9F7", ink: "#1D7A69" } : getCategoryVisual(f.data.category);
            const key = `${f.kind}-${f.data.id}`;
            return (
              <div key={key} style={{ background: "#fff", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(45,42,62,0.05)" }}>
                <div style={{ width: 34, height: 34, borderRadius: 12, background: visualCat.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#2D2A3E", flexShrink: 0 }}>
                  {initialOf(authorName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#2D2A3E" }}>{merchant}</div>
                  <div style={{ fontSize: 11, color: "#6B6980", fontWeight: 600 }}>
                    {category} · {formatRelativeTime(f.data.created_at)}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: isSaving ? "#1D7A69" : "#B23B3B" }}>{formatSignedWon(f.data.amount, isSaving)}</div>
              </div>
            );
          })}
          {feed.length === 0 && <div style={{ textAlign: "center", color: "#6B6980", fontSize: 13, fontWeight: 600, padding: "20px 0" }}>아직 지출·저금 기록이 없어요</div>}
        </div>
      </div>
    </div>
  );
}
