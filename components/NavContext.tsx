"use client";
// components/NavContext.tsx — 화면 전환 액션을 하위 화면 컴포넌트에 내려주는 Context.
import { createContext, useContext } from "react";
import type { AuthScreenId, StackScreen, TabId } from "@/lib/nav";

export interface NavValue {
  activeTab: TabId;
  switchTab: (tab: TabId) => void;
  push: (screen: StackScreen) => void;
  back: () => void;
  resetStackToHome: () => void;
  // 스택을 전부 비우고 임의의 탭으로 이동 — 8b(영수증 인식 완료)가 8a·8b 두 겹을 한 번에 pop하고
  // 지출내역 탭(7)으로 이동할 때 쓴다(resetStackToHome의 일반화 버전).
  resetStackToTab: (tab: TabId) => void;
  authScreen: AuthScreenId | null;
  goAuthScreen: (id: AuthScreenId) => void;
  enterApp: () => void;
  logout: () => void;
}

export const NavContext = createContext<NavValue | null>(null);

export function useNav(): NavValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav는 AppShell 안에서만 쓸 수 있다");
  return ctx;
}
