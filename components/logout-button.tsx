// components/logout-button.tsx
// 로그아웃 버튼 컴포넌트
// 로딩 상태 표시 및 에러 처리를 포함한 로그아웃 버튼
// Related: app/actions/auth.ts, app/page.tsx

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleLogout = async () => {
    setError(null)
    
    startTransition(async () => {
      try {
        const result = await signOut()
        
        if (result && result.error) {
          setError(result.error)
        }
        // 성공 시 signOut에서 자동으로 리다이렉션됨
      } catch (err) {
        console.error("Logout error:", err)
        setError("로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.")
      }
    })
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleLogout}
        variant="outline"
        className="min-w-[120px]"
        disabled={isPending}
      >
        {isPending ? "로그아웃 중..." : "로그아웃"}
      </Button>
      
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={handleLogout}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
            disabled={isPending}
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  )
}

