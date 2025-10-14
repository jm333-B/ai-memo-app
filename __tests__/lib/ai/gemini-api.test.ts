// __tests__/lib/ai/gemini-api.test.ts
// Gemini API 호출 래퍼 함수 테스트
// API 호출, 타임아웃, 에러 핸들링, 헬스체크 기능 검증
// 관련 파일: lib/ai/gemini-api.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callGeminiAPI, checkGeminiHealth } from '@/lib/ai/gemini-api';
import { GeminiAPIError, GeminiTimeoutError } from '@/lib/errors/ai-errors';

// genAI 모킹
vi.mock('@/lib/ai/gemini-client', () => ({
  genAI: {
    models: {
      generateContent: vi.fn()
    }
  },
  MODEL_NAME: 'gemini-2.0-flash'
}));

describe('callGeminiAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('정상적으로 API를 호출하고 응답을 반환해야 함', async () => {
    const mockResponse = {
      text: '테스트 응답'
    };

    const { genAI } = await import('@/lib/ai/gemini-client');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (genAI.models.generateContent as any).mockResolvedValue(mockResponse);

    const result = await callGeminiAPI('테스트 프롬프트');
    
    expect(result).toBe('테스트 응답');
    expect(genAI.models.generateContent).toHaveBeenCalledWith({
      model: 'gemini-2.0-flash',
      contents: '테스트 프롬프트',
    });
  });

  it('API 호출 실패 시 GeminiAPIError를 던져야 함', async () => {
    const { genAI } = await import('@/lib/ai/gemini-client');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (genAI.models.generateContent as any).mockRejectedValue(new Error('API 에러'));

    await expect(callGeminiAPI('테스트')).rejects.toThrow(GeminiAPIError);
  });

  it('타임아웃 발생 시 GeminiTimeoutError를 던져야 함', async () => {
    const { genAI } = await import('@/lib/ai/gemini-client');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (genAI.models.generateContent as any).mockRejectedValue({ name: 'AbortError' });

    await expect(callGeminiAPI('테스트')).rejects.toThrow(GeminiTimeoutError);
    await expect(callGeminiAPI('테스트')).rejects.toThrow('API 호출이 시간 초과되었습니다');
  });
});

describe('checkGeminiHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('API가 정상이면 true를 반환해야 함', async () => {
    const mockResponse = {
      text: '테스트 응답'
    };

    const { genAI } = await import('@/lib/ai/gemini-client');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (genAI.models.generateContent as any).mockResolvedValue(mockResponse);

    const result = await checkGeminiHealth();
    expect(result).toBe(true);
  });

  it('API 호출 실패 시 false를 반환해야 함', async () => {
    const { genAI } = await import('@/lib/ai/gemini-client');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (genAI.models.generateContent as any).mockRejectedValue(new Error('API 에러'));

    const result = await checkGeminiHealth();
    expect(result).toBe(false);
  });
});

