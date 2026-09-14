"use client";
// components/screens/GroupDetail.tsx — 5b. 그룹 상세(피드)(design/shoot/GroupDetail.dc.html)
// GroupList(5a)에서 어떤 그룹 카드를 탭했는지(groupId)를 스택 항목에 담아 그 그룹의 데이터를 조회한다.
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getGroupMembersWithProfile, getGroupFeed } from "@/lib/selectors";
import { GROUP_TYPE_VISUAL } from "@/lib/groupTypeVisual";
import { formatRelativeTime, formatSignedWon, initialOf } from "@/lib/format";
import { getCategoryVisual } from "@/lib/categories";
import { ChevronLeftIcon, ShareIcon, UsersIcon } from "../icons";
import { typeIconFor } from "./groupIcon";

const AVATAR_PALETTE = ["#FFF0F6", "#F0EEFF", "#E8F9F7", "#FFFBE8", "#EBF5FF"];

export default function GroupDetail({ groupId }: { groupId: string }) {
  const nav = useNav();
  const store = useStore();
  const [panelOpen, setPanelOpen] = useState(false);
  const group = store.groups.find((g) => g.id === groupId);
  const members = getGroupMembersWithProfile(store.groupMembers, store.profiles, groupId);
  const feed = getGroupFeed(store.expenses, store.savings, groupId);

  if (!group) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--shoot-text-muted)" }}>
        그룹을 찾을 수 없어요.
      </div>
    );
  }

  const visual = GROUP_TYPE_VISUAL[group.group_type];

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 20px", background: "var(--shoot-surface-alt)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 2026-09-14 팀 결정: 뒤로가기 버튼 추가 — 5a(그룹 목록)로 pop. */}
          <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex", flexShrink: 0 }}>
            <ChevronLeftIcon size={18} color="var(--shoot-text)" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: visual.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {typeIconFor(group.group_type, 22, "#fff")}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: "var(--shoot-text)" }}>{group.name}</div>
              {/* visual.light은 그룹 유형 고유의 고정 파스텛이라 다크모드에서도 안 바뀐다 — visual.ink(고정
                  진한 색) 글자와 짝이 맞아야 하므로, 페이지를 따라 바뀌는 surface 대신 이걸 쓴다. */}
              <span style={{ fontSize: 11, fontWeight: 800, color: visual.ink, background: visual.light, padding: "3px 10px", borderRadius: 10 }}>{visual.label}</span>
            </div>
          </div>
          <div
            onClick={() => setPanelOpen((v) => !v)}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--shoot-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
          >
            <UsersIcon size={18} color="var(--shoot-accent)" />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
        {panelOpen && (
          <>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text-muted)", marginBottom: 10 }}>멤버 목록</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {members.map((m, idx) => {
                const name = m.profile?.name ?? "알 수 없음";
                const isMe = m.user_id === store.currentUserId;
                const roleLabel = isMe ? "나" : m.nickname ?? "멤버";
                return (
                  <div key={m.id} style={{ background: "var(--shoot-surface)", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(45,42,62,0.05)" }}>
                    {/* 아바타 배경(AVATAR_PALETTE)은 다크모드에서도 안 바뀌는 고정 파스텔이라, 글자색도 늘
                        고정된 어두운 색이어야 한다(var(--shoot-text)를 쓰면 다크모드에서 흰 글씨가 되어 안 보인다). */}
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: AVATAR_PALETTE[idx % AVATAR_PALETTE.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#2D2A3E" }}>
                      {initialOf(name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--shoot-text)" }}>{name}</div>
                      <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", fontWeight: 600 }}>{roleLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 18, background: "#F5F3FF", border: "2px dashed rgba(106,94,207,0.35)", borderRadius: 18, padding: 16, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)" }}>초대 코드</div>
                <div
                  onClick={async () => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      await navigator.clipboard.writeText(group.invite_code);
                    }
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 800, color: "#4B3F94", background: "var(--shoot-surface)", padding: "5px 12px", borderRadius: 8, cursor: "pointer" }}
                >
                  <ShareIcon size={12} color="#4B3F94" />
                  공유
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--shoot-text)", letterSpacing: 4, fontFamily: "'Courier New',monospace" }}>{group.invite_code}</div>
            </div>
          </>
        )}

        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text-muted)", marginBottom: 10 }}>지출·저금 피드</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {feed.map((f) => {
            const isSaving = f.kind === "saving";
            const authorName = store.profiles.find((p) => p.id === f.data.user_id)?.name ?? "?";
            const merchant = isSaving ? f.data.title ?? "저금" : f.data.memo ?? "지출";
            const category = isSaving ? "저금" : f.data.category;
            const visualCat = isSaving ? { light: "#E8F9F7", ink: "#1D7A69" } : getCategoryVisual(f.data.category);
            const key = `${f.kind}-${f.data.id}`;
            return (
              <div key={key} style={{ background: "var(--shoot-surface)", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(45,42,62,0.05)" }}>
                {/* visualCat.light도 고정 파스텔이라 글자색은 항상 어두운 고정색이어야 한다. */}
                <div style={{ width: 34, height: 34, borderRadius: 12, background: visualCat.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#2D2A3E", flexShrink: 0 }}>
                  {initialOf(authorName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text)" }}>{merchant}</div>
                  <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", fontWeight: 600 }}>
                    {category} · {formatRelativeTime(f.data.created_at)}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: isSaving ? "#1D7A69" : "#B23B3B" }}>{formatSignedWon(f.data.amount, isSaving)}</div>
              </div>
            );
          })}
          {feed.length === 0 && <div style={{ textAlign: "center", color: "var(--shoot-text-muted)", fontSize: 13, fontWeight: 600, padding: "20px 0" }}>아직 지출·저금 기록이 없어요</div>}
        </div>
      </div>
    </div>
  );
}
