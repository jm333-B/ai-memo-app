// app/page.tsx
// 메인 페이지
// 로그인한 사용자를 위한 환영 페이지, 미인증 사용자는 로그인 페이지로 리다이렉트
// Related: app/actions/auth.ts, app/login/page.tsx, app/signup/page.tsx

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/app/actions/auth"

// 쿠키를 사용하므로 동적 렌더링 강제
export const dynamic = 'force-dynamic'

export default async function Home() {
  // 현재 로그인한 사용자 확인
  const user = await getCurrentUser()

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!user) {
    redirect("/login")
  }

  // 로그인한 사용자는 노트 페이지로 리다이렉트
  redirect("/notes")
}
