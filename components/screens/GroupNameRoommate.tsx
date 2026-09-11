"use client";
// components/screens/GroupNameRoommate.tsx — 3b-4. 그룹 이름 입력 · 룸메이트(design/shoot/GroupNameRoommate.dc.html)
import GroupNameBase from "./GroupNameBase";
import { HomeIcon } from "../icons";

export default function GroupNameRoommate() {
  return (
    <GroupNameBase
      groupType="ROOMMATE"
      badgeIcon={<HomeIcon size={13} color="#2E7AB8" />}
      badgeColor="#26689C"
      badgeLabel="룸메이트"
      placeholder="전세 405호"
      chips={["전세 405호", "우리 자취방", "생활비 정산"]}
    />
  );
}
