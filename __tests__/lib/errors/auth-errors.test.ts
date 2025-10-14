// __tests__/lib/errors/auth-errors.test.ts
// 인증 에러 매핑 단위 테스트
// 에러 코드가 올바르게 한국어 메시지로 매핑되는지 테스트
// Related: lib/errors/auth-errors.ts

import { describe, it, expect } from 'vitest'
import { AUTH_ERROR_MESSAGES, getAuthErrorType, AuthErrorType } from '@/lib/errors/auth-errors'

describe('AUTH_ERROR_MESSAGES', () => {
  it('should have Korean error messages for all error codes', () => {
    expect(AUTH_ERROR_MESSAGES['invalid_credentials'].message).toBe('이메일 또는 비밀번호가 올바르지 않습니다.')
    expect(AUTH_ERROR_MESSAGES['Invalid login credentials'].message).toBe('이메일 또는 비밀번호가 올바르지 않습니다.')
    expect(AUTH_ERROR_MESSAGES['email_not_confirmed'].message).toBe('이메일 확인이 필요합니다.')
    expect(AUTH_ERROR_MESSAGES['already registered'].message).toBe('이미 가입된 이메일입니다.')
    expect(AUTH_ERROR_MESSAGES['default'].message).toBe('오류가 발생했습니다.')
  })

  it('should provide actionable guidance for all error types', () => {
    expect(AUTH_ERROR_MESSAGES['invalid_credentials'].action).toContain('다시 시도')
    expect(AUTH_ERROR_MESSAGES['network_error'].action).toContain('인터넷 연결')
    expect(AUTH_ERROR_MESSAGES['session_expired'].action).toContain('로그인')
  })
})

describe('getAuthErrorType', () => {
  it('should identify network errors', () => {
    const error = new TypeError('fetch failed')
    expect(getAuthErrorType(error)).toBe(AuthErrorType.NETWORK)
  })

  it('should identify authentication errors', () => {
    const error = { message: 'Invalid login credentials' }
    expect(getAuthErrorType(error)).toBe(AuthErrorType.AUTHENTICATION)
  })

  it('should identify validation errors', () => {
    const error = { message: '입력값이 올바르지 않습니다' }
    expect(getAuthErrorType(error)).toBe(AuthErrorType.VALIDATION)
  })

  it('should return UNKNOWN for unrecognized errors', () => {
    const error = { message: 'Something went wrong' }
    expect(getAuthErrorType(error)).toBe(AuthErrorType.UNKNOWN)
  })

  it('should handle null/undefined errors', () => {
    expect(getAuthErrorType(null)).toBe(AuthErrorType.UNKNOWN)
    expect(getAuthErrorType(undefined)).toBe(AuthErrorType.UNKNOWN)
  })
})

