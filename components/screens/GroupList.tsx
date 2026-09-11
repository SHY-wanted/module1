"use client";
// components/screens/GroupList.tsx — 5a. 그룹 목록(design/shoot/GroupList.dc.html) — 탭(홈 탭과 동급, 계속 마운트됨)
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getGroupsForUser, getMemberCount } from "@/lib/selectors";
import { GROUP_TYPE_VISUAL } from "@/lib/groupTypeVisual";
import { ChevronRightIcon, UsersIcon } from "../icons";
import { typeIconFor } from "./groupIcon";

export default function GroupList() {
  const nav = useNav();
  const store = useStore();
  const myGroups = getGroupsForUser(store.groups, store.groupMembers, store.currentUserId);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 20px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#2D2A3E" }}>내 그룹</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          {myGroups.map((g) => {
            const visual = GROUP_TYPE_VISUAL[g.group_type];
            const memberCount = getMemberCount(store.groupMembers, g.id);
            return (
              <div
                key={g.id}
                onClick={() => nav.push({ id: "groupDetail", groupId: g.id })}
                style={{ background: "#fff", borderRadius: 18, padding: 14, display: "flex", alignItems: "center", gap: 12, border: "2px solid #E8E4F4", boxShadow: "0 2px 10px rgba(45,42,62,0.05)", cursor: "pointer" }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 14, background: visual.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {typeIconFor(g.group_type, 20, "#fff")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#2D2A3E" }}>{g.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: visual.ink, background: visual.light, padding: "2px 8px", borderRadius: 8 }}>{visual.label}</span>
                    <span style={{ fontSize: 12, color: "#6B6980", fontWeight: 600 }}>멤버 {memberCount}명</span>
                  </div>
                </div>
                <ChevronRightIcon size={16} color="#6B6980" />
              </div>
            );
          })}
        </div>
        <div
          onClick={() => nav.push({ id: "groupJoin" })}
          style={{ marginTop: 16, border: "2px dashed rgba(106,94,207,0.4)", borderRadius: 18, padding: 14, fontSize: 13, fontWeight: 800, color: "#2D2A3E", background: "#F0EEFF", textAlign: "center", cursor: "pointer" }}
        >
          초대 코드로 참여하기
        </div>
        {myGroups.length === 0 && (
          <div style={{ marginTop: 24, textAlign: "center", color: "#6B6980", fontSize: 13, fontWeight: 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <UsersIcon size={28} color="#A9A2B8" />
            아직 속한 그룹이 없어요
          </div>
        )}
      </div>
    </div>
  );
}
