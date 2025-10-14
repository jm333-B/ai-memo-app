// app/auth/callback/route.ts
// Supabase Auth 콜백 핸들러
// 이메일 링크 인증 토큰을 세션으로 교환하고 사용자를 리다이렉트
// Related: app/actions/auth.ts, lib/supabase/server.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Supabase Auth 콜백 핸들러
 * 
 * 비밀번호 재설정 이메일 링크를 클릭하면:
 * 1. 이 라우트로 리다이렉트됨 (code 파라미터 포함)
 * 2. code를 세션으로 교환
 * 3. next 파라미터로 지정된 페이지로 리다이렉트
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    
    // 인증 코드를 세션으로 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      // 에러 발생 시 로그인 페이지로 리다이렉트 (에러 메시지 포함)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('인증에 실패했습니다. 다시 시도해주세요.')}`
      )
    }
  }

  // 성공: next 파라미터로 지정된 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}${next}`)
}

