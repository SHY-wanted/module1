// lib/categories.ts
// design/shoot/ExpenseInput.dc.html · design/shoot/Home.dc.html의 script를 그대로 옮김.
// 이 디자인은 그룹 유형 7종 중 가족(FAMILY)·커플(COUPLE)·기타(그 외 전부) 3종만 다르게 처리한다
// — docs/06-data.md E8 [제안]에 남아있는 알려진 단순화, 그대로 따른다(7종으로 늘리지 않는다).

import type { GroupType } from "./mock";

export interface CategoryDef {
  id: string;
  label: string;
  accent: string;
  light: string;
  ink: string;
  icon: string;
}

export const DEFAULT_CATS: CategoryDef[] = [
  { id: "food", label: "식비", accent: "#F5A882", light: "#FFF2EC", ink: "#A15A1E", icon: "food" },
  { id: "transport", label: "교통", accent: "#89C4F4", light: "#EBF5FF", ink: "#2E7AB8", icon: "transport" },
  { id: "living", label: "생활용품", accent: "#6FC5BA", light: "#E8F9F7", ink: "#1D7A69", icon: "living" },
  { id: "etc", label: "기타", accent: "#F5D485", light: "#FFFBE8", ink: "#8A6A12", icon: "etc" },
];

export const FAMILY_CATS: CategoryDef[] = [
  { id: "food", label: "식비", accent: "#F5A882", light: "#FFF2EC", ink: "#A15A1E", icon: "food" },
  { id: "living", label: "생활용품", accent: "#6FC5BA", light: "#E8F9F7", ink: "#1D7A69", icon: "living" },
  { id: "education", label: "교육비", accent: "#89C4F4", light: "#EBF5FF", ink: "#2E7AB8", icon: "education" },
  { id: "medical", label: "의료비", accent: "#F0A8C0", light: "#FFF0F6", ink: "#C24C77", icon: "medical" },
  { id: "management", label: "관리비", accent: "#C9BFAE", light: "#F3F0E9", ink: "#7A6E52", icon: "management" },
  { id: "telecom", label: "통신비", accent: "#9FD1C7", light: "#EAF7F3", ink: "#1F6F5C", icon: "telecom" },
  { id: "culture", label: "여가문화", accent: "#B8ADEC", light: "#F0EEFF", ink: "#6A5ECF", icon: "culture" },
  { id: "etc", label: "기타", accent: "#F5D485", light: "#FFFBE8", ink: "#8A6A12", icon: "etc" },
];

export const COUPLE_CATS: CategoryDef[] = [
  { id: "date", label: "데이트", accent: "#F0A8C0", light: "#FFF0F6", ink: "#C24C77", icon: "date" },
  { id: "gift", label: "선물", accent: "#B8ADEC", light: "#F0EEFF", ink: "#6A5ECF", icon: "gift" },
  { id: "anniversary", label: "기념일", accent: "#F5D485", light: "#FFFBE8", ink: "#8A6A12", icon: "anniversary" },
  { id: "trip", label: "여행", accent: "#89C4F4", light: "#EBF5FF", ink: "#2E7AB8", icon: "trip" },
  { id: "cafe", label: "카페·식사", accent: "#F5A882", light: "#FFF2EC", ink: "#A15A1E", icon: "cafe" },
  { id: "etc", label: "기타", accent: "#6FC5BA", light: "#E8F9F7", ink: "#1D7A69", icon: "etc" },
];

// 디자인의 groupToCats(shareGroup)는 select의 문자열 값('couple'/'family')을 그대로 키로 썼다.
// 우리는 실제 스키마의 group_type(enum)을 기준으로 판단한다 — FAMILY→FAMILY_CATS, COUPLE→COUPLE_CATS, 나머지 전부(SIBLING·ROOMMATE·MARRIED_COUPLE·CLUB·OTHER·개인)→DEFAULT_CATS.
export function groupToCats(groupType: GroupType | null): CategoryDef[] {
  if (groupType === "FAMILY") return FAMILY_CATS;
  if (groupType === "COUPLE") return COUPLE_CATS;
  return DEFAULT_CATS;
}

// 2c 설정(design/shoot/Settings.dc.html) 카테고리 목록 — 그룹 유형 프리셋(FAMILY_CATS 등)과는 별개로,
// "내 카테고리 관리"용 기본 목록이다. 디자인에 그려진 순서·라벨·색을 그대로 옮겼다.
export const SETTINGS_BASE_CATS: CategoryDef[] = [
  { id: "food", label: "식비", accent: "#F5A882", light: "#FFF2EC", ink: "#A15A1E", icon: "food" },
  { id: "living", label: "생활용품", accent: "#6FC5BA", light: "#E8F9F7", ink: "#1D7A69", icon: "living" },
  { id: "transport", label: "교통", accent: "#89C4F4", light: "#EBF5FF", ink: "#2E7AB8", icon: "transport" },
  { id: "hobby", label: "취미", accent: "#B8ADEC", light: "#F0EEFF", ink: "#6A5ECF", icon: "hobby" },
  { id: "clothing", label: "의류", accent: "#F0A8C0", light: "#FFF0F6", ink: "#C24C77", icon: "clothing" },
  { id: "etc", label: "기타", accent: "#F5D485", light: "#FFFBE8", ink: "#8A6A12", icon: "etc" },
];

const ALL_KNOWN_CATS: CategoryDef[] = [...DEFAULT_CATS, ...FAMILY_CATS, ...COUPLE_CATS, ...SETTINGS_BASE_CATS];

// ExpenseList(7)·Home(2b)에서 category 텍스트만으로 아이콘·색을 되찾기 위한 조회 헬퍼.
// "확인 필요"는 프리셋에 없는 특수 값이라 별도 처리한다(05-policy.md P7).
export function getCategoryVisual(label: string): { accent: string; light: string; ink: string; icon: string } {
  if (label === "확인 필요") {
    return { accent: "#F5A882", light: "#FFF2EC", ink: "#A15A1E", icon: "etc" };
  }
  const found = ALL_KNOWN_CATS.find((c) => c.label === label);
  if (found) return found;
  return { accent: "#C9C4D6", light: "#F1EFEC", ink: "#5B5568", icon: "etc" };
}

// 2c 설정 "새 카테고리 추가" — 팀 결정(2026-09-11)으로 그룹별이 아니라 전역 배열로 간단하게 둔다.
// 이 배열 자체는 lib/store.tsx의 customCategories(React 상태)가 들고 있다 — 정적 상수인 SETTINGS_BASE_CATS와
// 달리 사용자가 런타임에 추가하므로 반응형 상태가 필요하기 때문이다. 여기서는 새 항목을 만드는 헬퍼만 둔다.
export function makeCustomCategory(label: string): CategoryDef {
  const id = `custom-${label}-${Date.now().toString(36)}`;
  return { id, label, accent: "#C9C4D6", light: "#F1EFEC", ink: "#5B5568", icon: "etc" };
}
