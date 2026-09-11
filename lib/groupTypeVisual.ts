// lib/groupTypeVisual.ts — GroupList(5a)·GroupDetail(5b) 카드에서 쓰는 그룹 유형별 배지·아이콘 색.
// design/shoot/GroupCreateType.dc.html TYPE_ACCENTS·GroupList.dc.html 카드 색을 그대로 따른다.
import type { GroupType } from "./mock";

export interface GroupTypeVisual {
  label: string;
  accent: string;
  light: string;
  ink: string;
}

export const GROUP_TYPE_VISUAL: Record<GroupType, GroupTypeVisual> = {
  FAMILY: { label: "가족", accent: "#279E88", light: "#E8F9F7", ink: "#1D7A69" },
  MARRIED_COUPLE: { label: "부부", accent: "#C24C77", light: "#FFF0F6", ink: "#A03A61" },
  COUPLE: { label: "커플", accent: "#6A5ECF", light: "#F0EEFF", ink: "#4B3F94" },
  ROOMMATE: { label: "룸메이트", accent: "#2E7AB8", light: "#EBF5FF", ink: "#26689C" },
  CLUB: { label: "모임·동아리", accent: "#8A6A12", light: "#FFFBE8", ink: "#6E540E" },
  OTHER: { label: "기타", accent: "#2E8B57", light: "#EDFAF3", ink: "#247146" },
  // 06-data.md E2 [?]: 3a 화면엔 "형제자매" 카드가 없어 새로 만들 수는 없지만, enum엔 있으므로
  // 스위치문 완전성을 위해 중립색으로만 정의해 둔다(실제로 이 유형의 그룹은 생성되지 않는다).
  SIBLING: { label: "형제자매", accent: "#8B8378", light: "#F3F0E9", ink: "#5B5568" },
};
