"use client";
// components/screens/GroupNameClub.tsx — 3b-5. 그룹 이름 입력 · 모임·동아리(design/shoot/GroupNameClub.dc.html)
import GroupNameBase from "./GroupNameBase";
import { FlagIcon } from "../icons";

export default function GroupNameClub() {
  return (
    <GroupNameBase
      groupType="CLUB"
      badgeIcon={<FlagIcon size={13} color="#8A6A12" />}
      badgeColor="#6E540E"
      badgeLabel="모임·동아리"
      placeholder="주말 등산 모임"
      chips={["주말 등산 모임", "우리 동아리", "회비 장부"]}
    />
  );
}
