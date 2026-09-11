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
  const members = getGroupMembersWithProfile(store.groupMembers, store.profiles, groupId).filter(
    (m) => m.user_id !== store.currentUserId
  );

  function handleSelect(userId: string) {
    // F18 · P10 상태값1: 나(OWNER) 대신 선택한 멤버를 새 그룹장으로 바꾼다.
    store.delegateOwner(groupId, userId);
    // 10a "그룹장 위임" → 10a-1에서 선택 → 위임 실행 후 10a로 복귀(2026-09-11 팀 결정).
    nav.back();
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="#2D2A3E" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#2D2A3E" }}>그룹장 위임</div>
          {group && <div style={{ fontSize: 12, color: "#6B6980", fontWeight: 600, marginTop: 2 }}>&quot;{group.name}&quot;의 새 그룹장을 골라주세요</div>}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {members.map((m, idx) => {
            const name = m.profile?.name ?? "알 수 없음";
            return (
              <div
                key={m.id}
                onClick={() => handleSelect(m.user_id)}
                style={{ background: "#fff", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(45,42,62,0.05)", cursor: "pointer" }}
              >
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: AVATAR_PALETTE[idx % AVATAR_PALETTE.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#2D2A3E" }}>
                  {initialOf(name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#2D2A3E" }}>{name}</div>
                  <div style={{ fontSize: 12, color: "#6B6980", fontWeight: 600 }}>{m.nickname ?? "멤버"}</div>
                </div>
                <ChevronRightIcon size={16} color="#A9A2B8" />
              </div>
            );
          })}
          {members.length === 0 && (
            <div style={{ textAlign: "center", color: "#6B6980", fontSize: 13, fontWeight: 600, padding: "20px 0" }}>위임할 그룹원이 없어요</div>
          )}
        </div>
      </div>
    </div>
  );
}
