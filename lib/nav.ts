// lib/nav.ts — docs/07-screens.md 「화면 전환 방식」에 정의된 화면 전환 상태 타입.
import type { GroupType } from "./mock";

export type TabId = "home" | "groups" | "expenses" | "mypage";

// 0·1·1b·2·2a — 로그인 전 화면. 07-screens.md 「화면 전환 방식」(3) 로그인 전 화면 전환
// — 2026-09-11 팀 결정: 애니메이션 없이 즉시 전환, 별도 스택 관리 없음.
export type AuthScreenId = "splash" | "signupInput" | "signupSuccess" | "loginInput" | "loginSuccess";

// (2) 화면 쌓기 대상 — 07-screens.md 「화면ID별 분류」
export type StackScreen =
  | { id: "groupCreateType" }
  | { id: "groupName"; groupType: GroupType }
  | { id: "groupCreateDone"; groupId: string }
  | { id: "groupJoin" }
  | { id: "groupDetail"; groupId: string }
  // expenseId가 있으면 6(지출 입력)을 수정 모드로 재사용한다(07-screens.md 7 "다음 화면(액션)" 참고).
  | { id: "expenseInput"; expenseId?: string }
  // 2b-1a·2b-1 — 수입 내역·입력(2026-09-11 팀 결정으로 이번 범위 포함)
  | { id: "incomeList" }
  | { id: "incomeEdit" }
  // 2c — 설정
  | { id: "settings" }
  // 10a·10a-1 — 내 그룹 관리·위임 대상 선택
  | { id: "myGroupsManage" }
  | { id: "delegateSelect"; groupId: string }
  // 8a·8b — 영수증 촬영·인식 중
  | { id: "receiptCapture" }
  | { id: "receiptProcessing" };

// 3a 화면의 카드 id → schema.sql group_type enum 매핑
export const GROUP_TYPE_CARD_TO_ENUM: Record<string, GroupType> = {
  family: "FAMILY",
  marriage: "MARRIED_COUPLE",
  couple: "COUPLE",
  roommate: "ROOMMATE",
  club: "CLUB",
  etc: "OTHER",
};
