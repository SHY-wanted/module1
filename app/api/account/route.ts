// app/api/account/route.ts — 회원 탈퇴. Service Role Key로만 auth.users를 지울 수 있어서(anon key로는
// 불가능) 서버(이 Route Handler)에서만 처리한다 — receipt-ocr과 같은 이유·같은 패턴.
// auth.users를 지우면 profiles가 on delete cascade로 지워지고, group_members·expenses·savings·incomes
// 등 나머지 테이블도 011 마이그레이션에서 profiles(id)를 on delete cascade로 바꿔둬서 함께 정리된다.
//
// 2026-09-18 추가: 카카오로 로그인한 사용자면, Supabase 계정을 지우기 전에 카카오 쪽 연결도 끊는다
// (사용자 확인 — 안 끊으면 탈퇴 후 다시 카카오로 로그인할 때 동의 화면 없이 그냥 들어가져서 "탈퇴가
// 진짜 된 건가" 헷갈린다). 카카오 Admin Key + 카카오 숫자 유저 ID로 연결을 끊는 방식을 쓴다(사용자
// 자신의 토큰 대신 Admin Key를 쓰는 이유: 로그인이 오래전이면 카카오 액세스 토큰이 만료돼 있을 수
// 있어서, 세션 상태와 무관하게 항상 되는 방식을 골랐다). 이 단계가 실패해도 탈퇴 자체는 계속 진행한다
// — 카카오 연결 정리는 부가 기능이라, 여기서 막히면 사용자가 탈퇴 자체를 못 하게 되는 게 더 나쁘다.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KAKAO_ADMIN_KEY = process.env.KAKAO_ADMIN_KEY;

async function unlinkKakaoIfPresent(admin: SupabaseClient, userId: string) {
  if (!KAKAO_ADMIN_KEY) return; // 아직 설정 안 했으면 조용히 건너뛴다.

  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) {
    console.error("[account] getUserById failed (kakao unlink skipped):", error);
    return;
  }
  const kakaoIdentity = data.user.identities?.find((i) => i.provider === "kakao");
  const kakaoUserId = kakaoIdentity?.identity_data?.provider_id ?? kakaoIdentity?.identity_data?.sub;
  if (!kakaoUserId) return; // 카카오로 로그인한 계정이 아니면 할 게 없다.

  try {
    const res = await fetch("https://kapi.kakao.com/v1/user/unlink", {
      method: "POST",
      headers: {
        Authorization: `KakaoAK ${KAKAO_ADMIN_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ target_id_type: "user_id", target_id: String(kakaoUserId) }),
    });
    if (!res.ok) console.error("[account] kakao unlink failed:", res.status, await res.text());
  } catch (err) {
    console.error("[account] kakao unlink request failed:", err);
  }
}

export async function DELETE(request: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았어요" }, { status: 500 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "인증 정보가 없어요" }, { status: 401 });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    // 원인 진단용 — SERVICE_ROLE_KEY가 잘못됐거나(anon key를 잘못 넣음) 토큰이 만료된 경우를 구분한다.
    console.error("[account] getUser failed:", userError);
    return Response.json({ error: "인증에 실패했어요" }, { status: 401 });
  }

  await unlinkKakaoIfPresent(admin, userData.user.id);

  const { error } = await admin.auth.admin.deleteUser(userData.user.id);
  if (error) {
    console.error("[account] deleteUser failed:", error);
    return Response.json({ error: "탈퇴 처리에 실패했어요" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
