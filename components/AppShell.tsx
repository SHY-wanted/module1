"use client";
// components/AppShell.tsx — 화면 23개(이번 범위 16개) 전체를 상태로 들고 전환하는 단일 셸.
// docs/07-screens.md 「화면 전환 방식」: 탭 전환(크로스페이드) vs 화면 쌓기(세로 슬라이드) 두 종류.
import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthScreenId, StackScreen, TabId } from "@/lib/nav";
import { NavContext, type NavValue } from "./NavContext";
import TabBar from "./TabBar";
import StackLayer, { type RenderItem } from "./StackLayer";

import Main from "./screens/Main";
import SignupInput from "./screens/SignupInput";
import SignupSuccess from "./screens/SignupSuccess";
import LoginInput from "./screens/LoginInput";
import LoginSuccess from "./screens/LoginSuccess";
import Home from "./screens/Home";
import GroupList from "./screens/GroupList";
import ExpenseListTab from "./screens/ExpenseListTab";
import MyPage from "./screens/MyPage";

interface HistoryState {
  stack: StackScreen[];
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const STACK_ANIMATION_MS = 280;

export default function AppShell() {
  // 0·1·1b·2·2a — 07-screens.md 「화면 전환 방식」(3) 로그인 전 화면 전환: 애니메이션 없이 즉시 상태 전환
  // (2026-09-11 팀 결정, 별도 스택 관리 없음).
  const [authScreen, setAuthScreen] = useState<AuthScreenId | null>("splash");
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [renderItems, setRenderItems] = useState<RenderItem[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const renderItemsRef = useRef<RenderItem[]>([]);
  useEffect(() => {
    renderItemsRef.current = renderItems;
  }, [renderItems]);

  const keyCounter = useRef(0);
  const suppressNextPopRef = useRef(false);

  const push = useCallback((screen: StackScreen) => {
    const key = `s${++keyCounter.current}`;
    const current = renderItemsRef.current.filter((it) => it.phase !== "leaving");
    const newStack = [...current.map((it) => it.screen), screen];
    window.history.pushState({ stack: newStack } satisfies HistoryState, "");
    const instant = prefersReducedMotion();
    setRenderItems((items) => [
      ...items.filter((it) => it.phase !== "leaving"),
      { screen, key, phase: instant ? "settled" : "entering" },
    ]);
    if (!instant) {
      setIsTransitioning(true);
      // 마운트 직후 시작 상태(translateY 100%)가 브라우저에 반영된 다음 프레임에 목표 상태로 바꿔야
      // transition이 실제로 재생된다 — 더블 rAF로 한 프레임 확실히 넘긴다.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setRenderItems((items) => items.map((it) => (it.key === key ? { ...it, phase: "settled" } : it)));
        });
      });
      window.setTimeout(() => setIsTransitioning(false), STACK_ANIMATION_MS);
    }
  }, []);

  const removeTopWithAnimation = useCallback((toLength: number) => {
    const current = renderItemsRef.current.filter((it) => it.phase !== "leaving");
    if (current.length <= toLength) return;
    const instant = prefersReducedMotion();
    if (instant) {
      setRenderItems(current.slice(0, toLength));
      return;
    }
    const removingKeys = new Set(current.slice(toLength).map((it) => it.key));
    setIsTransitioning(true);
    setRenderItems(current.map((it) => (removingKeys.has(it.key) ? { ...it, phase: "leaving" } : it)));
    window.setTimeout(() => {
      setRenderItems((items) => items.filter((it) => !removingKeys.has(it.key)));
      setIsTransitioning(false);
    }, STACK_ANIMATION_MS);
  }, []);

  // 07-screens.md 3c "홈으로 가기" · 8b "인식 완료 → 7로(8a·8b 둘 다 pop)": 한 겹씩 벗기는 게 아니라
  // 스택을 전부 비우고 지정한 탭으로 돌아간다.
  const resetStackToTab = useCallback((tab: TabId) => {
    const current = renderItemsRef.current.filter((it) => it.phase !== "leaving");
    setRenderItems([]);
    setActiveTab(tab);
    if (current.length > 0) {
      suppressNextPopRef.current = true;
      window.history.go(-current.length);
    }
  }, []);

  const resetStackToHome = useCallback(() => resetStackToTab("home"), [resetStackToTab]);

  const back = useCallback(() => {
    window.history.back();
  }, []);

  // 브라우저·안드로이드 뒤로가기 — popstate를 받아 스택을 한 겹씩 pop 한다.
  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      if (suppressNextPopRef.current) {
        // resetStackToHome()이 이미 즉시 반영했다 — history.go로 발생한 popstate는 무시하고 맞춰만 준다.
        suppressNextPopRef.current = false;
        setRenderItems([]);
        return;
      }
      const state = (event.state ?? {}) as Partial<HistoryState>;
      const targetLen = state.stack?.length ?? 0;
      removeTopWithAnimation(targetLen);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [removeTopWithAnimation]);

  const switchTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  const goAuthScreen = useCallback((id: AuthScreenId) => {
    setAuthScreen(id);
  }, []);

  const enterApp = useCallback(() => {
    setAuthScreen(null);
    setActiveTab("home");
  }, []);

  const logout = useCallback(() => {
    // 07-screens.md "10 마이페이지 '로그아웃' → 2(로그인 입력), 스택도 비운다" — 2026-09-11 팀 결정.
    // isLoggedIn=false 설정은 호출하는 화면(MyPage)에서 store.setLoggedIn(false)로 먼저 처리한다.
    setRenderItems([]);
    setActiveTab("home");
    setAuthScreen("loginInput");
  }, []);

  const navValue: NavValue = {
    activeTab,
    switchTab,
    push,
    back,
    resetStackToHome,
    resetStackToTab,
    authScreen,
    goAuthScreen,
    enterApp,
    logout,
  };

  return (
    <NavContext.Provider value={navValue}>
      <div
        className="h-dvh w-full overflow-hidden flex flex-col"
        style={{
          background: "#F6F5FC",
          pointerEvents: isTransitioning ? "none" : "auto",
          maxWidth: 480,
          margin: "0 auto",
          position: "relative",
        }}
      >
        {authScreen ? (
          <AuthScreens authScreen={authScreen} />
        ) : (
          <>
            <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
              <div className="shoot-tab-layer">
                {/* 탭 4개 — 계속 마운트한 채 opacity/visibility만 바꿔 스크롤 위치를 보존한다. */}
                <div className="shoot-tab-item" data-active={activeTab === "home"}>
                  <Home />
                </div>
                <div className="shoot-tab-item" data-active={activeTab === "groups"}>
                  <GroupList />
                </div>
                <div className="shoot-tab-item" data-active={activeTab === "expenses"}>
                  <ExpenseListTab />
                </div>
                <div className="shoot-tab-item" data-active={activeTab === "mypage"}>
                  <MyPage />
                </div>
              </div>
              <StackLayer items={renderItems} />
            </div>
            {renderItems.length === 0 && <TabBar activeTab={activeTab} onChange={switchTab} />}
          </>
        )}
      </div>
    </NavContext.Provider>
  );
}

function AuthScreens({ authScreen }: { authScreen: AuthScreenId }) {
  switch (authScreen) {
    case "splash":
      return <Main />;
    case "signupInput":
      return <SignupInput />;
    case "signupSuccess":
      return <SignupSuccess />;
    case "loginInput":
      return <LoginInput />;
    case "loginSuccess":
      return <LoginSuccess />;
    default:
      return null;
  }
}
