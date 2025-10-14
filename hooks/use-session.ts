// hooks/use-session.ts
// 세션 상태 모니터링 커스텀 훅
// Supabase Auth 세션 상태를 실시간으로 감지하고 관리
// Related: lib/supabase/client.ts, app/layout.tsx

"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 초기 세션 가져오기
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Get session error:', error)
          setSession(null)
          setUser(null)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Session fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // 세션 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        setSession(session)
        setUser(session?.user ?? null)

        // 세션 이벤트 처리
        if (event === 'SIGNED_OUT') {
          // 로그아웃 시 로그인 페이지로 리다이렉션
          router.push('/login')
        } else if (event === 'SIGNED_IN') {
          // 로그인 시 페이지 새로고침
          router.refresh()
        } else if (event === 'TOKEN_REFRESHED') {
          // 토큰 갱신 시 자동으로 처리 (Supabase가 자동으로 함)
          console.log('Token refreshed successfully')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  return { session, user, loading }
}

