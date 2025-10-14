// lib/supabase/middleware.ts
// Supabase 미들웨어 클라이언트 초기화
// Next.js 미들웨어에서 인증 상태 확인 및 세션 갱신
// Related: middleware.ts, lib/supabase/server.ts

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * 미들웨어에서 사용하는 Supabase 클라이언트 생성
 * 요청마다 세션을 갱신하고 인증 상태를 확인
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 갱신 (중요: getUser()를 호출하여 세션 상태 확인)
  await supabase.auth.getUser()

  return supabaseResponse
}

