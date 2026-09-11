"use client";
// components/screens/MyPage.tsx — 10. 마이페이지(design/shoot/MyPage.dc.html)
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { initialOf, stripSurname } from "@/lib/format";
import { ChevronRightIcon, GearIcon, UsersIcon } from "../icons";

export default function MyPage() {
  const nav = useNav();
  const store = useStore();
  const me = store.profiles.find((p) => p.id === store.currentUserId);
  const fullName = me?.name ?? "";
  const givenName = stripSurname(fullName);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 20px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#2D2A3E" }}>마이페이지</div>
          {/* 07-screens.md "10 톱니바퀴 → 2c" — 2026-09-11 팀 결정. */}
          <div
            onClick={() => nav.push({ id: "settings" })}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "1px solid #E8E4F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
          >
            <GearIcon size={17} color="#6B6980" />
          </div>
        </div>

        <div style={{ marginTop: 18, background: "#fff", borderRadius: 20, padding: 20, display: "flex", alignItems: "center", gap: 14, border: "1px solid #E8E4F4" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F0EEFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#6A5ECF", flexShrink: 0 }}>
            {initialOf(fullName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#2D2A3E" }}>{givenName}</div>
            {/* TODO: [?] 06-data.md E1 — profiles 테이블엔 email 컬럼이 없다(auth.users.email 참조 예정).
                Supabase Auth 연동 전이라 실제 값이 없어, 디자인과 동일한 형태의 자리표시 텍스트만 보여준다. */}
            <div style={{ fontSize: 13, color: "#6B6980", fontWeight: 600, marginTop: 2 }}>seoyeon@email.com</div>
          </div>
        </div>

        <div style={{ marginTop: 16, background: "#fff", borderRadius: 20, border: "1px solid #E8E4F4", overflow: "hidden" }}>
          {/* 07-screens.md "10 '내 그룹 관리' → 10a" — 2026-09-11 팀 결정. */}
          <div onClick={() => nav.push({ id: "myGroupsManage" })} style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#F0EEFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <UsersIcon size={16} color="#6A5ECF" />
            </div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 800, color: "#2D2A3E" }}>내 그룹 관리</div>
            <ChevronRightIcon size={16} color="#A9A2B8" />
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div
          onClick={() => {
            // 07-screens.md "10 로그아웃 → isLoggedIn=false, 2(로그인 입력)로 이동, 스택 비움" — 2026-09-11 팀 결정.
            store.setLoggedIn(false);
            nav.logout();
          }}
          style={{ height: 48, borderRadius: 16, background: "#fff", border: "1.5px solid #E8B4B4", color: "#B23B3B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
        >
          로그아웃
        </div>
      </div>
    </div>
  );
}
