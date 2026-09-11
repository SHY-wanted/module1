"use client";
// components/screens/GroupNameCouple.tsx — 3b-3. 그룹 이름 입력 · 커플(design/shoot/GroupNameCouple.dc.html)
import GroupNameBase from "./GroupNameBase";
import { HeartIcon } from "../icons";

export default function GroupNameCouple() {
  return (
    <GroupNameBase
      groupType="COUPLE"
      badgeIcon={<HeartIcon size={13} color="#6A5ECF" />}
      badgeColor="#4B3F94"
      badgeLabel="커플"
      placeholder=""
      chips={["우리 커플", "행복한 커플", "함께 가계부"]}
    />
  );
}
