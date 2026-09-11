"use client";
// components/TabBar.tsx — 홈·그룹·지출내역·마이페이지 4탭 + 중앙 카메라 아이콘.
// docs/07-screens.md: 화면 쌓기 중엔 하단 탭이 보이지 않는다 — AppShell이 stack이 비었을 때만 이 컴포넌트를 렌더링한다.
import type { TabId } from "@/lib/nav";
import { useNav } from "./NavContext";
import { CameraIcon, HomeIcon, ListIcon, UserCircleIcon, UsersIcon } from "./icons";

const ACTIVE = "#6A5ECF";
const INACTIVE = "#A9A2B8";

function TabButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: (color: string) => React.ReactNode;
}) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      {icon(color)}
      <div style={{ fontSize: 10, fontWeight: 700, color }}>{label}</div>
    </button>
  );
}

export default function TabBar({
  activeTab,
  onChange,
}: {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}) {
  const nav = useNav();
  return (
    <div
      style={{
        flexShrink: 0,
        padding: "10px 12px 20px",
        background: "#fff",
        borderTop: "1px solid #ECE9E3",
        display: "flex",
        alignItems: "center",
      }}
    >
      <TabButton label="홈" active={activeTab === "home"} onClick={() => onChange("home")} icon={(c) => <HomeIcon size={19} color={c} />} />
      <TabButton label="그룹" active={activeTab === "groups"} onClick={() => onChange("groups")} icon={(c) => <UsersIcon size={19} color={c} />} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <button
          // 07-screens.md "하단 탭 내비게이션" (2026-09-11 팀 결정): 중앙 카메라 아이콘 → 8a(영수증 촬영).
          onClick={() => nav.push({ id: "receiptCapture" })}
          aria-label="영수증 촬영"
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#8C81E0 0%,#6A5ECF 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
          }}
        >
          <CameraIcon size={17} color="#fff" />
        </button>
      </div>
      <TabButton label="지출내역" active={activeTab === "expenses"} onClick={() => onChange("expenses")} icon={(c) => <ListIcon size={19} color={c} />} />
      <TabButton label="마이페이지" active={activeTab === "mypage"} onClick={() => onChange("mypage")} icon={(c) => <UserCircleIcon size={19} color={c} />} />
    </div>
  );
}
