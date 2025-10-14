// app/login/page.tsx
// 로그인 페이지
// 이메일과 비밀번호를 입력받아 기존 사용자 계정에 로그인하는 페이지
// Related: app/actions/auth.ts, lib/validations/auth.ts, components/ui/form.tsx

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
import { signInSchema, type SignInFormData } from "@/lib/validations/auth"
import { signIn } from "@/app/actions/auth"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: SignInFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await signIn(data)

      if (result.error) {
        setError(result.error)
        return
      }

      // 로그인 성공 시 노트 페이지로 이동
      router.push("/notes")
      router.refresh()
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.")
      console.error("SignIn error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            로그인
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            AI 메모장에 오신 것을 환영합니다
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

              {/* 비밀번호 필드 */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 비밀번호 찾기 링크 */}
              <div className="flex items-center justify-end">
                <Link
                  href="/reset-password"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>

              {/* 제출 버튼 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          </Form>

          {/* 회원가입 페이지 링크 */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">계정이 없으신가요? </span>
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

