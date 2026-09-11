"use client";
// components/StackLayer.tsx — (2) 화면 쌓기 레이어. 세로 슬라이드 애니메이션은 app/globals.css의
// .shoot-stack-item[data-phase] 클래스가 담당하고, 이 컴포넌트는 phase만 관리해 넘긴다.
import type { StackScreen } from "@/lib/nav";
import GroupCreateType from "./screens/GroupCreateType";
import GroupNameFamily from "./screens/GroupNameFamily";
import GroupNameMarried from "./screens/GroupNameMarried";
import GroupNameCouple from "./screens/GroupNameCouple";
import GroupNameRoommate from "./screens/GroupNameRoommate";
import GroupNameClub from "./screens/GroupNameClub";
import GroupNameOther from "./screens/GroupNameOther";
import GroupCreateDone from "./screens/GroupCreateDone";
import GroupJoin from "./screens/GroupJoin";
import GroupDetail from "./screens/GroupDetail";
import ExpenseInput from "./screens/ExpenseInput";
import IncomeList from "./screens/IncomeList";
import IncomeEdit from "./screens/IncomeEdit";
import Settings from "./screens/Settings";
import MyGroupsManage from "./screens/MyGroupsManage";
import DelegateSelect from "./screens/DelegateSelect";
import ReceiptCapture from "./screens/ReceiptCapture";
import ReceiptProcessing from "./screens/ReceiptProcessing";

export type StackPhase = "entering" | "settled" | "leaving";

export interface RenderItem {
  screen: StackScreen;
  key: string;
  phase: StackPhase;
}

function renderScreen(screen: StackScreen) {
  switch (screen.id) {
    case "groupCreateType":
      return <GroupCreateType />;
    case "groupName":
      switch (screen.groupType) {
        case "FAMILY":
          return <GroupNameFamily />;
        case "MARRIED_COUPLE":
          return <GroupNameMarried />;
        case "COUPLE":
          return <GroupNameCouple />;
        case "ROOMMATE":
          return <GroupNameRoommate />;
        case "CLUB":
          return <GroupNameClub />;
        default:
          // SIBLING·OTHER — 06-data.md E2 [?]: 디자인 3a엔 "형제자매" 카드가 없어 만들지 않았다.
          return <GroupNameOther />;
      }
    case "groupCreateDone":
      return <GroupCreateDone groupId={screen.groupId} />;
    case "groupJoin":
      return <GroupJoin />;
    case "groupDetail":
      return <GroupDetail groupId={screen.groupId} />;
    case "expenseInput":
      return <ExpenseInput expenseId={screen.expenseId} />;
    case "incomeList":
      return <IncomeList />;
    case "incomeEdit":
      return <IncomeEdit />;
    case "settings":
      return <Settings />;
    case "myGroupsManage":
      return <MyGroupsManage />;
    case "delegateSelect":
      return <DelegateSelect groupId={screen.groupId} />;
    case "receiptCapture":
      return <ReceiptCapture />;
    case "receiptProcessing":
      return <ReceiptProcessing />;
    default:
      return null;
  }
}

export default function StackLayer({ items }: { items: RenderItem[] }) {
  return (
    <>
      {items.map((item, idx) => (
        <div key={item.key} className="shoot-stack-item" data-phase={item.phase} style={{ zIndex: 10 + idx }}>
          {renderScreen(item.screen)}
        </div>
      ))}
    </>
  );
}
