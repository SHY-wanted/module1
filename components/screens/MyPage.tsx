"use client";
// components/screens/MyPage.tsx — 10. 마이페이지(design/shoot/MyPage.dc.html)
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { initialOf } from "@/lib/format";
import { getPersonalPet } from "@/lib/selectors";
import { MAX_STAGE_INDEX } from "@/lib/pets";
import PetMascot from "../PetMascot";
import { ChevronRightIcon, FlagIcon, GearIcon, UsersIcon } from "../icons";

export default function MyPage() {
  const nav = useNav();
  const store = useStore();
  const me = store.profiles.find((p) => p.id === store.currentUserId);
  const fullName = me?.name ?? "";
  const givenName = fullName;
  // 저금통 펫 키우기(docs/08-pet-feature-spec.md §7, 2026-09-15 신규) — 펫이 아직 없으면 만들러 보낸다.
  const personalPet = getPersonalPet(store.pets, store.currentUserId);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 20px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--shoot-text)" }}>마이페이지</div>
          {/* 07-screens.md "10 톱니바퀴 → 2c" — 2026-09-11 팀 결정. */}
          <div
            onClick={() => nav.push({ id: "settings" })}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--shoot-surface)", border: "1px solid var(--shoot-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
          >
            <GearIcon size={17} color="var(--shoot-text-muted)" />
          </div>
        </div>

        {/* 07-screens.md "10 프로필 카드 → 10b(내 정보 변경)" — 2026-09-17 팀 요청으로 신규. */}
        <div
          onClick={() => nav.push({ id: "myInfoEdit" })}
          style={{ marginTop: 18, background: "var(--shoot-surface)", borderRadius: 20, padding: 20, display: "flex", alignItems: "center", gap: 14, border: "1px solid var(--shoot-border)", cursor: "pointer" }}
        >
          {store.currentUserAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL은 next/image 대상이 아니다.
            <img src={store.currentUserAvatarUrl} alt="프로필 사진" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--shoot-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "var(--shoot-accent)", flexShrink: 0 }}>
              {initialOf(fullName)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--shoot-text)" }}>{givenName}</div>
            {/* 06-data.md E1 — profiles 테이블엔 email 컬럼이 없다(auth.users.email을 그대로 참조) — 대신
                store.currentUserEmail(실제 Supabase Auth 세션의 session.user.email)을 그대로 보여준다. */}
            <div style={{ fontSize: 13, color: "var(--shoot-text-muted)", fontWeight: 600, marginTop: 2 }}>{store.currentUserEmail}</div>
          </div>
          <ChevronRightIcon size={16} color="#A9A2B8" />
        </div>

        {/* 2026-09-18 재수정: 한 박스 안에 두 행을 욱여넣던 방식(구분선으로 나눔)이 화면에 따라
            칸 높이가 안 맞거나 잘려 보이는 문제가 있었다 — 아래 다른 카드들(저금통 코인·나의 배지·
            개인 랭킹)과 똑같이 각자 독립된 카드 + 여백으로 바꿔서 항상 같은 크기로 나오게 했다. */}
        {/* 07-screens.md "10 '내 그룹 관리' → 10a" — 2026-09-11 팀 결정. */}
        <div
          onClick={() => nav.push({ id: "myGroupsManage" })}
          style={{ marginTop: 16, background: "var(--shoot-surface)", borderRadius: 20, border: "1px solid var(--shoot-border)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--shoot-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UsersIcon size={16} color="var(--shoot-accent)" />
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: "var(--shoot-text)" }}>내 그룹 관리</div>
          <ChevronRightIcon size={16} color="#A9A2B8" />
        </div>
        {/* 2026-09-20 팀 요청(신규): 월별 목표 설정 — 2b(홈) 목표 카드와 같은 화면으로 push. */}
        <div
          onClick={() => nav.push({ id: "monthlyGoalSetting" })}
          style={{ marginTop: 10, background: "var(--shoot-surface)", borderRadius: 20, border: "1px solid var(--shoot-border)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--shoot-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FlagIcon size={16} color="var(--shoot-accent)" />
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: "var(--shoot-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>월별 목표 설정</div>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "var(--shoot-accent)", borderRadius: 999, padding: "2px 8px", marginRight: 6, flexShrink: 0 }}>NEW</span>
          <ChevronRightIcon size={16} color="#A9A2B8" style={{ flexShrink: 0 }} />
        </div>

        {/* §7 "저금통 코인 카드"·"나의 배지 카드"(디자인 파일 없음, 2026-09-15 신규 구현) */}
        <div
          onClick={() => nav.push(personalPet ? { id: "petDetail", scope: { kind: "personal" } } : { id: "petSelect", scope: { kind: "personal" } })}
          style={{ marginTop: 16, background: "var(--shoot-surface)", borderRadius: 20, padding: 18, display: "flex", alignItems: "center", gap: 14, border: "1px solid var(--shoot-border)", cursor: "pointer" }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--shoot-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            {personalPet ? <PetMascot pet={personalPet} size={38} /> : <span style={{ fontSize: 22 }}>🐣</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text-muted)" }}>저금통 코인</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)", marginTop: 2 }}>
              {personalPet ? `🪙 ${personalPet.total_coins.toLocaleString("ko-KR")}` : "펫 만들러 가기"}
            </div>
          </div>
          <ChevronRightIcon size={16} color="#A9A2B8" />
        </div>

        <div
          onClick={() => nav.push({ id: "myBadges" })}
          style={{ marginTop: 10, background: "var(--shoot-surface)", borderRadius: 20, padding: 18, display: "flex", alignItems: "center", gap: 14, border: "1px solid var(--shoot-border)", cursor: "pointer" }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--shoot-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            🏅
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text-muted)" }}>나의 배지</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)", marginTop: 2 }}>{personalPet?.stage_index ?? 0} / {MAX_STAGE_INDEX}</div>
          </div>
          <ChevronRightIcon size={16} color="#A9A2B8" />
        </div>

        {/* 개인 랭킹(2026-09-17 신규) — "개인 = 경쟁/랭킹" 지침. 그룹 데이터와는 무관, 개인 펫끼리만 비교한다. */}
        <div
          onClick={() => nav.push({ id: "personalRanking" })}
          style={{ marginTop: 10, background: "var(--shoot-surface)", borderRadius: 20, padding: 18, display: "flex", alignItems: "center", gap: 14, border: "1px solid var(--shoot-border)", cursor: "pointer" }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--shoot-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            🏆
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text-muted)" }}>개인 랭킹</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)", marginTop: 2 }}>다른 사용자와 순위 겨루기</div>
          </div>
          <ChevronRightIcon size={16} color="#A9A2B8" />
        </div>

        <div style={{ flex: 1 }} />

        <div
          onClick={async () => {
            // 07-screens.md "10 로그아웃 → isLoggedIn=false, 2(로그인 입력)로 이동, 스택 비움" — 2026-09-11
            // 팀 결정. 2026-09-18: 실제 supabase.auth.signOut()으로 세션을 지운다.
            await store.signOut();
            nav.logout();
          }}
          style={{ marginTop: 20, height: 48, borderRadius: 16, background: "var(--shoot-surface)", border: "1.5px solid #E8B4B4", color: "#B23B3B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
        >
          로그아웃
        </div>
      </div>
    </div>
  );
}
