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
import { formatRelativeTime, formatWon, stripSurname } from "@/lib/format";
import { getCategoryVisual } from "@/lib/categories";
import { CategoryIcon } from "../icons";
import { ArrowUpIcon, ChevronDownIcon, ChevronRightIcon, HeartIcon, PlusIcon } from "../icons";

const CURRENT_MONTH = "2026-09";
const TODAY_DAY = 9; // TODAY_DATE(2026-09-09)의 일(day)
const START_WEEKDAY = 2; // 2026-09-01은 화요일
const DAYS_IN_MONTH = 30;

export default function Home() {
  const nav = useNav();
  const store = useStore();
  const [homeGroup, setHomeGroup] = useState<string>("me");

  const me = store.profiles.find((p) => p.id === store.currentUserId);
  const givenName = stripSurname(me?.name ?? "");
  const myGroups = getGroupsForUser(store.groups, store.groupMembers, store.currentUserId);

  const expenseTotal = useMemo(() => {
    if (homeGroup === "me") return getPersonalExpenseTotal(store.expenses, store.currentUserId, CURRENT_MONTH);
    return getGroupExpenseTotal(store.expenses, homeGroup, CURRENT_MONTH);
  }, [store.expenses, store.currentUserId, homeGroup]);

  const recentExpenses = useMemo(
    () => getRecentOwnExpenses(store.expenses, store.currentUserId, 3),
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
  const calendarDays = useMemo(() => {
    const expenseByDay = new Map<number, number>();
    for (const e of ownExpenses) {
      if (!e.date.startsWith(CURRENT_MONTH)) continue;
      const day = parseInt(e.date.slice(8, 10), 10);
      expenseByDay.set(day, (expenseByDay.get(day) ?? 0) + e.amount);
    }
    const incomeByDay = new Map<number, number>();
    for (const i of ownIncomes) {
      if (!i.date.startsWith(CURRENT_MONTH)) continue;
      const day = parseInt(i.date.slice(8, 10), 10);
      incomeByDay.set(day, (incomeByDay.get(day) ?? 0) + i.amount);
    }
    const days: Array<{ num: number | null }> = [];
    for (let i = 0; i < START_WEEKDAY; i++) days.push({ num: null });
    for (let n = 1; n <= DAYS_IN_MONTH; n++) days.push({ num: n });
    return days.map(({ num }) => {
      if (num === null) return { num: "", bg: "transparent", numColor: "#fff", expenseLabel: "", incomeLabel: "" };
      const expenseAmount = expenseByDay.get(num);
      const incomeAmount = incomeByDay.get(num);
      const isToday = num === TODAY_DAY;
      return {
        num,
        bg: isToday ? "#F0EEFF" : "#F9F8FC",
        numColor: isToday ? "#6A5ECF" : "#8B8378",
        expenseLabel: expenseAmount ? (expenseAmount / 1000).toFixed(0) + "천" : "",
        incomeLabel: incomeAmount ? (incomeAmount / 10000).toFixed(0) + "만" : "",
      };
    });
  }, [ownExpenses, ownIncomes]);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#2D2A3E", flex: 1, minWidth: 0 }}>
          {givenName}님
          <br />
          안녕하세요
        </div>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <select
            value={homeGroup}
            onChange={(e) => setHomeGroup(e.target.value)}
            style={{ appearance: "none", background: "#F0EEFF", border: "none", borderRadius: 20, padding: "9px 30px 9px 34px", fontSize: 12, fontWeight: 800, color: "#6A5ECF" }}
          >
            <option value="me">나 (개인)</option>
            {myGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <HeartIcon size={14} color="#6A5ECF" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <ChevronDownIcon size={10} color="#6A5ECF" strokeWidth={2.5} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
        {/* 07-screens.md "2b 수입 카드 탭 → 2b-1a" — 2026-09-11 팀 결정으로 수입 기능이 이번 범위에 포함됐다. */}
        <div
          onClick={() => nav.push({ id: "incomeList" })}
          style={{ marginTop: 18, background: "#fff", border: "1.5px solid #E8E4F4", borderRadius: 22, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 12, background: "#E8F9F7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ArrowUpIcon size={17} color="#1D7A69" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6980" }}>이번 달 총 수입</div>
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
                  <div style={{ width: `${row.pct}%`, height: "100%", borderRadius: 3, background: "#fff" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          onClick={() => nav.push({ id: "groupCreateType" })}
          style={{ marginTop: 16, height: 48, borderRadius: 16, background: "#fff", border: "1.5px dashed #6A5ECF", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
        >
          <PlusIcon size={16} color="#6A5ECF" />
          <span style={{ fontSize: 14, fontWeight: 800, color: "#6A5ECF" }}>그룹 만들기</span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#2D2A3E" }}>최근 지출</div>
          {/* TODO: [?] 07-screens.md 2b 상세에 "전체보기"의 이동 대상이 명시돼 있지 않다. 임시로 no-op. */}
          <div onClick={() => {}} style={{ fontSize: 12, fontWeight: 700, color: "#6A5ECF", cursor: "default" }}>
            전체보기
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {recentExpenses.map((e) => {
            const visual = getCategoryVisual(e.category);
            return (
              <div key={e.id} style={{ background: "#fff", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, border: "1px solid #E8E4F4" }}>
                <div style={{ width: 34, height: 34, borderRadius: 12, background: visual.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CategoryIcon icon={visual.icon as never} size={16} color={visual.ink} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#2D2A3E" }}>{e.memo}</div>
                  <div style={{ fontSize: 11, color: "#6B6980", fontWeight: 600 }}>
                    {e.category} · {formatRelativeTime(e.created_at)}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#2D2A3E" }}>{formatWon(e.amount)}</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#2D2A3E", marginBottom: 10 }}>9월 캘린더</div>
          <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #E8E4F4", padding: 14 }}>
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
