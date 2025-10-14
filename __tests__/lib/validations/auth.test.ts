// __tests__/lib/validations/auth.test.ts
// 인증 유효성 검증 로직 단위 테스트
// 이메일과 비밀번호 검증 스키마가 올바르게 작동하는지 확인
// Related: lib/validations/auth.ts

import { describe, it, expect } from 'vitest'
import { emailSchema, passwordSchema, signUpSchema, signInSchema } from '@/lib/validations/auth'

describe('auth validations', () => {
  describe('emailSchema', () => {
    it('유효한 이메일 형식을 통과시켜야 함', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.kr',
        'user+tag@example.com',
      ]

      validEmails.forEach((email) => {
        const result = emailSchema.safeParse(email)
        expect(result.success).toBe(true)
      })
    })

    it('잘못된 이메일 형식을 거부해야 함', () => {
      const invalidEmails = [
        '',
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
      ]

      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse(email)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('passwordSchema', () => {
    it('유효한 비밀번호를 통과시켜야 함', () => {
      const validPasswords = [
        'password123',          // 영문 + 숫자
        'Pass@word',            // 영문 + 특수문자
        '12345678!',            // 숫자 + 특수문자
        'MyP@ssw0rd123',        // 영문 + 숫자 + 특수문자
      ]

      validPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password)
        expect(result.success).toBe(true)
      })
    })

    it('8자 미만의 비밀번호를 거부해야 함', () => {
      const shortPasswords = ['pass1', 'abc123', 'Test@1']

      shortPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('최소 8자')
        }
      })
    })

    it('영문, 숫자, 특수문자 중 1가지만 포함된 비밀번호를 거부해야 함', () => {
      const weakPasswords = [
        'abcdefgh',             // 영문만
        '12345678',             // 숫자만
        '!!!!!!!!',             // 특수문자만
      ]

      weakPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('2가지 이상')
        }
      })
    })
  })

  describe('signUpSchema', () => {
    it('유효한 회원가입 데이터를 통과시켜야 함', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
      }

      const result = signUpSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('잘못된 이메일과 비밀번호를 거부해야 함', () => {
      const invalidData = {
        email: 'notanemail',
        password: '123',
      }

      const result = signUpSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('signInSchema', () => {
    it('유효한 로그인 데이터를 통과시켜야 함', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anypassword',
      }

      const result = signInSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('잘못된 이메일을 거부해야 함', () => {
      const invalidData = {
        email: 'notanemail',
        password: 'anypassword',
      }

      const result = signInSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('빈 비밀번호를 거부해야 함', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      }

      const result = signInSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('비밀번호 강도 검증을 하지 않아야 함', () => {
      // 로그인 시에는 약한 비밀번호도 허용
      const dataWithWeakPassword = {
        email: 'test@example.com',
        password: '123', // 3자만 있어도 통과
      }

      const result = signInSchema.safeParse(dataWithWeakPassword)
      expect(result.success).toBe(true)
    })
  })
})

