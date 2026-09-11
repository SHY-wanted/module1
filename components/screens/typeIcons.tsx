// components/screens/typeIcons.tsx — 3a/3b-x에서 쓰는 그룹 유형 아이콘(고정 size=17) 얇은 래퍼.
import { FlagIcon, HeartIcon, HomeIcon, RingIcon, SparkleIcon, UsersIcon } from "../icons";

export function FamilyTypeIcon({ color }: { color: string }) {
  return <UsersIcon size={17} color={color} />;
}
export function MarriageTypeIcon({ color }: { color: string }) {
  return <RingIcon size={17} color={color} />;
}
export function CoupleTypeIcon({ color }: { color: string }) {
  return <HeartIcon size={17} color={color} />;
}
export function RoommateTypeIcon({ color }: { color: string }) {
  return <HomeIcon size={17} color={color} />;
}
export function ClubIcon({ color }: { color: string }) {
  return <FlagIcon size={17} color={color} />;
}
export function EtcTypeIcon({ color }: { color: string }) {
  return <SparkleIcon size={17} color={color} />;
}
