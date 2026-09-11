"use client";
// components/screens/MyGroupsManage.tsx — 10a. 내 그룹 관리(design/shoot/MyGroupsManage.dc.html)
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getGroupsForUser } from "@/lib/selectors";
import { GROUP_TYPE_VISUAL } from "@/lib/groupTypeVisual";
import { ChevronLeftIcon, LogOutIcon, UsersIcon } from "../icons";
import { typeIconFor } from "./groupIcon";

export default function MyGroupsManage() {
  const nav = useNav();
  const store = useStore();
  const myGroups = getGroupsForUser(store.groups, store.groupMembers, store.currentUserId);
  const [confirmingGroupId, setConfirmingGroupId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleLeaveConfirmed() {
    if (!confirmingGroupId) return;
    const result = store.leaveGroup(confirmingGroupId);
    setConfirmingGroupId(null);
    if (!result.ok && result.reason === "must_delegate") {
      // 05-policy.md P10 — "새 그룹장을 먼저 지정해주세요" 오류.
      setErrorMessage("새 그룹장을 먼저 지정해주세요.");
    }
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="#2D2A3E" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#2D2A3E" }}>내 그룹 관리</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {errorMessage && (
          <div style={{ background: "#FFF2EC", border: "1px solid rgba(245,168,130,0.5)", borderRadius: 14, padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#A15A1E" }}>
            {errorMessage}
          </div>
        )}

        {myGroups.map((g) => {
          const visual = GROUP_TYPE_VISUAL[g.group_type];
          const membership = store.groupMembers.find((m) => m.group_id === g.id && m.user_id === store.currentUserId);
          const isOwner = membership?.role === "OWNER";
          return (
            <div key={g.id} style={{ background: "#fff", borderRadius: 18, border: "1px solid #E8E4F4", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: visual.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {typeIconFor(g.group_type, 18, visual.ink)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#2D2A3E" }}>{g.name}</div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: isOwner ? "#6A5ECF" : "#8B8378",
                      background: isOwner ? "#F0EEFF" : "#F1EEEE",
                      padding: "2px 8px",
                      borderRadius: 8,
                    }}
                  >
                    {isOwner ? "그룹장" : "구성원"}
                  </span>
                </div>
              </div>
              <div style={{ height: 1, background: "#F1EEEE", margin: "4px 0 12px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {isOwner && (
                  // 07-screens.md "10a '그룹장 위임' → 10a-1" — 2026-09-11 팀 결정(신규 화면).
                  <div
                    onClick={() => nav.push({ id: "delegateSelect", groupId: g.id })}
                    style={{ height: 42, borderRadius: 12, background: "#fff", border: "1.5px solid #E8E4F4", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#2D2A3E", cursor: "pointer" }}
                  >
                    <UsersIcon size={15} color="#2D2A3E" />
                    그룹장 위임
                  </div>
                )}
                <div
                  onClick={() => {
                    setErrorMessage(null);
                    setConfirmingGroupId(g.id);
                  }}
                  style={{ height: 42, borderRadius: 12, background: "#fff", border: "1.5px solid #E8B4B4", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#B23B3B", cursor: "pointer" }}
                >
                  <LogOutIcon size={15} color="#B23B3B" />
                  그룹 나가기
                </div>
              </div>
            </div>
          );
        })}
        {myGroups.length === 0 && (
          <div style={{ textAlign: "center", color: "#6B6980", fontSize: 13, fontWeight: 600, padding: "20px 0" }}>아직 속한 그룹이 없어요</div>
        )}
      </div>

      {/* 07-screens.md "10a '그룹 나가기' 확인 절차: 바로 나가지 않고 확인 팝업(모달)을 한 번 띄운다" — 2026-09-11
          팀 결정. 새 스택 화면이 아니라 다이얼로그로 띄운다. */}
      {confirmingGroupId && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(45,42,62,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, zIndex: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 22, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#2D2A3E" }}>정말 나가시겠어요?</div>
            <div style={{ fontSize: 12, color: "#6B6980", marginTop: 8, fontWeight: 600, lineHeight: 1.5 }}>
              그룹원이 혼자뿐이면 그룹과 지출 기록이
              <br />
              함께 삭제돼요
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <div
                onClick={() => setConfirmingGroupId(null)}
                style={{ flex: 1, height: 44, borderRadius: 14, border: "1.5px solid #E8E4F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#2D2A3E", cursor: "pointer" }}
              >
                취소
              </div>
              <div
                onClick={handleLeaveConfirmed}
                style={{ flex: 1, height: 44, borderRadius: 14, background: "#B23B3B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer" }}
              >
                나가기
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
