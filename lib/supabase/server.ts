// lib/supabase/server.ts
// Supabase 서버 클라이언트 초기화
// Server Actions와 Server Components에서 Supabase Auth를 사용하기 위한 유틸리티
// Related: lib/supabase/client.ts, app/actions/auth.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server Actions 및 Server Components에서 사용하는 Supabase 클라이언트 생성
 * 쿠키 기반 세션 관리를 통해 인증 상태 유지
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            // Server Component에서는 쿠키 설정 불가능 (무시)
          }
        },
      },
    }
  )
}

