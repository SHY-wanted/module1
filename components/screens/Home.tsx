"use client";
// components/screens/Home.tsx — 2b. 메인(홈)(design/shoot/Home.dc.html)
import { useMemo, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import {
  getGroupsForUser,
  getOwnExpenses,
  getPersonalExpenseTotal,
  getGroupExpenseTotal,
  getPersonalExpenseCategoryBreakdown,
  getGroupExpenseCategoryBreakdown,
  getRecentOwnExpenses,
  getIncomeTotalForUser,
} from "@/lib/selectors";
import { formatRelativeTime, formatWon } from "@/lib/format";
import { getCategoryVisual } from "@/lib/categories";
import { TODAY_DATE } from "@/lib/mock";
import { CategoryIcon } from "../icons";
import { ArrowUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, FlagIcon, HeartIcon, PlusIcon } from "../icons";

// "이번 달 총 수입·총 지출" 카드는 캘린더를 다른 달로 넘겨도 바뀌지 않는다 — 항상 실제 오늘(TODAY_DATE)
// 기준 이번 달이다. 09-14 이전엔 9월로 하드코딩돼 있었다.
const CURRENT_MONTH = TODAY_DATE.slice(0, 7); // "2026-09"
const [TODAY_YEAR, TODAY_MONTH_NUM, TODAY_DAY] = TODAY_DATE.split("-").map(Number);
const TODAY_MONTH_INDEX = TODAY_MONTH_NUM - 1; // 0-based(1월=0)

// 2026-09-14 팀 결정: 캘린더는 1~12월 전부, 오늘을 기준으로 과거는 제한 없이 · 미래는 +1년까지만 넘길 수 있다.
function toLinearMonth(year: number, monthIndex: number) {
  return year * 12 + monthIndex;
}
const TODAY_LINEAR_MONTH = toLinearMonth(TODAY_YEAR, TODAY_MONTH_INDEX);
const MAX_LINEAR_MONTH = TODAY_LINEAR_MONTH + 12; // 오늘과 같은 달의 내년까지
// 2026-09-18 사용자 요청: 과거도 무제한이 아니라 올해 기준 5년 전까지만 넘길 수 있게 제한한다.
const MIN_LINEAR_MONTH = TODAY_LINEAR_MONTH - 5 * 12;

// 신규 기능: "지난달보다 몇 % 늘었어요" 전월 대비 비교 — Date가 연/월 넘어가는 걸 알아서 처리해준다
// (1월이면 작년 12월로).
const PREVIOUS_MONTH_DATE = new Date(TODAY_YEAR, TODAY_MONTH_INDEX - 1, 1);
const PREVIOUS_MONTH = `${PREVIOUS_MONTH_DATE.getFullYear()}-${String(PREVIOUS_MONTH_DATE.getMonth() + 1).padStart(2, "0")}`;

export default function Home() {
  const nav = useNav();
  const store = useStore();
  const [homeGroup, setHomeGroup] = useState<string>("me");
  const [checkingIn, setCheckingIn] = useState(false);

  const me = store.profiles.find((p) => p.id === store.currentUserId);
  const givenName = me?.name ?? "";
  const myGroups = getGroupsForUser(store.groups, store.groupMembers, store.currentUserId);

  const expenseTotal = useMemo(() => {
    if (homeGroup === "me") return getPersonalExpenseTotal(store.expenses, store.currentUserId, CURRENT_MONTH);
    return getGroupExpenseTotal(store.expenses, homeGroup, CURRENT_MONTH);
  }, [store.expenses, store.currentUserId, homeGroup]);

  // 신규 기능: 전월 대비 비교 — 지난달 데이터가 없으면(0원) 비교 자체가 의미 없어서 표시 안 한다.
  const lastMonthExpenseTotal = useMemo(() => {
    if (homeGroup === "me") return getPersonalExpenseTotal(store.expenses, store.currentUserId, PREVIOUS_MONTH);
    return getGroupExpenseTotal(store.expenses, homeGroup, PREVIOUS_MONTH);
  }, [store.expenses, store.currentUserId, homeGroup]);
  const momChangePct = lastMonthExpenseTotal > 0 ? Math.round(((expenseTotal - lastMonthExpenseTotal) / lastMonthExpenseTotal) * 100) : null;

  // 2026-09-23 버그 수정: "이번 달 총 지출" 카드 아래 카테고리별 % 막대가 식비 42%·생활 28%·문화 17%로
  // 고정돼 있어서 실제 지출 카테고리와 안 맞았다 — expenseTotal과 같은 필터 기준으로 실제 계산한다.
  // 카드에는 3줄만 들어가므로 비중이 큰 상위 3개 카테고리만 보여준다.
  const categoryBreakdown = useMemo(() => {
    const rows =
      homeGroup === "me"
        ? getPersonalExpenseCategoryBreakdown(store.expenses, store.currentUserId, CURRENT_MONTH)
        : getGroupExpenseCategoryBreakdown(store.expenses, homeGroup, CURRENT_MONTH);
    return rows.slice(0, 3);
  }, [store.expenses, store.currentUserId, homeGroup]);

  // 2026-09-17 팀 결정: 3개 → 5개로 늘림. store.expenses 기준으로 매번 다시 계산되므로(위 useMemo 의존성)
  // 현재 실시간 상태를 그대로 반영한다 — 새 지출을 기록하면 바로 목록에 반영된다.
  const recentExpenses = useMemo(
    () => getRecentOwnExpenses(store.expenses, store.currentUserId, 5),
    [store.expenses, store.currentUserId]
  );

  // 출석체크(2026-09-20 신규) — 접속률을 올리기 위한 기능이라 홈 진입 즉시 보이는 자리에 둔다.
  const todayCheckin = store.attendanceCheckins.find((c) => c.user_id === store.currentUserId && c.checkin_date === TODAY_DATE);

  async function handleCheckIn() {
    if (checkingIn || todayCheckin) return;
    setCheckingIn(true);
    const result = await store.checkInToday();
    setCheckingIn(false);
    if (!result.ok || !result.data) {
      store.showToast(result.error ?? "출석체크에 실패했어요");
      return;
    }
    const isBonusDay = result.data.streak_day >= 7;
    store.showToast(
      isBonusDay
        ? `7일 연속 출석! 🪙+${result.data.coins_earned} (2배 보너스)`
        : `출석체크 완료! 🪙+${result.data.coins_earned} · ${result.data.streak_day}일째`
    );
  }

  const incomeTotal = useMemo(
    () => getIncomeTotalForUser(store.incomes, store.currentUserId, CURRENT_MONTH),
    [store.incomes, store.currentUserId]
  );

  // 캘린더: design/shoot/Home.dc.html의 CALENDAR_DATA를 하드코딩하지 않고, 본인 지출·수입 mock에서 그대로
  // 계산한다. 07-screens.md 2b 상세(2026-09-11 팀 결정): "날짜별 지출·수입만 표시, 저금은 이번엔 제외".
  const ownExpenses = getOwnExpenses(store.expenses, store.currentUserId);
  const ownIncomes = store.incomes.filter((i) => i.user_id === store.currentUserId);

  // 2026-09-14 팀 결정: 캘린더는 화살표로 달을 넘길 수 있다(과거 제한 없음 · 미래는 오늘 기준 +1년까지).
  const [calYear, setCalYear] = useState(TODAY_YEAR);
  const [calMonthIndex, setCalMonthIndex] = useState(TODAY_MONTH_INDEX); // 0=1월 ... 11=12월
  const calLinearMonth = toLinearMonth(calYear, calMonthIndex);
  const atMaxMonth = calLinearMonth >= MAX_LINEAR_MONTH;
  const atMinMonth = calLinearMonth <= MIN_LINEAR_MONTH;
  // 2026-09-21 팀 요청(신규): 화살표로 한 달씩 넘기는 것 말고, 아래방향 화살표 바를 눌러 원하는 월·일로
  // 바로 이동할 수 있게 한다. 실제 달력 UI를 새로 그리는 대신 네이티브 <input type="date">를 투명하게
  // 겹쳐서 브라우저 날짜 선택기를 그대로 쓴다(ExpenseInput의 날짜 입력과 같은 방식).
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const maxPickDate = useMemo(() => {
    const y = Math.floor(MAX_LINEAR_MONTH / 12);
    const m = MAX_LINEAR_MONTH % 12;
    const lastDay = new Date(y, m + 1, 0).getDate();
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }, []);
  // 2026-09-18 사용자 요청: 과거도 올해 기준 5년 전까지만.
  const minPickDate = useMemo(() => {
    const y = Math.floor(MIN_LINEAR_MONTH / 12);
    const m = MIN_LINEAR_MONTH % 12;
    return `${y}-${String(m + 1).padStart(2, "0")}-01`;
  }, []);
  const datePickerValue = `${calYear}-${String(calMonthIndex + 1).padStart(2, "0")}-${String(selectedDay ?? 1).padStart(2, "0")}`;

  function goPrevMonth() {
    if (atMinMonth) return; // 5년 전보다 더 과거로는 넘어가지 않는다
    const prev = calLinearMonth - 1;
    setCalYear(Math.floor(prev / 12));
    setCalMonthIndex(((prev % 12) + 12) % 12);
    setSelectedDay(null);
  }
  function goNextMonth() {
    if (atMaxMonth) return; // 미래 +1년을 넘어가지 않는다
    const next = calLinearMonth + 1;
    setCalYear(Math.floor(next / 12));
    setCalMonthIndex(next % 12);
    setSelectedDay(null);
  }
  function handleDatePick(value: string) {
    if (!value) return;
    const [y, m, d] = value.split("-").map(Number);
    const picked = Math.min(Math.max(toLinearMonth(y, m - 1), MIN_LINEAR_MONTH), MAX_LINEAR_MONTH);
    setCalYear(Math.floor(picked / 12));
    setCalMonthIndex(((picked % 12) + 12) % 12);
    setSelectedDay(d);
  }

  const calendarDays = useMemo(() => {
    const monthKey = `${calYear}-${String(calMonthIndex + 1).padStart(2, "0")}`;
    const expenseByDay = new Map<number, number>();
    for (const e of ownExpenses) {
      if (!e.date.startsWith(monthKey)) continue;
      const day = parseInt(e.date.slice(8, 10), 10);
      expenseByDay.set(day, (expenseByDay.get(day) ?? 0) + e.amount);
    }
    const incomeByDay = new Map<number, number>();
    for (const i of ownIncomes) {
      if (!i.date.startsWith(monthKey)) continue;
      const day = parseInt(i.date.slice(8, 10), 10);
      incomeByDay.set(day, (incomeByDay.get(day) ?? 0) + i.amount);
    }
    // 어떤 연·월이든 시작 요일·마지막 날짜를 직접 계산한다(9월 고정 하드코딩 제거).
    const startWeekday = new Date(calYear, calMonthIndex, 1).getDay(); // 0=일요일 ... 6=토요일
    const daysInMonth = new Date(calYear, calMonthIndex + 1, 0).getDate();
    const isRealCurrentMonth = calYear === TODAY_YEAR && calMonthIndex === TODAY_MONTH_INDEX;
    const days: Array<{ num: number | null }> = [];
    for (let i = 0; i < startWeekday; i++) days.push({ num: null });
    for (let n = 1; n <= daysInMonth; n++) days.push({ num: n });
    return days.map(({ num }) => {
      if (num === null) return { num: "", bg: "transparent", numColor: "#fff", isSelected: false, expenseLabel: "", incomeLabel: "" };
      const expenseAmount = expenseByDay.get(num);
      const incomeAmount = incomeByDay.get(num);
      const isToday = isRealCurrentMonth && num === TODAY_DAY;
      const isSelected = selectedDay === num;
      return {
        num,
        bg: isToday ? "var(--shoot-surface-alt)" : "var(--shoot-bg)",
        numColor: isToday ? "var(--shoot-accent)" : "var(--shoot-text-muted)",
        isSelected,
        expenseLabel: expenseAmount ? (expenseAmount / 1000).toFixed(0) + "천" : "",
        incomeLabel: incomeAmount ? (incomeAmount / 10000).toFixed(0) + "만" : "",
      };
    });
  }, [ownExpenses, ownIncomes, calYear, calMonthIndex, selectedDay]);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)", flex: 1, minWidth: 0 }}>
          {givenName}님
          <br />
          안녕하세요
        </div>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <select
            value={homeGroup}
            onChange={(e) => setHomeGroup(e.target.value)}
            style={{ appearance: "none", background: "var(--shoot-surface-alt)", border: "none", borderRadius: 20, padding: "9px 30px 9px 34px", fontSize: 12, fontWeight: 800, color: "var(--shoot-accent)" }}
          >
            <option value="me">나 (개인)</option>
            {myGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <HeartIcon size={14} color="var(--shoot-accent)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <ChevronDownIcon size={10} color="var(--shoot-accent)" strokeWidth={2.5} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
        {/* 출석체크(2026-09-20 신규, 사용자 요청) — "접속률을 올리기 위함"이라 홈 맨 위, 여는 즉시 보이는
            자리에 둔다. 매일 코인 지급, 7일 연속 출석하면 그날 코인이 2배(lib/pets.ts CHECKIN_*). */}
        <div
          onClick={handleCheckIn}
          style={{
            marginTop: 18,
            background: todayCheckin ? "var(--shoot-surface)" : "linear-gradient(135deg,#FFD166 0%,#F2A93B 100%)",
            border: todayCheckin ? "1.5px solid var(--shoot-border)" : "none",
            borderRadius: 22,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: todayCheckin || checkingIn ? "default" : "pointer",
            opacity: checkingIn ? 0.7 : 1,
          }}
        >
          <div style={{ fontSize: 26, flexShrink: 0 }}>🪙</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: todayCheckin ? "var(--shoot-text)" : "#5A3A00" }}>
              {todayCheckin ? "오늘 출석체크 완료!" : "출석체크하고 코인 받기"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: todayCheckin ? "var(--shoot-text-muted)" : "rgba(90,58,0,0.75)", marginTop: 2 }}>
              {todayCheckin ? `${todayCheckin.streak_day}일째 연속 출석 중이에요` : "7일 꼬박 채우면 코인 2배!"}
            </div>
          </div>
          {!todayCheckin && (
            <div style={{ fontSize: 13, fontWeight: 800, color: "#5A3A00", background: "rgba(255,255,255,0.55)", borderRadius: 12, padding: "8px 14px", flexShrink: 0 }}>
              출석하기
            </div>
          )}
        </div>

        {/* 07-screens.md "2b 수입 카드 탭 → 2b-1a" — 2026-09-11 팀 결정으로 수입 기능이 이번 범위에 포함됐다. */}
        <div
          onClick={() => nav.push({ id: "incomeList" })}
          style={{ marginTop: 18, background: "var(--shoot-surface)", border: "1.5px solid var(--shoot-border)", borderRadius: 22, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 12, background: "#E8F9F7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ArrowUpIcon size={17} color="#1D7A69" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)" }}>이번 달 총 수입</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1D7A69", marginTop: 2, letterSpacing: "-0.4px" }}>{formatWon(incomeTotal)}</div>
          </div>
          <ChevronRightIcon size={16} color="#A9A2B8" />
        </div>

        {/* 07-screens.md "2b 총지출 카드 '>' → 7(신규)" — 2026-09-11 팀 결정. 7은 탭 전환 대상이라 push가 아니라
            switchTab을 쓴다(수입 카드는 2b-1a로 push하는 것과 다름 — 07-screens.md 「화면ID별 분류」 참고). */}
        <div
          onClick={() => nav.switchTab("expenses")}
          style={{ marginTop: 12, background: "linear-gradient(135deg,#8C81E0 0%,#6A5ECF 100%)", borderRadius: 22, padding: 20, boxShadow: "0 10px 26px rgba(106,94,207,0.32)", cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>이번 달 총 지출</div>
            <ChevronRightIcon size={16} color="rgba(255,255,255,0.85)" />
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", marginTop: 6, letterSpacing: "-0.5px" }}>{formatWon(expenseTotal)}</div>
          {momChangePct !== null && (
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
              {momChangePct === 0 ? "지난달과 비슷해요" : momChangePct > 0 ? `지난달보다 ${momChangePct}% 늘었어요` : `지난달보다 ${Math.abs(momChangePct)}% 줄었어요`}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {categoryBreakdown.length === 0 ? (
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>이번 달 지출이 아직 없어요</div>
            ) : (
              categoryBreakdown.map((row) => (
                <div key={row.category}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 4 }}>
                    <span>{row.category}</span>
                    <span>{row.pct}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.25)" }}>
                    <div style={{ width: `${row.pct}%`, height: "100%", borderRadius: 3, background: "var(--shoot-surface)" }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          onClick={() => nav.push({ id: "groupCreateType" })}
          style={{ marginTop: 16, height: 48, borderRadius: 16, background: "var(--shoot-surface)", border: "1.5px dashed var(--shoot-accent)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
        >
          <PlusIcon size={16} color="var(--shoot-accent)" />
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--shoot-accent)" }}>그룹 만들기</span>
        </div>

        {/* 2026-09-20 팀 요청(신규): 월별 목표 설정 진입점 — 10(마이페이지) "월별 목표 설정" 행과 같은 화면으로 push. */}
        <div
          onClick={() => nav.push({ id: "monthlyGoalSetting" })}
          style={{ marginTop: 12, background: "var(--shoot-surface-alt)", border: "1.5px dashed var(--shoot-accent)", borderRadius: 22, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 12, background: "var(--shoot-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FlagIcon size={17} color="var(--shoot-accent)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--shoot-text)" }}>이번 달 목표 설정하기</div>
            <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", marginTop: 2 }}>카테고리별 목표를 정하고 지출을 관리해보세요</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "var(--shoot-accent)", borderRadius: 999, padding: "2px 8px", flexShrink: 0 }}>NEW</span>
        </div>

        {/* 2026-09-17 팀 결정: "전체보기" 삭제(이동 대상 미정 TODO였음) — 최근 지출 5개만 보여준다. */}
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--shoot-text)" }}>최근 지출</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {recentExpenses.map((e) => {
            const visual = getCategoryVisual(e.category);
            return (
              <div key={e.id} style={{ background: "var(--shoot-surface)", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--shoot-border)" }}>
                <div style={{ width: 34, height: 34, borderRadius: 12, background: visual.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CategoryIcon icon={visual.icon as never} size={16} color={visual.ink} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text)" }}>{e.memo}</div>
                  <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", fontWeight: 600 }}>
                    {e.category} · {formatRelativeTime(e.created_at)}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--shoot-text)" }}>{formatWon(e.amount)}</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            {/* 2026-09-21 팀 요청(신규): 아래방향 화살표 바 — 눌러서 원하는 월·일로 바로 이동. 네이티브
                <input type="date">를 투명하게 겹쳐 브라우저 날짜 선택기를 그대로 쓴다. */}
            <div style={{ position: "relative", display: "inline-flex" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 10px",
                  borderRadius: 10,
                  background: "var(--shoot-surface-alt)",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--shoot-text)" }}>
                  {calYear}년 {calMonthIndex + 1}월{selectedDay ? ` ${selectedDay}일` : ""} 캘린더
                </span>
                <ChevronDownIcon size={13} color="var(--shoot-text-muted)" strokeWidth={2.5} />
              </div>
              <input
                type="date"
                value={datePickerValue}
                min={minPickDate}
                max={maxPickDate}
                onChange={(e) => handleDatePick(e.target.value)}
                aria-label="월·일 선택"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none" }}
              />
            </div>
            {/* 2026-09-14 팀 결정, 2026-09-18 수정: 화살표로 월(과 그에 따른 연도)을 변경한다 — 과거는
                올해 기준 5년 전까지, 미래는 오늘 기준 +1년까지. */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                onClick={goPrevMonth}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: atMinMonth ? "var(--shoot-divider)" : "var(--shoot-surface-alt)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: atMinMonth ? "default" : "pointer",
                }}
              >
                <ChevronLeftIcon size={13} color={atMinMonth ? "#C9C4D6" : "var(--shoot-accent)"} />
              </div>
              <div
                onClick={goNextMonth}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: atMaxMonth ? "var(--shoot-divider)" : "var(--shoot-surface-alt)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: atMaxMonth ? "default" : "pointer",
                }}
              >
                <ChevronRightIcon size={13} color={atMaxMonth ? "#C9C4D6" : "var(--shoot-accent)"} />
              </div>
            </div>
          </div>
          <div style={{ background: "var(--shoot-surface)", borderRadius: 18, border: "1px solid var(--shoot-border)", padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, fontSize: 11, fontWeight: 700, color: "#A9A2B8", textAlign: "center", marginBottom: 6 }}>
              {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
              {calendarDays.map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    minHeight: 52,
                    borderRadius: 10,
                    background: d.bg,
                    border: d.isSelected ? "1.5px solid var(--shoot-accent)" : "1.5px solid transparent",
                    padding: "4px 2px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: d.isSelected ? "var(--shoot-accent)" : d.numColor }}>{d.num}</div>
                  {d.expenseLabel && <div style={{ fontSize: 9, fontWeight: 800, color: "#B23B3B", marginTop: 2 }}>-{d.expenseLabel}</div>}
                  {d.incomeLabel && <div style={{ fontSize: 9, fontWeight: 800, color: "#1D7A69", marginTop: 1 }}>+{d.incomeLabel}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
