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
  getRecentOwnExpenses,
  getIncomeTotalForUser,
} from "@/lib/selectors";
import { formatRelativeTime, formatWon } from "@/lib/format";
import { getCategoryVisual } from "@/lib/categories";
import { TODAY_DATE } from "@/lib/mock";
import { CategoryIcon } from "../icons";
import { ArrowUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon, PlusIcon } from "../icons";

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

export default function Home() {
  const nav = useNav();
  const store = useStore();
  const [homeGroup, setHomeGroup] = useState<string>("me");

  const me = store.profiles.find((p) => p.id === store.currentUserId);
  const givenName = me?.name ?? "";
  const myGroups = getGroupsForUser(store.groups, store.groupMembers, store.currentUserId);

  const expenseTotal = useMemo(() => {
    if (homeGroup === "me") return getPersonalExpenseTotal(store.expenses, store.currentUserId, CURRENT_MONTH);
    return getGroupExpenseTotal(store.expenses, homeGroup, CURRENT_MONTH);
  }, [store.expenses, store.currentUserId, homeGroup]);

  // 2026-09-17 팀 결정: 3개 → 5개로 늘림. store.expenses 기준으로 매번 다시 계산되므로(위 useMemo 의존성)
  // 현재 실시간 상태를 그대로 반영한다 — 새 지출을 기록하면 바로 목록에 반영된다.
  const recentExpenses = useMemo(
    () => getRecentOwnExpenses(store.expenses, store.currentUserId, 5),
    [store.expenses, store.currentUserId]
  );

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

  function goPrevMonth() {
    const prev = calLinearMonth - 1;
    setCalYear(Math.floor(prev / 12));
    setCalMonthIndex(((prev % 12) + 12) % 12);
  }
  function goNextMonth() {
    if (atMaxMonth) return; // 미래 +1년을 넘어가지 않는다
    const next = calLinearMonth + 1;
    setCalYear(Math.floor(next / 12));
    setCalMonthIndex(next % 12);
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
      if (num === null) return { num: "", bg: "transparent", numColor: "#fff", expenseLabel: "", incomeLabel: "" };
      const expenseAmount = expenseByDay.get(num);
      const incomeAmount = incomeByDay.get(num);
      const isToday = isRealCurrentMonth && num === TODAY_DAY;
      return {
        num,
        bg: isToday ? "var(--shoot-surface-alt)" : "var(--shoot-bg)",
        numColor: isToday ? "var(--shoot-accent)" : "var(--shoot-text-muted)",
        expenseLabel: expenseAmount ? (expenseAmount / 1000).toFixed(0) + "천" : "",
        incomeLabel: incomeAmount ? (incomeAmount / 10000).toFixed(0) + "만" : "",
      };
    });
  }, [ownExpenses, ownIncomes, calYear, calMonthIndex]);

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
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {[
              { label: "식비", pct: 42 },
              { label: "생활", pct: 28 },
              { label: "문화", pct: 17 },
            ].map((row) => (
              <div key={row.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 4 }}>
                  <span>{row.label}</span>
                  <span>{row.pct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.25)" }}>
                  <div style={{ width: `${row.pct}%`, height: "100%", borderRadius: 3, background: "var(--shoot-surface)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          onClick={() => nav.push({ id: "groupCreateType" })}
          style={{ marginTop: 16, height: 48, borderRadius: 16, background: "var(--shoot-surface)", border: "1.5px dashed var(--shoot-accent)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
        >
          <PlusIcon size={16} color="var(--shoot-accent)" />
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--shoot-accent)" }}>그룹 만들기</span>
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
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--shoot-text)" }}>
              {calYear}년 {calMonthIndex + 1}월 캘린더
            </div>
            {/* 2026-09-14 팀 결정: 화살표로 월(과 그에 따른 연도)을 변경한다 — 과거는 제한 없음, 미래는 오늘 기준 +1년까지. */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                onClick={goPrevMonth}
                style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--shoot-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeftIcon size={13} color="var(--shoot-accent)" />
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
                <div key={idx} style={{ minHeight: 52, borderRadius: 10, background: d.bg, padding: "4px 2px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: d.numColor }}>{d.num}</div>
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
