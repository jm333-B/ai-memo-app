// lib/utils/error-handler.ts
// 에러 핸들링 유틸리티
// 에러를 파싱하고 사용자 친화적인 메시지로 변환
// Related: lib/errors/auth-errors.ts, app/actions/auth.ts

import { AuthError } from '@supabase/supabase-js'
import { AUTH_ERROR_MESSAGES, type AuthErrorInfo, getAuthErrorType, AuthErrorType } from '@/lib/errors/auth-errors'

/**
 * 에러 핸들링 결과 타입
 */
export type ErrorHandlingResult = {
  message: string
  action: string
  code?: string
  type: AuthErrorType
}

/**
 * 인증 에러 핸들러
 * 다양한 에러 타입을 감지하고 사용자 친화적인 메시지로 변환
 * 
 * @param error - 처리할 에러 객체
 * @returns 에러 정보 (메시지, 액션, 코드, 타입)
 */
export function handleAuthError(error: unknown): ErrorHandlingResult {
  const isDev = process.env.NODE_ENV === 'development'

  // 개발 환경에서 상세 로깅
  if (isDev) {
    console.error('[Auth Error]', error)
  } else {
    // 프로덕션 환경에서는 에러만 로깅 (민감한 정보 제외)
    console.error('[Auth Error]', (error as { message?: string })?.message || 'Unknown error')
  }

  // 에러 타입 식별
  const errorType = getAuthErrorType(error)

  // Supabase AuthError 처리
  if (error instanceof AuthError) {
    const errorMessage = error.message || 'Unknown error'
    const errorInfo = AUTH_ERROR_MESSAGES[errorMessage] || AUTH_ERROR_MESSAGES['default']
    
    return {
      message: errorInfo.message,
      action: errorInfo.action,
      code: errorMessage,
      type: errorType,
    }
  }

  // 네트워크 에러 처리
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      ...AUTH_ERROR_MESSAGES['network_error'],
      type: AuthErrorType.NETWORK,
    }
  }

  // 문자열 에러 메시지 처리
  if (typeof error === 'string') {
    const errorInfo = AUTH_ERROR_MESSAGES[error] || AUTH_ERROR_MESSAGES['default']
    return {
      message: errorInfo.message,
      action: errorInfo.action,
      code: error,
      type: errorType,
    }
  }

  // 에러 객체에서 메시지 추출
  const errorMessage = (error as { message?: string })?.message || String(error)
  const errorInfo = AUTH_ERROR_MESSAGES[errorMessage] || AUTH_ERROR_MESSAGES['default']

  return {
    message: errorInfo.message,
    action: errorInfo.action,
    code: errorMessage,
    type: errorType,
  }
}

/**
 * 서버 사이드 에러 로깅
 * 
 * @param error - 로깅할 에러
 * @param context - 에러 발생 컨텍스트 (함수명, 사용자 ID 등)
 */
export function logServerError(error: unknown, context?: Record<string, unknown>) {
  const isDev = process.env.NODE_ENV === 'development'
  const timestamp = new Date().toISOString()
  
  const logData = {
    timestamp,
    error: (error as { message?: string })?.message || String(error),
    stack: isDev ? (error as { stack?: string })?.stack : undefined,
    context,
  }

  if (isDev) {
    console.error('[Server Error]', logData)
  } else {
    // 프로덕션 환경에서는 민감한 정보 제외하고 로깅
    console.error('[Server Error]', {
      timestamp: logData.timestamp,
      error: logData.error,
      // 외부 로깅 서비스 (예: Sentry)로 전송하는 로직 추가 가능
    })
  }
}

