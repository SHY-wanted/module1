"use client";
// components/screens/ExpenseList.tsx — 7. 지출 목록(design/shoot/ExpenseList.dc.html)
// "확인 필요"는 별도 boolean이 아니라 category==='확인 필요'로 판정한다(05-policy.md P7 방식, 06-data.md E4 [?] 채택).
import { useEffect, useMemo, useRef, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getOwnExpenses, groupExpensesByMonth } from "@/lib/selectors";
import { getCategoryVisual } from "@/lib/categories";
import { formatRelativeTime, formatWon } from "@/lib/format";
import { CategoryIcon, ChevronLeftIcon, PlusIcon, TrashIcon } from "../icons";
import type { CategoryIconKey } from "../icons";
import ImageLightbox from "../ImageLightbox";

const UNDO_WINDOW_MS = 5000;

// 2026-09-19 팀 요청: 2c(설정) "카테고리" 항목을 누르면 그 카테고리로 미리 필터링된 이 화면을
// 스택에 쌓아 보여준다 — 지출내역 탭(7)과 완전히 같은 화면을 재사용하되, initialCategoryFilter로
// 시작 필터를 지정하고 pushed일 땐 뒤로가기가 탭 전환이 아니라 스택 pop(nav.back())이 되게 한다.
export default function ExpenseList({ initialCategoryFilter, pushed }: { initialCategoryFilter?: string; pushed?: boolean } = {}) {
  const nav = useNav();
  const store = useStore();

  // 7 "카테고리·기간 필터 UI"(신규, 2026-09-11 팀 결정 — 04-features.md F6 입력 "category, startDate, endDate" 참고).
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryFilter ?? "all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  // 신규 기능: 메모 검색 — 카테고리·기간 필터는 있는데 텍스트로 찾을 방법이 없었다.
  const [memoQuery, setMemoQuery] = useState<string>("");
  // 신규 기능: 정렬 — 지금까지는 날짜(최신순) 고정이었다. 월별로 묶는 기준(date)은 그대로 두고,
  // 각 달 안에서 보여주는 순서만 바꾼다.
  const [sortOrder, setSortOrder] = useState<"date_desc" | "amount_desc" | "amount_asc">("date_desc");
  // 2026-09-19 팀 요청: 삭제 버튼 — 바로 지우지 않고 확인 팝업을 한 번 띄운다(10a "그룹 나가기"와 같은 패턴).
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  // 신규 기능: 영수증 촬영으로 등록된 지출만(source_type === "RECEIPT") 원본 사진을 다시 볼 수 있다.
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  // 신규 기능: 실행 취소 — "삭제" 확인 후에도 UNDO_WINDOW_MS 동안은 실제로 지우지 않고 목록에서만
  // 숨긴다. 그 안에 "되돌리기"를 누르면 타이머를 지워서 아예 지워지지 않게 한다.
  // ponytail: 한 번에 하나만 취소 대기시킨다 — 5초 안에 두 번째 항목을 또 지우면 먼저 걸어둔 타이머는
  // (조용히 실행은 되지만) "되돌리기" 버튼으로 더는 못 취소한다. 여러 개를 동시에 취소 대기시켜야 할
  // 정도로 빠르게 연속 삭제하는 경우가 흔치 않아서, 큐로 만들진 않았다 — 필요해지면 Map으로 바꿀 것.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteTimerRef = useRef<number | null>(null);
  // pendingDeleteId를 state로만 들고 있으면, 마운트 시 한 번 등록되는 언마운트 클린업(아래 useEffect)이
  // 그 시점의 값(항상 처음 값인 null)만 기억한 채로 굳어버린다 — 실제로 대기 중인 id를 언마운트
  // 순간에도 읽을 수 있어야 해서 ref에도 같이 들고 있는다.
  const pendingDeleteIdRef = useRef<string | null>(null);

  // 버그 수정(2026-09-21): 삭제 확인 후 되돌리기 토스트가 떠 있는 채로 화면을 벗어나면(다른 탭으로
  // 전환·뒤로가기 등), 기존엔 타이머만 지우고 실제 삭제는 아무것도 안 일어나서 — 다시 들어오면 "분명
  // 지웠는데 그대로 남아있는" 유령 상태가 됐다. 화면을 뜰 때 대기 중인 삭제가 있으면 취소된 걸로 보지
  // 말고 그 자리에서 확정한다(실행 취소 창을 그냥 못 본 채 넘어간 것과 같은 취급).
  useEffect(() => {
    return () => {
      if (deleteTimerRef.current !== null) {
        window.clearTimeout(deleteTimerRef.current);
        deleteTimerRef.current = null;
        if (pendingDeleteIdRef.current) store.deleteExpense(pendingDeleteIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDeleteConfirmed() {
    if (!confirmingId) return;
    const id = confirmingId;
    setConfirmingId(null);
    setPendingDeleteId(id);
    pendingDeleteIdRef.current = id;
    deleteTimerRef.current = window.setTimeout(() => {
      store.deleteExpense(id);
      setPendingDeleteId(null);
      pendingDeleteIdRef.current = null;
      deleteTimerRef.current = null;
    }, UNDO_WINDOW_MS);
  }

  function handleUndoDelete() {
    if (deleteTimerRef.current !== null) window.clearTimeout(deleteTimerRef.current);
    deleteTimerRef.current = null;
    pendingDeleteIdRef.current = null;
    setPendingDeleteId(null);
  }

  const ownExpenses = getOwnExpenses(store.expenses, store.currentUserId).filter((e) => e.id !== pendingDeleteId);
  const categoryOptions = useMemo(() => {
    const set = new Set(ownExpenses.map((e) => e.category));
    return Array.from(set);
  }, [ownExpenses]);

  const filtered = useMemo(() => {
    const query = memoQuery.trim().toLowerCase();
    return ownExpenses.filter((e) => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      if (query && !(e.memo ?? "").toLowerCase().includes(query)) return false;
      return true;
    });
  }, [ownExpenses, categoryFilter, startDate, endDate, memoQuery]);

  const months = useMemo(() => {
    const grouped = groupExpensesByMonth(filtered);
    if (sortOrder === "date_desc") return grouped; // groupExpensesByMonth가 이미 최신순으로 묶어준다.
    return grouped.map((mo) => ({
      ...mo,
      items: mo.items.slice().sort((a, b) => (sortOrder === "amount_desc" ? b.amount - a.amount : a.amount - b.amount)),
    }));
  }, [filtered, sortOrder]);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* 2026-09-14 팀 결정: 탭 루트지만 뒤로가기 버튼을 두고, 누르면 홈(2b) 탭으로 전환한다.
              2026-09-19: 2c에서 카테고리별로 눌러서 스택에 쌓인 경우(pushed)는 탭 전환이 아니라
              그냥 스택 pop(nav.back())으로 2c에 돌아간다. */}
          <div onClick={() => (pushed ? nav.back() : nav.switchTab("home"))} style={{ cursor: "pointer", display: "flex", flexShrink: 0 }}>
            <ChevronLeftIcon size={18} color="var(--shoot-text)" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--shoot-text)", flex: 1 }}>지출 내역</div>
          {/* 07-screens.md "7 우상단 새 '+' 버튼(신규) → 6(신규 입력)" — 2026-09-11 팀 결정. */}
          <div
            onClick={() => nav.push({ id: "expenseInput" })}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--shoot-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
          >
            <PlusIcon size={17} color="#fff" strokeWidth={2.4} />
          </div>
        </div>

        {/* 카테고리·기간·메모 검색 필터 — lib/mock.ts의 expenses를 클라이언트 사이드에서 거른다. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          <input
            type="text"
            placeholder="메모로 검색 (예: 스타벅스)"
            value={memoQuery}
            onChange={(e) => setMemoQuery(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: 42, borderRadius: 12, border: "1.5px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 12px", fontSize: 13, fontWeight: 600, color: "var(--shoot-text)" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ flex: 1, boxSizing: "border-box", height: 42, borderRadius: 12, border: "1.5px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 12px", fontSize: 13, fontWeight: 700, color: "var(--shoot-text)" }}
            >
              <option value="all">전체 카테고리</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {/* 신규 기능: 정렬 옵션 — 기본은 날짜(최신순), 금액 큰/작은 순으로도 볼 수 있게. */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              style={{ flex: 1, boxSizing: "border-box", height: 42, borderRadius: 12, border: "1.5px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 12px", fontSize: 13, fontWeight: 700, color: "var(--shoot-text)" }}
            >
              <option value="date_desc">최신순</option>
              <option value="amount_desc">금액 큰 순</option>
              <option value="amount_asc">금액 작은 순</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ flex: 1, boxSizing: "border-box", height: 42, borderRadius: 12, border: "1.5px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 10px", fontSize: 12, fontWeight: 600, color: "var(--shoot-text)" }}
            />
            <span style={{ fontSize: 12, color: "#A9A2B8", fontWeight: 700 }}>~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ flex: 1, boxSizing: "border-box", height: 42, borderRadius: 12, border: "1.5px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 10px", fontSize: 12, fontWeight: 600, color: "var(--shoot-text)" }}
            />
            {(categoryFilter !== "all" || startDate || endDate || memoQuery) && (
              <div
                onClick={() => {
                  setCategoryFilter("all");
                  setStartDate("");
                  setEndDate("");
                  setMemoQuery("");
                }}
                style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#B23B3B", cursor: "pointer", padding: "0 4px" }}
              >
                초기화
              </div>
            )}
          </div>
        </div>

        {months.map((mo) => (
          <div key={mo.month} style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text-muted)", marginBottom: 8 }}>{mo.month}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {mo.items.map((it) => {
                const needsReview = it.category === "확인 필요";
                const visual = getCategoryVisual(it.category);
                const group = store.groups.find((g) => g.id === it.group_id);
                const groupLabel = it.group_id ? group?.name ?? "" : "공유 안 함";
                return (
                  <div
                    key={it.id}
                    // 07-screens.md "7 항목 탭 → 6을 수정 모드로 재사용" — 2026-09-11 팀 결정.
                    // P6·F14: 여기 보이는 항목은 전부 본인 지출(getOwnExpenses)이라 수정 권한 문제가 없다.
                    onClick={() => nav.push({ id: "expenseInput", expenseId: it.id })}
                    style={{
                      background: "var(--shoot-surface)",
                      borderRadius: 16,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      border: needsReview ? "2px solid rgba(245,168,130,0.6)" : "1px solid var(--shoot-border)",
                      boxShadow: needsReview ? "0 4px 14px rgba(245,168,130,0.2)" : "0 2px 8px rgba(45,42,62,0.05)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: visual.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CategoryIcon icon={visual.icon as CategoryIconKey} size={17} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--shoot-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{it.memo}</div>
                        {needsReview && (
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#A15A1E", background: "#FFF2EC", padding: "2px 7px", borderRadius: 8, border: "1px solid rgba(245,168,130,0.5)", whiteSpace: "nowrap", flexShrink: 0 }}>
                            확인 필요
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", marginTop: 2, fontWeight: 600 }}>
                        {it.category} · {groupLabel} · {formatRelativeTime(it.created_at)}
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--shoot-text)", whiteSpace: "nowrap" }}>{formatWon(it.amount)}</div>
                    {/* 신규 기능: 영수증 촬영 지출이면 원본 사진 썸네일 — 탭하면 확대(ImageLightbox), 행 클릭(수정 모드)과 안 겹치게 stopPropagation. */}
                    {it.source_type === "RECEIPT" && it.image_url && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxUrl(it.image_url);
                        }}
                        style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, overflow: "hidden", border: "1px solid var(--shoot-border)", cursor: "pointer" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- data URL은 next/image의 원격 최적화 대상이 아니다. */}
                        <img src={it.image_url} alt="영수증 썸네일" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                    {/* 2026-09-19 팀 요청: 삭제 버튼 — 행 클릭(수정 모드 진입)과 안 겹치게 stopPropagation. */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingId(it.id);
                      }}
                      style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <TrashIcon size={15} color="#A9A2B8" />
                    </div>
                  </div>
                );
              })}
              {mo.items.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--shoot-text-muted)", fontSize: 13, fontWeight: 600, padding: "12px 0" }}>이 필터에 맞는 지출이 없어요</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 2026-09-19 팀 요청: 바로 지우지 않고 확인 팝업을 한 번 띄운다(10a "그룹 나가기"와 같은 패턴). */}
      {confirmingId && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(45,42,62,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, zIndex: 20 }}>
          <div style={{ background: "var(--shoot-surface)", borderRadius: 20, padding: 22, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)" }}>이 지출을 삭제할까요?</div>
            <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", marginTop: 8, fontWeight: 600 }}>삭제하면 되돌릴 수 없어요</div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <div
                onClick={() => setConfirmingId(null)}
                style={{ flex: 1, height: 44, borderRadius: 14, border: "1.5px solid var(--shoot-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "var(--shoot-text)", cursor: "pointer" }}
              >
                취소
              </div>
              <div
                onClick={handleDeleteConfirmed}
                style={{ flex: 1, height: 44, borderRadius: 14, background: "#B23B3B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer" }}
              >
                삭제
              </div>
            </div>
          </div>
        </div>
      )}

      <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />

      {/* 신규 기능: 실행 취소 토스트 — UNDO_WINDOW_MS 동안만 떠 있는다(진행바로 남은 시간을 보여준다). */}
      {pendingDeleteId && (
        <div style={{ position: "absolute", left: 20, right: 20, bottom: 20, background: "var(--shoot-text)", borderRadius: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.25)", zIndex: 30, overflow: "hidden" }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--shoot-surface)" }}>지출을 삭제했어요</div>
          <div onClick={handleUndoDelete} style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-accent)", cursor: "pointer", flexShrink: 0 }}>
            되돌리기
          </div>
          <div style={{ position: "absolute", left: 0, bottom: 0, height: 3, background: "var(--shoot-accent)", animation: `shoot-undo-shrink ${UNDO_WINDOW_MS}ms linear forwards` }} />
        </div>
      )}
    </div>
  );
}
