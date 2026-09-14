"use client";
// components/screens/Settings.tsx — 2c. 설정(design/shoot/Settings.dc.html)
// 2026-09-17 팀 결정(1차): 카테고리는 "추가"를 없애고 "편집(이름 변경)"만 남긴다. 아이콘 제거, 색으로만 구별.
//   "예산 초과 시 알림" 삭제. "알림음" → "그룹원 기록 확인 알림"으로 대체.
// 2026-09-17 팀 결정(2차, 이 파일의 현재 버전): "카테고리 추가"를 다시 만들되 "카테고리 편집" 모드에서만
//   보이게 한다. 그리고 "개인 카테고리"와 "그룹 카테고리"를 차별화한다 — 6(지출 입력)의 "어느 그룹과
//   공유할까요?"와 짝을 맞춰, 그룹마다 서로 다른 카테고리 목록을 따로 관리한다(store.getCategoriesForScope).
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import type { CategoryScope } from "@/lib/categories";
import { getGroupsForUser } from "@/lib/selectors";
import { BellIcon, ChevronLeftIcon, MoonIcon, MoreHorizontalIcon, PlusIcon, ThreeLinesIcon } from "../icons";

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

  // 2026-09-17 팀 결정: 개인/그룹마다 카테고리 목록이 다르므로, 지금 편집 중인 scope를 select로 고른다.
  const [scope, setScope] = useState<CategoryScope>({ kind: "personal" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");

  const categories = store.getCategoriesForScope(scope);

  function resetRowEditing() {
    setRenamingId(null);
    setRenameValue("");
    setShowAddInput(false);
    setNewCategoryLabel("");
  }

  function startRename(id: string, currentLabel: string) {
    setRenamingId(id);
    setRenameValue(currentLabel);
  }

  function confirmRename() {
    if (renamingId) store.renameCategoryInScope(scope, renamingId, renameValue);
    setRenamingId(null);
    setRenameValue("");
  }

  function confirmAddCategory() {
    if (newCategoryLabel.trim().length === 0) return;
    store.addCategoryInScope(scope, newCategoryLabel);
    setNewCategoryLabel("");
    setShowAddInput(false);
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)" }}>설정</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 20px" }}>
        <div
          onClick={() => setMenuOpen((v) => !v)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "14px 0 8px", cursor: "pointer" }}
        >
          {/* 2026-09-19 팀 요청: "카테고리" 눌러도 반응이 없었다 — 줄 전체(라벨 포함)를 눌러도
              오른쪽 3줄 버튼과 똑같이 편집 메뉴가 열리도록 클릭 영역을 넓혔다. */}
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--shoot-text-muted)" }}>카테고리</div>
          {/* 2026-09-17 팀 결정: "3개짜리 줄" 버튼 → "카테고리 편집" 메뉴 → 각 칸 "..."로 이름 변경 + 추가 버튼. */}
          <div style={{ position: "relative" }}>
            <div
              style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <ThreeLinesIcon size={17} color="var(--shoot-text-muted)" />
            </div>
            {menuOpen && (
              <div
                onClick={(e) => {
                  // 이 항목이 바깥 줄(카테고리 라벨 전체) 안에 있어서, stopPropagation 없이는 클릭이
                  // 버블링돼 바깥 onClick(메뉴 토글)이 또 실행되어 메뉴가 다시 열려버린다.
                  e.stopPropagation();
                  setEditMode((v) => !v);
                  setMenuOpen(false);
                  resetRowEditing();
                }}
                style={{
                  position: "absolute",
                  top: 32,
                  right: 0,
                  background: "var(--shoot-surface)",
                  border: "1px solid var(--shoot-border)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--shoot-text)",
                  whiteSpace: "nowrap",
                  boxShadow: "0 8px 20px rgba(45,42,62,0.12)",
                  cursor: "pointer",
                  zIndex: 10,
                }}
              >
                {editMode ? "편집 완료" : "카테고리 편집"}
              </div>
            )}
          </div>
        </div>

        {/* 2026-09-17 팀 결정(개인·그룹 카테고리 차별화): 어느 카테고리 목록을 보고/고칠지 먼저 고른다 —
            6(지출 입력)의 "어느 그룹과 공유할까요?"와 같은 구분(개인 vs 그룹별)을 그대로 따른다. */}
        <select
          value={scopeToValue(scope)}
          onChange={(e) => {
            setScope(valueToScope(e.target.value));
            resetRowEditing();
          }}
          style={{ width: "100%", boxSizing: "border-box", height: 40, borderRadius: 12, border: "1.5px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 12px", fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}
        >
          <option value={PERSONAL_VALUE}>개인 카테고리</option>
          {myGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} 카테고리
            </option>
          ))}
        </select>

        <div style={{ background: "var(--shoot-surface)", borderRadius: 16, border: "1px solid var(--shoot-border)", overflow: "hidden" }}>
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              // 2026-09-19 팀 요청: 편집 모드가 아닐 땐 카테고리를 누르면 그 카테고리로 필터링된
              // 지출 목록(7)이 뜬다 — 편집 모드에선 원래대로 "..."로 이름만 바꾼다.
              onClick={!editMode ? () => nav.push({ id: "categoryExpenses", category: cat.label }) : undefined}
              style={{
                padding: "13px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderBottom: idx < categories.length - 1 ? "1px solid var(--shoot-divider)" : "none",
                cursor: !editMode ? "pointer" : "default",
              }}
            >
              {/* 2026-09-17 팀 결정: 아이콘 제거, 색으로만 구별(칠해진 원). */}
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: cat.ink, flexShrink: 0 }} />
              {renamingId === cat.id ? (
                <input
                  type="text"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmRename();
                  }}
                  style={{ flex: 1, boxSizing: "border-box", height: 32, borderRadius: 8, border: "2px solid var(--shoot-accent)", background: "var(--shoot-surface)", padding: "0 10px", fontSize: 13, fontWeight: 700, color: "var(--shoot-text)" }}
                />
              ) : (
                <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "var(--shoot-text)" }}>{cat.label}</div>
              )}
              {editMode &&
                (renamingId === cat.id ? (
                  <div onClick={confirmRename} style={{ fontSize: 12, fontWeight: 800, color: "var(--shoot-accent)", cursor: "pointer", flexShrink: 0, padding: "4px 8px" }}>
                    완료
                  </div>
                ) : (
                  <div onClick={() => startRename(cat.id, cat.label)} style={{ cursor: "pointer", display: "flex", flexShrink: 0, padding: "4px 6px" }}>
                    <MoreHorizontalIcon size={17} color="var(--shoot-text-muted)" />
                  </div>
                ))}
            </div>
          ))}
        </div>

        {/* 2026-09-17 팀 결정: "카테고리 추가"는 편집 모드에서만 보인다 — 지금 고른 scope(개인 또는 그 그룹)에 더해진다. */}
        {editMode &&
          (showAddInput ? (
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <input
                type="text"
                autoFocus
                placeholder="카테고리 이름"
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmAddCategory();
                }}
                style={{ flex: 1, boxSizing: "border-box", height: 44, borderRadius: 14, border: "2px solid var(--shoot-accent)", background: "var(--shoot-surface)", padding: "0 14px", fontSize: 13, fontWeight: 600, color: "var(--shoot-text)" }}
              />
              <div
                onClick={confirmAddCategory}
                style={{ height: 44, padding: "0 16px", borderRadius: 14, background: "var(--shoot-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
              >
                추가
              </div>
            </div>
          ) : (
            <div
              onClick={() => setShowAddInput(true)}
              style={{ marginTop: 10, height: 44, borderRadius: 14, border: "1.5px dashed #C7BFB2", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}
            >
              <PlusIcon size={15} color="var(--shoot-text-muted)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text-muted)" }}>카테고리 추가</span>
            </div>
          ))}

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
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--shoot-text-muted)", margin: "22px 0 8px" }}>앱 외형</div>
        <div style={{ background: "var(--shoot-surface)", borderRadius: 16, border: "1px solid var(--shoot-border)", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MoonIcon size={17} color="var(--shoot-text-muted)" />
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "var(--shoot-text)" }}>다크 모드</div>
            <Toggle on={store.darkMode} onClick={() => store.toggleDarkMode()} />
          </div>
        </div>
      </div>
    </div>
  );
}
