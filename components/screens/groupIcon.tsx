// components/screens/groupIcon.tsx — GroupList(5a)·GroupDetail(5b) 카드 아이콘을 group_type으로 고른다.
import type { GroupType } from "@/lib/mock";
import { FlagIcon, HeartIcon, HomeIcon, RingIcon, SparkleIcon, UsersIcon } from "../icons";

export function typeIconFor(groupType: GroupType, size: number, color: string) {
  switch (groupType) {
    case "FAMILY":
    case "SIBLING":
      return <UsersIcon size={size} color={color} />;
    case "MARRIED_COUPLE":
      return <RingIcon size={size} color={color} />;
    case "COUPLE":
      return <HeartIcon size={size} color={color} />;
    case "ROOMMATE":
      return <HomeIcon size={size} color={color} />;
    case "CLUB":
      return <FlagIcon size={size} color={color} />;
    case "OTHER":
    default:
      return <SparkleIcon size={size} color={color} />;
  }
}
