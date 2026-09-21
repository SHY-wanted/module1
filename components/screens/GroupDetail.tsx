"use client";
// components/screens/GroupDetail.tsx — 5b. 그룹 상세(피드)(design/shoot/GroupDetail.dc.html)
// GroupList(5a)에서 어떤 그룹 카드를 탭했는지(groupId)를 스택 항목에 담아 그 그룹의 데이터를 조회한다.
import { useMemo, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getGroupMembersWithProfile, getGroupFeed, getGroupPet, getGroupCategorySpent } from "@/lib/selectors";
import { GROUP_TYPE_VISUAL } from "@/lib/groupTypeVisual";
import { formatRelativeTime, formatSignedWon, formatWon, initialOf } from "@/lib/format";
import { getCategoryVisual } from "@/lib/categories";
import { REACTION_EMOJI_PALETTE, currentMonthString } from "@/lib/pets";
import { TODAY_DATE } from "@/lib/mock";
import PetMascot from "../PetMascot";
import { ChevronLeftIcon, ChevronRightIcon, ShareIcon, UsersIcon } from "../icons";
import { typeIconFor } from "./groupIcon";

const AVATAR_PALETTE = ["#FFF0F6", "#F0EEFF", "#E8F9F7", "#FFFBE8", "#EBF5FF"];

export default function GroupDetail({ groupId }: { groupId: string }) {
  const nav = useNav();
  const store = useStore();
  const [panelOpen, setPanelOpen] = useState(false);
  // F23 이모지 반응(hybranch, 2026-09-15 추가) — 어느 지출 카드에 이모지 피커가 열려있는지.
  const [reactingExpenseId, setReactingExpenseId] = useState<string | null>(null);
  const group = store.groups.find((g) => g.id === groupId);
  const members = getGroupMembersWithProfile(store.groupMembers, store.profiles, groupId);
  const feed = getGroupFeed(store.expenses, store.savings, groupId);

  // 신규 기능: 그룹 피드 카테고리·기간 필터 — 개인 지출 목록(7)에는 있었는데 그룹 피드엔 없었다.
  // "저금"은 카테고리가 없어 별도 카테고리처럼 취급한다(피드 카드에 표시되는 그대로).
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const categoryOptions = useMemo(() => {
    const set = new Set(feed.map((f) => (f.kind === "saving" ? "저금" : f.data.category)));
    return Array.from(set);
  }, [feed]);
  const filteredFeed = useMemo(() => {
    return feed.filter((f) => {
      const category = f.kind === "saving" ? "저금" : f.data.category;
      if (categoryFilter !== "all" && category !== categoryFilter) return false;
      if (startDate && f.data.date < startDate) return false;
      if (endDate && f.data.date > endDate) return false;
      return true;
    });
  }, [feed, categoryFilter, startDate, endDate]);
  // 저금통 펫 키우기(docs/08-pet-feature-spec.md §1, 2026-09-15 신규) — 그룹 펫(그룹원이 함께 키움).
  // P6(그룹 랭킹)은 그룹 펫 XP 산정 방식이 팀 미정이라 뺐다(07-screens.md 참고) — 여기선 펫 카드만.
  const groupPet = getGroupPet(store.pets, groupId);

  // 신규 기능: 그룹원별 이번 달 지출 비교표 — 정산(더치페이) 자동계산 대신, "누가 얼마나 썼는지"만
  // 나란히 보여준다(04-features.md에 이미 언급된 절충안). 공유(is_shared) 지출만 센다 — 개인 지출은
  // 애초에 이 그룹과 무관하다.
  const CURRENT_MONTH = TODAY_DATE.slice(0, 7);
  const memberSpendTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of store.expenses) {
      if (e.group_id === groupId && e.is_shared && e.date.startsWith(CURRENT_MONTH)) {
        totals.set(e.user_id, (totals.get(e.user_id) ?? 0) + e.amount);
      }
    }
    return members
      .map((m) => ({ userId: m.user_id, name: m.profile?.name ?? "?", amount: totals.get(m.user_id) ?? 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [members, store.expenses, groupId, CURRENT_MONTH]);
  const maxMemberSpend = Math.max(1, ...memberSpendTotals.map((m) => m.amount));

  if (!group) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--shoot-text-muted)" }}>
        그룹을 찾을 수 없어요.
      </div>
    );
  }

  const visual = GROUP_TYPE_VISUAL[group.group_type];

  // 신규 기능: 그룹 예산(그룹장만 정함). 이번 달에 정해둔 카테고리별 예산들의 합과, 그 카테고리들의
  // 실제 지출 합을 카드 하나로 보여준다(요약이라 카테고리별 상세는 그룹 예산 설정 화면에서 확인).
  const isOwner = members.some((m) => m.user_id === store.currentUserId && m.role === "OWNER");
  const goalMonth = currentMonthString(TODAY_DATE);
  const monthGroupGoals = store.groupCategoryGoals.filter((g) => g.group_id === groupId && g.month === goalMonth);
  const groupGoalTotal = monthGroupGoals.reduce((sum, g) => sum + g.goal_amount, 0);
  const groupGoalSpent = monthGroupGoals.reduce((sum, g) => sum + getGroupCategorySpent(store.expenses, groupId, g.category, goalMonth), 0);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 20px", background: "var(--shoot-surface-alt)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 2026-09-14 팀 결정: 뒤로가기 버튼 추가 — 5a(그룹 목록)로 pop. */}
          <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex", flexShrink: 0 }}>
            <ChevronLeftIcon size={18} color="var(--shoot-text)" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: visual.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {typeIconFor(group.group_type, 22, "#fff")}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: "var(--shoot-text)" }}>{group.name}</div>
              {/* visual.light은 그룹 유형 고유의 고정 파스텛이라 다크모드에서도 안 바뀐다 — visual.ink(고정
                  진한 색) 글자와 짝이 맞아야 하므로, 페이지를 따라 바뀌는 surface 대신 이걸 쓴다. */}
              <span style={{ fontSize: 11, fontWeight: 800, color: visual.ink, background: visual.light, padding: "3px 10px", borderRadius: 10 }}>{visual.label}</span>
            </div>
          </div>
          <div
            onClick={() => setPanelOpen((v) => !v)}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--shoot-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
          >
            <UsersIcon size={18} color="var(--shoot-accent)" />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
        {panelOpen && (
          <>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text-muted)", marginBottom: 10 }}>멤버 목록</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {members.map((m, idx) => {
                const name = m.profile?.name ?? "알 수 없음";
                const isMe = m.user_id === store.currentUserId;
                const roleLabel = isMe ? "나" : m.nickname ?? "멤버";
                return (
                  <div key={m.id} style={{ background: "var(--shoot-surface)", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(45,42,62,0.05)" }}>
                    {/* 아바타 배경(AVATAR_PALETTE)은 다크모드에서도 안 바뀌는 고정 파스텔이라, 글자색도 늘
                        고정된 어두운 색이어야 한다(var(--shoot-text)를 쓰면 다크모드에서 흰 글씨가 되어 안 보인다). */}
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: AVATAR_PALETTE[idx % AVATAR_PALETTE.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#2D2A3E" }}>
                      {initialOf(name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--shoot-text)" }}>{name}</div>
                      <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", fontWeight: 600 }}>{roleLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 18, background: "#F5F3FF", border: "2px dashed rgba(106,94,207,0.35)", borderRadius: 18, padding: 16, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)" }}>초대 코드</div>
                <div
                  onClick={async () => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      await navigator.clipboard.writeText(group.invite_code);
                    }
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 800, color: "#4B3F94", background: "var(--shoot-surface)", padding: "5px 12px", borderRadius: 8, cursor: "pointer" }}
                >
                  <ShareIcon size={12} color="#4B3F94" />
                  공유
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--shoot-text)", letterSpacing: 4, fontFamily: "'Courier New',monospace" }}>{group.invite_code}</div>
            </div>
          </>
        )}

        {/* §1 "그룹 펫"(디자인 파일 없음, 2026-09-15 신규) — 그룹원이 함께 키우는 펫 1마리. */}
        <div
          onClick={() =>
            nav.push(groupPet ? { id: "petDetail", scope: { kind: "group", groupId } } : { id: "petSelect", scope: { kind: "group", groupId } })
          }
          style={{ background: "var(--shoot-surface)", borderRadius: 16, border: "1px solid var(--shoot-border)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 18 }}
        >
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--shoot-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            {groupPet ? <PetMascot pet={groupPet} size={34} /> : <span style={{ fontSize: 18 }}>🐣</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text)" }}>그룹 저금통 펫</div>
            <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", fontWeight: 600, marginTop: 2 }}>
              {groupPet ? `${groupPet.pet_name?.trim() || "우리 펫"} · ${groupPet.stage_index}단계` : "아직 없어요 — 함께 데려와요"}
            </div>
          </div>
          <ChevronRightIcon size={16} color="#A9A2B8" />
        </div>

        {/* 신규 기능: 그룹 예산 요약 카드 — 그룹장은 설정 화면으로, 멤버는 확인만(읽기 전용 화면으로 이동). */}
        {(monthGroupGoals.length > 0 || isOwner) && (
          <div
            onClick={() => nav.push({ id: "groupGoalSetting", groupId })}
            style={{ background: "var(--shoot-surface)", borderRadius: 16, border: "1px solid var(--shoot-border)", padding: "14px 16px", cursor: "pointer", marginBottom: 18 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text)" }}>이번 달 그룹 예산</div>
                {monthGroupGoals.length === 0 ? (
                  <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", fontWeight: 600, marginTop: 2 }}>아직 없어요 — 그룹장이 정할 수 있어요</div>
                ) : (
                  <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", fontWeight: 600, marginTop: 2 }}>
                    {formatWon(groupGoalSpent)} / {formatWon(groupGoalTotal)}
                  </div>
                )}
              </div>
              <ChevronRightIcon size={16} color="#A9A2B8" />
            </div>
            {monthGroupGoals.length > 0 && (
              <div style={{ marginTop: 10, height: 8, borderRadius: 4, background: "var(--shoot-surface-alt)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.round((groupGoalSpent / Math.max(groupGoalTotal, 1)) * 100))}%`,
                    height: "100%",
                    background: groupGoalSpent > groupGoalTotal ? "#B23B3B" : "var(--shoot-accent)",
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* 신규 기능: 정산(더치페이) 자동계산 대신 "누가 얼마나 썼는지"만 나란히 보여준다. */}
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text-muted)", marginBottom: 10 }}>이번 달 그룹원별 지출</div>
        <div style={{ background: "var(--shoot-surface)", borderRadius: 16, border: "1px solid var(--shoot-border)", padding: "14px 16px", marginBottom: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          {memberSpendTotals.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", fontWeight: 600 }}>아직 그룹원이 없어요</div>
          ) : (
            memberSpendTotals.map((m) => (
              <div key={m.userId}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 4 }}>
                  <span>{m.name}</span>
                  <span>{formatWon(m.amount)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: "var(--shoot-divider)" }}>
                  <div style={{ width: `${(m.amount / maxMemberSpend) * 100}%`, height: "100%", borderRadius: 4, background: visual.accent }} />
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text-muted)", marginBottom: 10 }}>지출·저금 피드</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: 40, borderRadius: 12, border: "1.5px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 12px", fontSize: 13, fontWeight: 700, color: "var(--shoot-text)" }}
          >
            <option value="all">전체 카테고리</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ flex: 1, boxSizing: "border-box", height: 40, borderRadius: 12, border: "1.5px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 10px", fontSize: 12, fontWeight: 600, color: "var(--shoot-text)" }}
            />
            <span style={{ fontSize: 12, color: "#A9A2B8", fontWeight: 700 }}>~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ flex: 1, boxSizing: "border-box", height: 40, borderRadius: 12, border: "1.5px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 10px", fontSize: 12, fontWeight: 600, color: "var(--shoot-text)" }}
            />
            {(categoryFilter !== "all" || startDate || endDate) && (
              <div
                onClick={() => {
                  setCategoryFilter("all");
                  setStartDate("");
                  setEndDate("");
                }}
                style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#B23B3B", cursor: "pointer", padding: "0 4px" }}
              >
                초기화
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredFeed.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--shoot-text-muted)", fontSize: 13, fontWeight: 600, padding: "12px 0" }}>이 필터에 맞는 항목이 없어요</div>
          )}
          {filteredFeed.map((f) => {
            const isSaving = f.kind === "saving";
            const authorName = store.profiles.find((p) => p.id === f.data.user_id)?.name ?? "?";
            const merchant = isSaving ? f.data.title ?? "저금" : f.data.memo ?? "지출";
            const category = isSaving ? "저금" : f.data.category;
            const visualCat = isSaving ? { light: "#E8F9F7", ink: "#1D7A69" } : getCategoryVisual(f.data.category);
            const key = `${f.kind}-${f.data.id}`;
            // F23 이모지 반응(hybranch) — 저금 카드엔 없고 지출 카드에만("그룹 피드 지출 카드" 스펙 그대로).
            const reactions = isSaving ? [] : store.expenseReactions.filter((r) => r.expense_id === f.data.id);
            const reactionCounts = new Map<string, number>();
            for (const r of reactions) reactionCounts.set(r.emoji, (reactionCounts.get(r.emoji) ?? 0) + 1);
            const myEmojis = new Set(reactions.filter((r) => r.user_id === store.currentUserId).map((r) => r.emoji));
            return (
              <div key={key} style={{ background: "var(--shoot-surface)", borderRadius: 16, padding: "12px 14px", boxShadow: "0 2px 8px rgba(45,42,62,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* visualCat.light도 고정 파스텔이라 글자색은 항상 어두운 고정색이어야 한다. */}
                  <div style={{ width: 34, height: 34, borderRadius: 12, background: visualCat.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#2D2A3E", flexShrink: 0 }}>
                    {initialOf(authorName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text)" }}>{merchant}</div>
                    <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", fontWeight: 600 }}>
                      {category} · {formatRelativeTime(f.data.created_at)}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: isSaving ? "#1D7A69" : "#B23B3B" }}>{formatSignedWon(f.data.amount, isSaving)}</div>
                </div>

                {!isSaving && (
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 10 }}>
                    {Array.from(reactionCounts.entries()).map(([emoji, count]) => {
                      const mine = myEmojis.has(emoji);
                      return (
                        <div
                          key={emoji}
                          onClick={() => (mine ? store.removeReaction(f.data.id, emoji) : store.addReaction(f.data.id, emoji))}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: 12,
                            background: mine ? "var(--shoot-surface-alt)" : "var(--shoot-divider)",
                            border: mine ? "1.5px solid var(--shoot-accent)" : "1.5px solid transparent",
                            color: "var(--shoot-text)",
                            cursor: "pointer",
                          }}
                        >
                          {emoji} {count}
                        </div>
                      );
                    })}
                    <div
                      onClick={() => setReactingExpenseId((cur) => (cur === f.data.id ? null : f.data.id))}
                      style={{ fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 12, border: "1.5px dashed var(--shoot-border)", color: "var(--shoot-text-muted)", cursor: "pointer" }}
                    >
                      + 반응
                    </div>
                  </div>
                )}

                {reactingExpenseId === f.data.id && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, padding: 8, background: "var(--shoot-surface-alt)", borderRadius: 12 }}>
                    {REACTION_EMOJI_PALETTE.map((emoji) => (
                      <div
                        key={emoji}
                        onClick={() => {
                          store.addReaction(f.data.id, emoji);
                          setReactingExpenseId(null);
                        }}
                        style={{ fontSize: 16, cursor: "pointer", padding: 2 }}
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {feed.length === 0 && <div style={{ textAlign: "center", color: "var(--shoot-text-muted)", fontSize: 13, fontWeight: 600, padding: "20px 0" }}>아직 지출·저금 기록이 없어요</div>}
        </div>
      </div>
    </div>
  );
}
