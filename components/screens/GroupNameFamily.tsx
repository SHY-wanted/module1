"use client";
// components/screens/GroupNameFamily.tsx — 3b-1. 그룹 이름 입력 · 가족(design/shoot/GroupNameFamily.dc.html)
import GroupNameBase from "./GroupNameBase";
import { UsersIcon } from "../icons";

export default function GroupNameFamily() {
  return (
    <GroupNameBase
      groupType="FAMILY"
      badgeIcon={<UsersIcon size={13} color="#279E88" />}
      badgeColor="#146356"
      badgeLabel="가족"
      placeholder="행복한 우리집"
      chips={["행복한 우리집", "우리 가족", "가족 가계부"]}
    />
  );
}
