// __tests__/lib/utils/error-handler.test.ts
// 에러 핸들러 유틸리티 단위 테스트
// handleAuthError 함수가 다양한 에러를 올바르게 처리하는지 테스트
// Related: lib/utils/error-handler.ts

import { describe, it, expect, vi } from 'vitest'
import { handleAuthError } from '@/lib/utils/error-handler'
import { AuthErrorType } from '@/lib/errors/auth-errors'
import { AuthError } from '@supabase/supabase-js'

describe('handleAuthError', () => {
  it('should handle Supabase AuthError', () => {
    const error = new AuthError('Invalid login credentials')
    const result = handleAuthError(error)

    expect(result.message).toBe('이메일 또는 비밀번호가 올바르지 않습니다.')
    expect(result.action).toContain('다시 시도')
    expect(result.code).toBe('Invalid login credentials')
    expect(result.type).toBe(AuthErrorType.AUTHENTICATION)
  })

  it('should handle network TypeError', () => {
    const error = new TypeError('fetch failed')
    const result = handleAuthError(error)

    expect(result.message).toBe('네트워크 연결을 확인할 수 없습니다.')
    expect(result.action).toContain('인터넷 연결')
    expect(result.type).toBe(AuthErrorType.NETWORK)
  })

  it('should handle string errors', () => {
    const error = 'already registered'
    const result = handleAuthError(error)

    expect(result.message).toBe('이미 가입된 이메일입니다.')
    expect(result.action).toContain('로그인')
    expect(result.code).toBe('already registered')
  })

  it('should handle unknown errors with default message', () => {
    const error = { message: 'Unknown error occurred' }
    const result = handleAuthError(error)

    expect(result.message).toBe('오류가 발생했습니다.')
    expect(result.action).toContain('다시 시도')
  })

  it('should log errors in development mode', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env.NODE_ENV = 'development'

    const error = new Error('Test error')
    handleAuthError(error)

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

