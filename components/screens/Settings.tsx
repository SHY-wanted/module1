"use client";
// components/screens/Settings.tsx — 2c. 설정(design/shoot/Settings.dc.html)
// 2026-09-17 팀 결정(1차): 카테고리는 "추가"를 없애고 "편집(이름 변경)"만 남긴다. 아이콘 제거, 색으로만 구별.
//   "예산 초과 시 알림" 삭제. "알림음" → "그룹원 기록 확인 알림"으로 대체.
// 2026-09-17 팀 결정(2차): "카테고리 추가"를 다시 만들되 "카테고리 편집" 모드에서만 보이게 한다.
//   그리고 "개인 카테고리"와 "그룹 카테고리"를 차별화한다 — 6(지출 입력)의 "어느 그룹과 공유할까요?"와
//   짝을 맞춰, 그룹마다 서로 다른 카테고리 목록을 따로 관리한다(store.getCategoriesForScope).
// 2026-09-22 사용자 요청(이 파일의 현재 버전): 카테고리 편집(이름 변경 → 삭제로 바뀌었다가) 기능을
//   아예 없앴다 — 이 화면에서는 이제 보기만 가능하다. "개인/그룹별로 다른 카테고리 목록"은 그대로 유지.
import { useMemo, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import type { CategoryScope } from "@/lib/categories";
import { getGroupsForUser } from "@/lib/selectors";
import { BellIcon, ChevronLeftIcon, ChevronRightIcon, MoonIcon, RepeatIcon } from "../icons";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ width: 42, height: 24, borderRadius: 12, background: on ? "var(--shoot-accent)" : "#D8D3C8", position: "relative", flexShrink: 0, cursor: "pointer", transition: "background 0.15s" }}
    >
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--shoot-surface)", position: "absolute", top: 3, left: on ? 21 : 3, boxShadow: "0 2px 5px rgba(0,0,0,0.2)", transition: "left 0.15s" }} />
    </div>
  );
}

// select 하나로 "개인" 또는 그룹 하나를 고르기 위한 문자열 값 <-> CategoryScope 변환.
const PERSONAL_VALUE = "__personal__";
function scopeToValue(scope: CategoryScope): string {
  return scope.kind === "personal" ? PERSONAL_VALUE : scope.groupId;
}
function valueToScope(value: string): CategoryScope {
  return value === PERSONAL_VALUE ? { kind: "personal" } : { kind: "group", groupId: value };
}

export default function Settings() {
  const nav = useNav();
  const store = useStore();
  const myGroups = getGroupsForUser(store.groups, store.groupMembers, store.currentUserId);

  // 2026-09-17 팀 결정: 개인/그룹마다 카테고리 목록이 다르므로, 지금 보는 scope를 select로 고른다.
  const [scope, setScope] = useState<CategoryScope>({ kind: "personal" });

  // 버그 수정(2026-09-22 사용자 요청): 카테고리 목록이 지금 고른 scope(개인/그룹)의 프리셋을
  // 전부 보여줘서, 실제로 그 scope에서 지출을 한 번도 안 한 카테고리까지 섞여 보였다 — 지금까지
  // 실제로 지출을 입력한 카테고리만 이 화면에 남긴다(6의 카테고리 선택 칩 등 다른 화면은 그대로
  // 전체 프리셋을 보여줘야 해서, store.getCategoriesForScope 자체는 건드리지 않는다).
  const usedCategoryLabels = useMemo(() => {
    const set = new Set<string>();
    for (const e of store.expenses) {
      if (e.user_id !== store.currentUserId) continue;
      const inScope = scope.kind === "personal" ? !e.group_id : e.group_id === scope.groupId;
      if (inScope) set.add(e.category);
    }
    return set;
  }, [store.expenses, store.currentUserId, scope]);
  const categories = store.getCategoriesForScope(scope).filter((c) => usedCategoryLabels.has(c.label));

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)" }}>설정</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 20px" }}>
        {/* 2026-09-22 사용자 요청: 카테고리 편집(이름 변경·삭제) 기능을 아예 없애고 보기 전용으로 바꿨다. */}
        <div style={{ margin: "14px 0 8px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--shoot-text-muted)" }}>카테고리</div>
        </div>

        {/* 2026-09-17 팀 결정(개인·그룹 카테고리 차별화): 어느 카테고리 목록을 볼지 먼저 고른다 —
            6(지출 입력)의 "어느 그룹과 공유할까요?"와 같은 구분(개인 vs 그룹별)을 그대로 따른다. */}
        <select
          value={scopeToValue(scope)}
          onChange={(e) => setScope(valueToScope(e.target.value))}
          style={{ width: "100%", boxSizing: "border-box", height: 40, borderRadius: 12, border: "1.5px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 12px", fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}
        >
          <option value={PERSONAL_VALUE}>개인 카테고리</option>
          {myGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} 카테고리
            </option>
          ))}
        </select>

        {categories.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--shoot-text-muted)", fontSize: 12, fontWeight: 600, padding: "16px 0" }}>
            아직 이 카테고리로 지출을 입력한 적이 없어요
          </div>
        )}
        <div style={{ background: "var(--shoot-surface)", borderRadius: 16, border: "1px solid var(--shoot-border)", overflow: "hidden" }}>
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              // 카테고리를 누르면 그 카테고리로 필터링된 지출 목록(7)이 뜬다 — 보기 전용이라 이게 유일한 동작.
              onClick={() => nav.push({ id: "categoryExpenses", category: cat.label, scope })}
              style={{
                padding: "13px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderBottom: idx < categories.length - 1 ? "1px solid var(--shoot-divider)" : "none",
                cursor: "pointer",
              }}
            >
              {/* 2026-09-17 팀 결정: 아이콘 제거, 색으로만 구별(칠해진 원). */}
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: cat.ink, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "var(--shoot-text)" }}>{cat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--shoot-text-muted)", margin: "22px 0 8px" }}>알림</div>
        <div style={{ background: "var(--shoot-surface)", borderRadius: 16, border: "1px solid var(--shoot-border)", overflow: "hidden" }}>
          <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--shoot-divider)" }}>
            <BellIcon size={17} color="var(--shoot-text-muted)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--shoot-text)" }}>지출 기록 시 확인 알림</div>
              <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", marginTop: 2 }}>예: &quot;3,000원, 식비가 저장됐어요&quot;</div>
            </div>
            <Toggle on={store.notificationSettings.expenseConfirm} onClick={() => store.toggleNotification("expenseConfirm")} />
          </div>
          {/* 2026-09-17 팀 결정: "예산 초과 시 알림" 행 삭제. "알림음" → "그룹원 기록 확인 알림"으로 대체. */}
          <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <BellIcon size={17} color="var(--shoot-text-muted)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--shoot-text)" }}>그룹원 기록 확인 알림</div>
              <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", marginTop: 2 }}>예: &quot;민준 &amp; 서연 · 민준님이 기념일 비용을 저장하였어요&quot;</div>
            </div>
            <Toggle on={store.notificationSettings.groupMemberRecord} onClick={() => store.toggleNotification("groupMemberRecord")} />
          </div>
          {/* 2026-09-18 추가(신규 기능): 저녁 리마인더 — 기본은 꺼둔다(귀찮게 하는 알림이라). */}
          <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid var(--shoot-divider)" }}>
            <BellIcon size={17} color="var(--shoot-text-muted)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--shoot-text)" }}>저녁 리마인더</div>
              <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", marginTop: 2 }}>매일 저녁 8시, 오늘 지출을 안 기록했으면 알려드려요</div>
            </div>
            <Toggle on={store.notificationSettings.dailyReminder} onClick={() => store.toggleNotification("dailyReminder")} />
          </div>
        </div>
        {/* 2026-09-18 추가: 브라우저 알림 권한을 거부한 경우 — 토글은 켜져 있어도 실제 알림은 안 뜬다는
            걸 알려준다(권한은 브라우저 설정에서 직접 풀어야 하고, 코드로 다시 물어볼 수 없다). */}
        {typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied" && (
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--shoot-text-muted)", fontWeight: 600 }}>
            브라우저 알림 권한이 차단돼 있어요. 토스트는 뜨지만 실제 알림은 브라우저 설정에서 허용해야 받을 수 있어요.
          </div>
        )}

        {/* 목표(예산 대체, shooTbranch 통합, 2026-09-15) — 저금통 펫의 이번 달 목표 리포트가
            쓰는 카테고리별 목표를 여기서 정한다. */}
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--shoot-text-muted)", margin: "22px 0 8px" }}>저금통 펫</div>
        <div style={{ background: "var(--shoot-surface)", borderRadius: 16, border: "1px solid var(--shoot-border)", overflow: "hidden" }}>
          <div onClick={() => nav.push({ id: "monthlyGoalSetting" })} style={{ padding: "14px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <span style={{ fontSize: 17 }}>🪙</span>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "var(--shoot-text)" }}>월별 목표 설정</div>
            <ChevronRightIcon size={16} color="#A9A2B8" />
          </div>
        </div>

        {/* 신규 기능: 정기 지출(월세·구독료처럼 매달 반복되는 지출) 관리. */}
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--shoot-text-muted)", margin: "22px 0 8px" }}>정기 지출</div>
        <div style={{ background: "var(--shoot-surface)", borderRadius: 16, border: "1px solid var(--shoot-border)", overflow: "hidden" }}>
          <div onClick={() => nav.push({ id: "recurringExpenseManage" })} style={{ padding: "14px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <RepeatIcon size={17} color="var(--shoot-text-muted)" />
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "var(--shoot-text)" }}>정기 지출 관리</div>
            <ChevronRightIcon size={16} color="#A9A2B8" />
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--shoot-text-muted)", margin: "22px 0 8px" }}>앱 외형</div>
        <div style={{ background: "var(--shoot-surface)", borderRadius: 16, border: "1px solid var(--shoot-border)", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <MoonIcon size={17} color="var(--shoot-text-muted)" />
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "var(--shoot-text)" }}>다크 모드</div>
          </div>
          {/* 신규 기능(2026-09-21): 켜기/끄기 토글만 있던 걸 라이트/다크/시스템 3택으로 바꿨다 —
              "시스템"이면 OS의 다크모드 설정을 그대로 따라간다(store의 matchMedia 구독). */}
          <div style={{ display: "flex", gap: 6 }}>
            {(
              [
                { value: "light", label: "라이트" },
                { value: "dark", label: "다크" },
                { value: "system", label: "시스템 설정" },
              ] as const
            ).map((opt) => {
              const selected = store.darkModePreference === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => store.setDarkModePreference(opt.value)}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    background: selected ? "var(--shoot-accent)" : "var(--shoot-surface-alt)",
                    color: selected ? "#fff" : "var(--shoot-text-muted)",
                  }}
                >
                  {opt.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
