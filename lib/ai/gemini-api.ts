// lib/ai/gemini-api.ts
// Gemini API 호출 래퍼 함수
// 타임아웃, 에러 핸들링, 헬스체크 등을 포함한 API 호출 인터페이스
// 관련 파일: lib/ai/gemini-client.ts, lib/errors/ai-errors.ts, app/actions/ai.ts

import { genAI, MODEL_NAME } from './gemini-client';
import { GeminiAPIError, GeminiTimeoutError } from '@/lib/errors/ai-errors';

const TIMEOUT_MS = 10000; // 10초

/**
 * Gemini API를 호출하여 텍스트를 생성합니다.
 * 
 * @param prompt - 생성할 텍스트의 프롬프트
 * @returns 생성된 텍스트
 * @throws {GeminiTimeoutError} 타임아웃 발생 시
 * @throws {GeminiAPIError} API 호출 실패 시
 */
export async function callGeminiAPI(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Gemini API 호출 (올바른 SDK 사용법)
    const result = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    
    clearTimeout(timeoutId);
    
    // 응답 텍스트 추출
    const text = result.text;
    if (!text) {
      throw new GeminiAPIError('API 응답이 비어있습니다');
    }
    return text;
  } catch (error) {
    clearTimeout(timeoutId);
    
    const err = error as Error & { name?: string };
    if (err.name === 'AbortError') {
      throw new GeminiTimeoutError('API 호출이 시간 초과되었습니다');
    }
    
    throw new GeminiAPIError(err.message || 'Gemini API 호출 실패');
  }
}

/**
 * Gemini API의 상태를 확인합니다.
 * 
 * @returns API가 정상 작동하면 true, 아니면 false
 */
export async function checkGeminiHealth(): Promise<boolean> {
  try {
    await callGeminiAPI('테스트');
    return true;
  } catch {
    return false;
  }
}

