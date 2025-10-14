// __tests__/lib/errors/ai-errors.test.ts
// AI 에러 클래스 테스트
// 커스텀 에러 클래스의 생성 및 속성 검증
// 관련 파일: lib/errors/ai-errors.ts

import { describe, it, expect } from 'vitest';
import { GeminiAPIError, GeminiTimeoutError, GeminiQuotaExceededError } from '@/lib/errors/ai-errors';

describe('GeminiAPIError', () => {
  it('올바른 이름과 메시지를 가져야 함', () => {
    const error = new GeminiAPIError('테스트 에러');
    expect(error.name).toBe('GeminiAPIError');
    expect(error.message).toBe('테스트 에러');
    expect(error instanceof Error).toBe(true);
  });
});

describe('GeminiTimeoutError', () => {
  it('GeminiAPIError를 상속해야 함', () => {
    const error = new GeminiTimeoutError('타임아웃 에러');
    expect(error instanceof GeminiAPIError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('올바른 이름과 메시지를 가져야 함', () => {
    const error = new GeminiTimeoutError('타임아웃 에러');
    expect(error.name).toBe('GeminiTimeoutError');
    expect(error.message).toBe('타임아웃 에러');
  });
});

describe('GeminiQuotaExceededError', () => {
  it('GeminiAPIError를 상속해야 함', () => {
    const error = new GeminiQuotaExceededError('할당량 초과');
    expect(error instanceof GeminiAPIError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('올바른 이름과 메시지를 가져야 함', () => {
    const error = new GeminiQuotaExceededError('할당량 초과');
    expect(error.name).toBe('GeminiQuotaExceededError');
    expect(error.message).toBe('할당량 초과');
  });
});

