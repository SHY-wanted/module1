"use client";
// components/screens/MyPage.tsx — 10. 마이페이지(design/shoot/MyPage.dc.html)
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { initialOf, stripSurname } from "@/lib/format";
import { getPersonalPet } from "@/lib/selectors";
import { MAX_STAGE_INDEX, PET_SPECIES_META } from "@/lib/pets";
import { ChevronRightIcon, GearIcon, UsersIcon } from "../icons";

export default function MyPage() {
  const nav = useNav();
  const store = useStore();
  const me = store.profiles.find((p) => p.id === store.currentUserId);
  const fullName = me?.name ?? "";
  const givenName = stripSurname(fullName);
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

        <div style={{ marginTop: 16, background: "var(--shoot-surface)", borderRadius: 20, border: "1px solid var(--shoot-border)", overflow: "hidden" }}>
          {/* 07-screens.md "10 '내 그룹 관리' → 10a" — 2026-09-11 팀 결정. */}
          <div onClick={() => nav.push({ id: "myGroupsManage" })} style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--shoot-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <UsersIcon size={16} color="var(--shoot-accent)" />
            </div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 800, color: "var(--shoot-text)" }}>내 그룹 관리</div>
            <ChevronRightIcon size={16} color="#A9A2B8" />
          </div>
        </div>

        {/* §7 "저금통 코인 카드"·"나의 배지 카드"(디자인 파일 없음, 2026-09-15 신규 구현) */}
        <div
          onClick={() => nav.push(personalPet ? { id: "petDetail", scope: { kind: "personal" } } : { id: "petSelect", scope: { kind: "personal" } })}
          style={{ marginTop: 16, background: "var(--shoot-surface)", borderRadius: 20, padding: 18, display: "flex", alignItems: "center", gap: 14, border: "1px solid var(--shoot-border)", cursor: "pointer" }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--shoot-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            {personalPet ? PET_SPECIES_META[personalPet.species].emoji : "🐣"}
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

        <div style={{ flex: 1 }} />

        <div
          onClick={async () => {
            // 07-screens.md "10 로그아웃 → isLoggedIn=false, 2(로그인 입력)로 이동, 스택 비움" — 2026-09-11
            // 팀 결정. 2026-09-18: 실제 supabase.auth.signOut()으로 세션을 지운다.
            await store.signOut();
            nav.logout();
          }}
          style={{ height: 48, borderRadius: 16, background: "var(--shoot-surface)", border: "1.5px solid #E8B4B4", color: "#B23B3B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
        >
          로그아웃
        </div>
      </div>
    </div>
  );
}
