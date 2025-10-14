// lib/supabase/client.ts
// Supabase 브라우저 클라이언트 초기화
// 클라이언트 컴포넌트에서 Supabase Auth와 상호작용하기 위한 유틸리티
// Related: lib/supabase/server.ts, app/actions/auth.ts

import { createBrowserClient } from '@supabase/ssr'

/**
 * 브라우저에서 사용하는 Supabase 클라이언트 생성
 * 클라이언트 컴포넌트에서 인증 상태 확인 및 세션 관리에 사용
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

