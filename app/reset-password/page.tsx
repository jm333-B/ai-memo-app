// app/reset-password/page.tsx
// 비밀번호 재설정 요청 페이지
// 이메일을 입력하고 비밀번호 재설정 링크를 요청하는 페이지
// Related: app/actions/auth.ts, lib/validations/auth.ts, app/login/page.tsx

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { emailSchema } from "@/lib/validations/auth"
import { resetPassword } from "@/app/actions/auth"

// 비밀번호 재설정 요청 스키마
const resetPasswordSchema = z.object({
  email: emailSchema,
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await resetPassword(data.email)

      if (result.error) {
        setError(result.error)
        return
      }

      // 성공 (보안상 모든 경우에 성공 메시지 표시)
      setSuccess(true)
    } catch (err) {
      setError("오류가 발생했습니다. 다시 시도해주세요.")
      console.error("Reset password error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* 헤더 */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              이메일을 확인하세요
            </h1>
            <p className="mt-4 text-sm text-gray-600">
              비밀번호 재설정 링크를 이메일로 발송했습니다.
            </p>
          </div>

          {/* 안내 메시지 */}
          <div className="rounded-lg bg-white px-8 py-10 shadow-sm ring-1 ring-gray-900/5">
            <div className="space-y-4">
              <div className="rounded-md bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  <strong>다음 단계:</strong>
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-700 list-disc list-inside">
                  <li>이메일 받은편지함을 확인하세요</li>
                  <li>비밀번호 재설정 링크를 클릭하세요</li>
                  <li>새 비밀번호를 설정하세요</li>
                </ul>
              </div>

              <p className="text-sm text-gray-500">
                이메일이 도착하지 않았나요? 스팸 폴더를 확인하거나 몇 분 후 다시 시도해주세요.
              </p>
            </div>
          </div>

          {/* 로그인 페이지 링크 */}
          <div className="text-center text-sm">
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              ← 로그인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            비밀번호 재설정
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            가입하신 이메일 주소를 입력해주세요
          </p>
        </div>

        {/* 폼 */}
        <div className="rounded-lg bg-white px-8 py-10 shadow-sm ring-1 ring-gray-900/5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 에러 메시지 */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* 이메일 필드 */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 제출 버튼 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "발송 중..." : "재설정 링크 발송"}
              </Button>
            </form>
          </Form>

          {/* 로그인 페이지 링크 */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">비밀번호가 기억나셨나요? </span>
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

