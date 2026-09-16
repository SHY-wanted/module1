// lib/nav.ts — docs/07-screens.md 「화면 전환 방식」에 정의된 화면 전환 상태 타입.
import type { GroupType } from "./mock";

export type TabId = "home" | "groups" | "expenses" | "mypage";

// 0·1·1b·2·2a — 로그인 전 화면. 07-screens.md 「화면 전환 방식」(3) 로그인 전 화면 전환
// — 2026-09-11 팀 결정: 애니메이션 없이 즉시 전환, 별도 스택 관리 없음.
// passwordResetInput — 2026-09-22 팀 요청(신규) "비밀번호를 잊으셨나요?" 진입. 실제 재설정(새 비밀번호
// 입력)은 이메일로 온 링크를 타고 app/reset-password(SPA 밖의 별도 Next.js 라우트)에서 이뤄진다.
export type AuthScreenId = "splash" | "signupInput" | "signupSuccess" | "loginInput" | "loginSuccess" | "passwordResetInput";

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
  // 10b — 내 정보 변경(닉네임·프로필 사진). 디자인 파일 없음(2026-09-17 팀 요청으로 신규 추가).
  | { id: "myInfoEdit" }
  // 8a·8b — 영수증 촬영·인식 중
  | { id: "receiptCapture" }
  | { id: "receiptProcessing" }
  // 2c "카테고리" 항목 클릭(디자인 파일 없음, 2026-09-19 팀 요청으로 신규) — 7(지출 목록)을
  // 그 카테고리로 미리 필터링해서 재사용한다.
  | { id: "categoryExpenses"; category: string }
  // 월별 목표 설정 — 디자인 파일 없음. 2b(홈) 목표 카드 · 10(마이페이지) "월별 목표 설정" 행에서 진입한다.
  | { id: "monthlyGoalSetting" };

// 3a 화면의 카드 id → schema.sql group_type enum 매핑
export const GROUP_TYPE_CARD_TO_ENUM: Record<string, GroupType> = {
  family: "FAMILY",
  marriage: "MARRIED_COUPLE",
  couple: "COUPLE",
  roommate: "ROOMMATE",
  club: "CLUB",
  etc: "OTHER",
};
