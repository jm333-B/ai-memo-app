// lib/utils/toast.ts
// Toast 알림 헬퍼 함수
// Sonner를 사용한 Toast 표시 유틸리티
// Related: components/ui/sonner.tsx, app/actions/auth.ts

import { toast as sonnerToast } from 'sonner'

/**
 * 에러 Toast 표시
 * 
 * @param message - 에러 메시지
 * @param action - 해결 방법 또는 추가 설명
 */
export function showErrorToast(message: string, action?: string) {
  sonnerToast.error(message, {
    description: action,
    duration: 5000,
  })
}

/**
 * 성공 Toast 표시
 * 
 * @param message - 성공 메시지
 * @param description - 추가 설명
 */
export function showSuccessToast(message: string, description?: string) {
  sonnerToast.success(message, {
    description,
    duration: 3000,
  })
}

/**
 * 정보 Toast 표시
 * 
 * @param message - 정보 메시지
 * @param description - 추가 설명
 */
export function showInfoToast(message: string, description?: string) {
  sonnerToast.info(message, {
    description,
    duration: 4000,
  })
}

/**
 * 경고 Toast 표시
 * 
 * @param message - 경고 메시지
 * @param description - 추가 설명
 */
export function showWarningToast(message: string, description?: string) {
  sonnerToast.warning(message, {
    description,
    duration: 4000,
  })
}

/**
 * 로딩 Toast 표시
 * 
 * @param message - 로딩 메시지
 * @returns Toast ID (dismiss에 사용)
 */
export function showLoadingToast(message: string) {
  return sonnerToast.loading(message)
}

/**
 * Toast 닫기
 * 
 * @param toastId - 닫을 Toast의 ID
 */
export function dismissToast(toastId: string | number) {
  sonnerToast.dismiss(toastId)
}

