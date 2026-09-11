"use client";
// components/screens/GroupNameMarried.tsx — 3b-2. 그룹 이름 입력 · 부부(design/shoot/GroupNameMarried.dc.html)
import GroupNameBase from "./GroupNameBase";
import { RingIcon } from "../icons";

export default function GroupNameMarried() {
  return (
    <GroupNameBase
      groupType="MARRIED_COUPLE"
      badgeIcon={<RingIcon size={13} color="#C24C77" />}
      badgeColor="#A03A61"
      badgeLabel="부부"
      placeholder="우리 신혼집"
      chips={["우리 신혼집", "부부 살림", "함께 모으기"]}
    />
  );
}
