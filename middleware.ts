// middleware.ts
// Next.js 미들웨어 - 인증 세션 갱신 및 보호된 라우트 처리
// 모든 요청에서 Supabase 세션을 갱신하고 인증이 필요한 페이지로의 접근 제어
// Related: lib/supabase/middleware.ts, app/actions/auth.ts

import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

/**
 * 미들웨어 함수
 * 모든 요청에서 Supabase 세션을 갱신
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로에 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     * - public 폴더 내 파일들
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

