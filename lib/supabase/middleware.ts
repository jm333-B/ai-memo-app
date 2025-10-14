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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 인증이 필요한 경로 보호
  const protectedPaths = ['/notes']
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // 인증되지 않은 사용자가 보호된 경로에 접근하면 로그인 페이지로 리다이렉트
  if (isProtectedPath && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 인증된 사용자가 로그인/회원가입 페이지에 접근하면 홈으로 리다이렉트
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.includes(request.nextUrl.pathname)
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL('/notes', request.url))
  }

  return supabaseResponse
}

