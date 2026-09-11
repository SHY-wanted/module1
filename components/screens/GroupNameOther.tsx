"use client";
// components/screens/GroupNameOther.tsx — 3b-6. 그룹 이름 입력 · 기타(design/shoot/GroupNameOther.dc.html)
import GroupNameBase from "./GroupNameBase";
import { SparkleIcon } from "../icons";

export default function GroupNameOther() {
  return (
    <GroupNameBase
      groupType="OTHER"
      badgeIcon={<SparkleIcon size={13} color="#2E8B57" />}
      badgeColor="#247146"
      badgeLabel="기타"
      placeholder="우리끼리"
      chips={["우리끼리", "같이 쓰는 지갑", "공동 지출"]}
    />
  );
}
