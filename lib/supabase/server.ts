import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 서버 컴포넌트 · Route Handler · Server Action에서 쓰는 Supabase 클라이언트.
// 요청마다 새로 만들어야 한다(모듈 스코프에 캐싱해서 재사용하지 말 것) — 쿠키(세션)가 요청마다 다르기 때문.
// 환경변수 값 자체는 여기 남기지 않는다 — .env.local에 NEXT_PUBLIC_SUPABASE_URL,
// NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY로 설정돼 있어야 한다(구형 *_ANON_KEY는 쓰지 않는다).
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출된 경우 — 세션 쿠키 갱신은 미들웨어가 대신 처리하므로
            // 여기서 나는 에러(쿠키를 못 쓰는 컨텍스트)는 무시해도 된다.
          }
        },
      },
    }
  )
}
