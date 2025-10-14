// lib/validations/auth.ts
// 인증 관련 유효성 검증 스키마
// 이메일과 비밀번호 형식을 검증하는 Zod 스키마 정의
// Related: app/signup/page.tsx, app/actions/auth.ts

import { z } from "zod"

/**
 * 이메일 유효성 검증
 * - 이메일 형식 확인
 */
export const emailSchema = z
  .string()
  .min(1, "이메일을 입력해주세요")
  .email("올바른 이메일 형식이 아닙니다")

/**
 * 비밀번호 유효성 검증
 * - 최소 8자 이상
 * - 영문, 숫자, 특수문자 중 2가지 이상 포함
 */
export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
  .refine((password) => {
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    const validCount = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length
    return validCount >= 2
  }, "비밀번호는 영문, 숫자, 특수문자 중 2가지 이상을 포함해야 합니다")

/**
 * 회원가입 폼 스키마
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export type SignUpFormData = z.infer<typeof signUpSchema>

