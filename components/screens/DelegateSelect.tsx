"use client";
// components/screens/DelegateSelect.tsx — 10a-1. 위임 대상 선택(디자인 파일 없음, 07-screens.md 2026-09-11 팀
// 결정으로 신규 추가). 디자인이 없어 이 앱 안에서 이미 쓰는 멤버 목록 UI(GroupDetail 5b의 멤버 목록 패널)와
// 같은 스타일로 "그룹원 목록에서 한 명 선택"하는 화면을 새로 만들었다.
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getGroupMembersWithProfile } from "@/lib/selectors";
import { initialOf } from "@/lib/format";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

const AVATAR_PALETTE = ["#FFF0F6", "#F0EEFF", "#E8F9F7", "#FFFBE8", "#EBF5FF"];

export default function DelegateSelect({ groupId }: { groupId: string }) {
  const nav = useNav();
  const store = useStore();
  const group = store.groups.find((g) => g.id === groupId);
  // 2026-09-17 팀 결정: 본인도 목록에 그대로 보여주되 "본인"이라고 표시하고 고를 수는 없게 한다
  // (이전엔 본인을 아예 목록에서 뺐는데, 위임 화면 안에서 "이게 나다"가 안 보였다).
  const members = getGroupMembersWithProfile(store.groupMembers, store.profiles, groupId);

  function handleSelect(userId: string) {
    // F18 · P10 상태값1: 나(OWNER) 대신 선택한 멤버를 새 그룹장으로 바꾼다.
    store.delegateOwner(groupId, userId);
    // 10a "그룹장 위임" → 10a-1에서 선택 → 위임 실행 후 10a로 복귀(2026-09-11 팀 결정).
    nav.back();
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)" }}>그룹장 위임</div>
          {group && <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", fontWeight: 600, marginTop: 2 }}>&quot;{group.name}&quot;의 새 그룹장을 골라주세요</div>}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {members.map((m, idx) => {
            const name = m.profile?.name ?? "알 수 없음";
            const isMe = m.user_id === store.currentUserId;
            return (
              <div
                key={m.id}
                onClick={isMe ? undefined : () => handleSelect(m.user_id)}
                style={{
                  background: "var(--shoot-surface)",
                  borderRadius: 16,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 2px 8px rgba(45,42,62,0.05)",
                  cursor: isMe ? "default" : "pointer",
                  opacity: isMe ? 0.6 : 1,
                }}
              >
                {/* 아바타 배경(AVATAR_PALETTE)은 다크모드에서도 안 바뀌는 고정 파스텔이라, 글자색도 늘 고정된
                    어두운 색이어야 한다(var(--shoot-text)를 쓰면 다크모드에서 흰 글씨가 되어 안 보인다). */}
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: AVATAR_PALETTE[idx % AVATAR_PALETTE.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#2D2A3E" }}>
                  {initialOf(name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--shoot-text)" }}>{name}</div>
                  {/* 2026-09-17 팀 결정: 본인 행은 "본인"이라고 표시하고 고를 수 없게 한다. */}
                  <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", fontWeight: 600 }}>{isMe ? "본인" : m.nickname ?? "멤버"}</div>
                </div>
                {!isMe && <ChevronRightIcon size={16} color="#A9A2B8" />}
              </div>
            );
          })}
          {members.length <= 1 && (
            <div style={{ textAlign: "center", color: "var(--shoot-text-muted)", fontSize: 13, fontWeight: 600, padding: "20px 0" }}>위임할 그룹원이 없어요</div>
          )}
        </div>
      </div>
    </div>
  );
}
