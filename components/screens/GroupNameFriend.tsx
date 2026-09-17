"use client";
// components/screens/GroupNameFriend.tsx — 3b-4. 그룹 이름 입력 · 친구(design/shoot/GroupNameRoommate.dc.html)
// 2026-09-20 사용자 요청으로 유형 자체를 "룸메이트"→"친구"로 바꿨다(디자인 파일명은 그대로 남아있다).
import GroupNameBase from "./GroupNameBase";
import { SmileIcon } from "../icons";

export default function GroupNameFriend() {
  return (
    <GroupNameBase
      groupType="FRIEND"
      badgeIcon={<SmileIcon size={13} color="#2E7AB8" />}
      badgeColor="#26689C"
      badgeLabel="친구"
      placeholder="우리 넷이서"
      chips={["우리 넷이서", "불금 모임", "여행 경비"]}
    />
  );
}
