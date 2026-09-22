// scripts/seed-instructor-accounts.mjs
// 강사 평가용 테스트 계정을 만든다(시연에 쓰는 실제 계정과 분리).
//
// 실행: node scripts/seed-instructor-accounts.mjs
// 삭제: node scripts/seed-instructor-accounts.mjs --delete
//
// .env.local의 SUPABASE_SERVICE_ROLE_KEY를 쓴다(RLS를 우회해 계정·그룹·지출을 심는다).
// 여러 번 실행해도 같은 결과가 되도록 만들었다 — 이미 있으면 건너뛰고, 없는 것만 채운다.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// .env.local 직접 파싱 — Next.js 밖에서 도는 스크립트라 자동 로딩이 없다.
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error(".env.local에 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 필요합니다");

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const PASSWORD = "test123"; // 강사 요청으로 통일(로그인 화면은 길이 검사를 하지 않는다 — 가입 화면의 8자 이상 규칙은 signUp에만 적용)
const GROUP_NAME = "강사 평가용 그룹";
const INVITE_CODE = "TEST01";

// 이 앱의 권한은 "그룹 안에서의 역할"만 있다(member_role: OWNER | MEMBER).
// 앱 전체를 관리하는 관리자 역할은 없다 — 아래 세 계정이 실제로 구분 가능한 전부다.
const ACCOUNTS = [
  { key: "owner", email: "test123@test.com", name: "팀장(그룹장)", role: "OWNER" },
  { key: "member", email: "test1234@test.com", name: "팀원(그룹원)", role: "MEMBER" },
  { key: "solo", email: "test12345@test.com", name: "일반 사용자", role: null }, // 그룹 미소속
];

const TODAY = new Date().toISOString().slice(0, 10);
const MONTH = TODAY.slice(0, 7);

async function findUserByEmail(email) {
  // listUsers는 페이지 단위라 넉넉히 훑는다(테스트 프로젝트라 사용자 수가 많지 않다).
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function remove() {
  const group = (await admin.from("groups").select("id").eq("invite_code", INVITE_CODE).maybeSingle()).data;
  if (group) {
    // group_members·group_category_goals는 cascade, expenses는 group_id가 null로 풀린다.
    await admin.from("expenses").delete().eq("group_id", group.id);
    await admin.from("groups").delete().eq("id", group.id);
    console.log("그룹 삭제:", GROUP_NAME);
  }
  for (const a of ACCOUNTS) {
    const user = await findUserByEmail(a.email);
    if (!user) { console.log("없음(건너뜀):", a.email); continue; }
    await admin.from("expenses").delete().eq("user_id", user.id);
    await admin.from("savings").delete().eq("user_id", user.id);
    await admin.auth.admin.deleteUser(user.id);
    console.log("계정 삭제:", a.email);
  }
}

async function seed() {
  const ids = {};

  for (const a of ACCOUNTS) {
    let user = await findUserByEmail(a.email);
    if (user) {
      // 비밀번호는 매번 맞춰준다 — 강사가 받은 비밀번호로 반드시 들어가져야 한다.
      await admin.auth.admin.updateUserById(user.id, { password: PASSWORD, email_confirm: true });
      console.log("이미 있음(비밀번호 재설정):", a.email);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: a.email,
        password: PASSWORD,
        email_confirm: true, // 확인 메일 없이 바로 로그인 가능하게
        user_metadata: { name: a.name },
      });
      if (error) throw new Error(`${a.email} 생성 실패: ${error.message}`);
      user = data.user;
      console.log("생성:", a.email);
    }
    ids[a.key] = user.id;
    // handle_new_user 트리거가 profiles를 만들지만, 이름이 이메일로 들어갔을 수 있어 맞춰준다.
    await admin.from("profiles").update({ name: a.name }).eq("id", user.id);
  }

  // 그룹 — 초대 코드로 찾아 이미 있으면 재사용한다.
  let group = (await admin.from("groups").select("*").eq("invite_code", INVITE_CODE).maybeSingle()).data;
  if (!group) {
    const { data, error } = await admin
      .from("groups")
      .insert({ name: GROUP_NAME, group_type: "FAMILY", invite_code: INVITE_CODE })
      .select()
      .single();
    if (error) throw new Error(`그룹 생성 실패: ${error.message}`);
    group = data;
    console.log("그룹 생성:", GROUP_NAME, "초대코드", INVITE_CODE);
  } else {
    console.log("그룹 이미 있음:", GROUP_NAME);
  }

  // 멤버십 — (user_id, group_id) 유니크라 upsert로 중복을 막는다.
  for (const a of ACCOUNTS.filter((x) => x.role)) {
    const { error } = await admin
      .from("group_members")
      .upsert({ group_id: group.id, user_id: ids[a.key], role: a.role }, { onConflict: "user_id,group_id" });
    if (error) throw new Error(`${a.email} 멤버십 실패: ${error.message}`);
  }
  console.log("멤버십: 그룹장 1명 + 그룹원 1명");

  // 지출 — 권한 차이를 눈으로 보려면 "남이 쓴 지출"이 있어야 한다(본인 것만 수정 가능, P6).
  const existing = (await admin.from("expenses").select("id").eq("group_id", group.id)).data ?? [];
  if (existing.length === 0) {
    const rows = [
      { user_id: ids.owner, group_id: group.id, amount: 42000, category: "식비", memo: "그룹장이 기록한 장보기", date: TODAY, is_shared: true },
      { user_id: ids.member, group_id: group.id, amount: 13500, category: "교통", memo: "그룹원이 기록한 택시비", date: TODAY, is_shared: true },
      { user_id: ids.member, group_id: group.id, amount: 8000, category: "기타", memo: "확인 필요 예시", date: TODAY, is_shared: true },
    ];
    const { error } = await admin.from("expenses").insert(rows);
    if (error) throw new Error(`지출 생성 실패: ${error.message}`);
    console.log("공유 지출 3건 생성(그룹장 1 · 그룹원 2)");
  } else {
    console.log("공유 지출 이미 있음:", existing.length, "건");
  }

  // 일반 사용자(그룹 미소속)에게도 개인 지출 하나 — 빈 화면만 보면 확인할 게 없다.
  const soloExisting = (await admin.from("expenses").select("id").eq("user_id", ids.solo)).data ?? [];
  if (soloExisting.length === 0) {
    await admin.from("expenses").insert({
      user_id: ids.solo, group_id: null, amount: 5600, category: "식비", memo: "개인 지출(그룹 없음)", date: TODAY, is_shared: false,
    });
    console.log("일반 사용자 개인 지출 1건 생성");
  }

  // 그룹 예산 — 그룹장만 만들 수 있는 것(P14). 그룹원으로 로그인하면 읽기 전용으로 보인다.
  const goalExisting = (await admin.from("group_category_goals").select("id").eq("group_id", group.id).eq("month", MONTH)).data ?? [];
  if (goalExisting.length === 0) {
    const { error } = await admin.from("group_category_goals").insert([
      { group_id: group.id, category: "식비", month: MONTH, goal_amount: 300000, created_by: ids.owner },
      { group_id: group.id, category: "교통", month: MONTH, goal_amount: 100000, created_by: ids.owner },
    ]);
    if (error) console.log("그룹 예산 생성 건너뜀:", error.message);
    else console.log("그룹 예산 2건 생성(그룹장 명의)");
  }

  console.log("\n=== 강사 전달용 ===");
  console.log("비밀번호(공통):", PASSWORD);
  for (const a of ACCOUNTS) {
    console.log(`- ${a.name.padEnd(12)} ${a.email.padEnd(38)} ${a.role ?? "그룹 미소속"}`);
  }
  console.log("그룹 초대 코드:", INVITE_CODE, `(${GROUP_NAME})`);
}

// 시연을 다시 돌리기 위한 초기화 — 계정·그룹·지출은 그대로 두고 "하루 한 번" 제한만 푼다.
// 밥주기는 서버에서 pet_feedings(pet_id, user_id, fed_date) 유니크 제약으로, 출석체크는
// attendance_checkins(user_id, checkin_date)로 하루 1회가 강제된다 — 제품 규칙이라 그대로 두고,
// 오늘 기록만 지워서 다시 누를 수 있게 한다. 코인도 100개로 채운다(밥값 5코인 = 20번 분량).
async function demoReset() {
  let users = [];
  for (let p = 1; p <= 10; p++) {
    const { data } = await admin.auth.admin.listUsers({ page: p, perPage: 200 });
    users.push(...data.users);
    if (data.users.length < 200) break;
  }
  for (const a of ACCOUNTS) {
    const u = users.find((x) => x.email === a.email);
    if (!u) { console.log("없음(건너뜀):", a.email); continue; }

    await admin.from("profiles").update({ onboarding_seen: false }).eq("id", u.id); // 온보딩 투어 다시 뜨게
    const { data: checks } = await admin.from("attendance_checkins").delete().eq("user_id", u.id).select();

    const pet = (await admin.from("pets").select("id").eq("user_id", u.id).maybeSingle()).data;
    let feeds = [];
    if (pet) {
      feeds = (await admin.from("pet_feedings").delete().eq("pet_id", pet.id).select()).data ?? [];
      await admin.from("pets").update({ total_coins: 100, last_fed_date: null }).eq("id", pet.id);
    }
    console.log(
      `${a.email.padEnd(20)} 온보딩 초기화 · 출석 ${(checks ?? []).length}건 삭제 · ` +
        (pet ? `밥기록 ${feeds.length}건 삭제 · 코인 100개` : "펫 없음")
    );
  }
  console.log("\n이제 세 계정 모두 출석체크·밥주기를 다시 누를 수 있고, 온보딩 투어도 다시 뜬다.");
}

if (process.argv.includes("--delete")) await remove();
else if (process.argv.includes("--demo-reset")) await demoReset();
else await seed();
process.exit(0);
