// app/api/account/route.ts — 회원 탈퇴. Service Role Key로만 auth.users를 지울 수 있어서(anon key로는
// 불가능) 서버(이 Route Handler)에서만 처리한다 — receipt-ocr과 같은 이유·같은 패턴.
// auth.users를 지우면 profiles가 on delete cascade로 지워지고, group_members·expenses·savings·incomes
// 등 나머지 테이블도 011 마이그레이션에서 profiles(id)를 on delete cascade로 바꿔둬서 함께 정리된다.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function DELETE(request: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았어요" }, { status: 500 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "인증 정보가 없어요" }, { status: 401 });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return Response.json({ error: "인증에 실패했어요" }, { status: 401 });

  const { error } = await admin.auth.admin.deleteUser(userData.user.id);
  if (error) {
    console.error("[account] deleteUser failed:", error);
    return Response.json({ error: "탈퇴 처리에 실패했어요" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
