// app/page.tsx
// 메인 페이지
// 로그인한 사용자를 위한 환영 페이지, 미인증 사용자는 로그인 페이지로 리다이렉트
// Related: app/actions/auth.ts, app/login/page.tsx, app/signup/page.tsx

import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/app/actions/auth"
import { LogoutButton } from "@/components/logout-button"

export default async function Home() {
  // 현재 로그인한 사용자 확인
  const user = await getCurrentUser()

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!user) {
    redirect("/login")
  }

  // 로그인한 사용자는 노트 페이지로 리다이렉트
  redirect("/notes")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            AI 메모장
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            환영합니다, <span className="font-semibold">{user.email}</span>님!
          </p>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="rounded-lg bg-white px-8 py-10 shadow-sm ring-1 ring-gray-900/5">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">
                시작하기
              </h2>
              <p className="text-gray-600">
                AI 메모장으로 더 스마트하게 메모를 관리하세요.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-md bg-blue-50 p-4">
                <h3 className="font-medium text-blue-900">✨ 주요 기능 (예정)</h3>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>• 음성 메모 녹음 및 자동 텍스트 변환</li>
                  <li>• AI 기반 자동 요약 및 태그 생성</li>
                  <li>• 강력한 검색 및 필터링</li>
                  <li>• 데이터 내보내기 (JSON/CSV)</li>
                </ul>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  현재 사용자 인증 기능이 완료되었습니다. 추가 기능은 순차적으로 개발될 예정입니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-center gap-4">
          <LogoutButton />
        </div>

        {/* 푸터 */}
        <div className="text-center text-sm text-gray-500">
          <p>
            개발 중인 프로젝트입니다. |{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              회원가입
            </Link>{" "}
            |{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
