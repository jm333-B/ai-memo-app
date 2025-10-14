// lib/errors/auth-errors.ts
// 인증 에러 타입 정의 및 메시지 매핑
// Supabase Auth 에러 코드를 사용자 친화적인 한국어 메시지로 변환
// Related: lib/utils/error-handler.ts, app/actions/auth.ts

export type AuthErrorInfo = {
  message: string
  action: string
}

/**
 * 인증 에러 메시지 매핑 테이블
 * Supabase Auth 에러 코드 또는 일반적인 에러 타입을 한국어 메시지로 매핑
 */
export const AUTH_ERROR_MESSAGES: Record<string, AuthErrorInfo> = {
  // Supabase Auth 에러 코드
  'invalid_credentials': {
    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
    action: '다시 시도하거나 비밀번호를 재설정하세요.',
  },
  'Invalid login credentials': {
    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
    action: '다시 시도하거나 비밀번호를 재설정하세요.',
  },
  'email_not_confirmed': {
    message: '이메일 확인이 필요합니다.',
    action: '이메일 확인 링크를 확인하세요.',
  },
  'Email not confirmed': {
    message: '이메일 확인이 필요합니다.',
    action: '이메일 확인 링크를 확인하세요.',
  },
  'user_already_exists': {
    message: '이미 가입된 이메일입니다.',
    action: '로그인하거나 다른 이메일을 사용하세요.',
  },
  'already registered': {
    message: '이미 가입된 이메일입니다.',
    action: '로그인하거나 다른 이메일을 사용하세요.',
  },
  'weak_password': {
    message: '비밀번호가 너무 약합니다.',
    action: '최소 8자, 영문/숫자/특수문자 중 2가지를 포함하세요.',
  },
  'Password should be at least 6 characters': {
    message: '비밀번호가 너무 짧습니다.',
    action: '최소 8자, 영문/숫자/특수문자 중 2가지를 포함하세요.',
  },
  'network_error': {
    message: '네트워크 연결을 확인할 수 없습니다.',
    action: '인터넷 연결을 확인하고 다시 시도하세요.',
  },
  'session_expired': {
    message: '세션이 만료되었습니다.',
    action: '다시 로그인해주세요.',
  },
  'rate_limit_exceeded': {
    message: '너무 많은 요청이 발생했습니다.',
    action: '잠시 후 다시 시도하세요.',
  },
  'validation_error': {
    message: '입력값이 올바르지 않습니다.',
    action: '입력 내용을 확인하고 다시 시도하세요.',
  },
  'default': {
    message: '오류가 발생했습니다.',
    action: '다시 시도하거나 고객 지원에 문의하세요.',
  },
}

/**
 * 에러 타입 분류
 */
export enum AuthErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

/**
 * 에러 타입 식별 함수
 */
export function getAuthErrorType(error: unknown): AuthErrorType {
  if (!error) return AuthErrorType.UNKNOWN

  // 네트워크 에러
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return AuthErrorType.NETWORK
  }

  // Supabase AuthError 타입 확인
  const errorMessage = (error as any)?.message || String(error)

  if (
    errorMessage.includes('Invalid login credentials') ||
    errorMessage.includes('invalid_credentials') ||
    errorMessage.includes('Email not confirmed') ||
    errorMessage.includes('already registered')
  ) {
    return AuthErrorType.AUTHENTICATION
  }

  if (
    errorMessage.includes('입력값') ||
    errorMessage.includes('validation')
  ) {
    return AuthErrorType.VALIDATION
  }

  if (errorMessage.includes('network')) {
    return AuthErrorType.NETWORK
  }

  if (errorMessage.includes('500') || errorMessage.includes('server')) {
    return AuthErrorType.SERVER
  }

  return AuthErrorType.UNKNOWN
}

