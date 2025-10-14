// lib/errors/ai-errors.ts
// AI 관련 커스텀 에러 클래스
// Gemini API 호출 중 발생하는 다양한 에러 타입을 정의
// 관련 파일: lib/ai/gemini-api.ts, app/actions/ai.ts

/**
 * Gemini API 관련 기본 에러 클래스
 */
export class GeminiAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

/**
 * API 호출 타임아웃 에러
 */
export class GeminiTimeoutError extends GeminiAPIError {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiTimeoutError';
  }
}

/**
 * API 할당량 초과 에러
 */
export class GeminiQuotaExceededError extends GeminiAPIError {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiQuotaExceededError';
  }
}

