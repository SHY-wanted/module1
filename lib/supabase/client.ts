import { createBrowserClient } from '@supabase/ssr'

// 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트.
// 환경변수 값 자체는 여기 남기지 않는다 — .env.local에 NEXT_PUBLIC_SUPABASE_URL,
// NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY로 설정돼 있어야 한다(구형 *_ANON_KEY는 쓰지 않는다).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
