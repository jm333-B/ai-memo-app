// lib/ai/token-counter.ts
// 토큰 제한 관리 유틸리티
// Gemini API의 8k 토큰 제한을 관리하기 위한 추정 및 제한 함수
// 관련 파일: lib/ai/gemini-api.ts

/**
 * 텍스트의 토큰 수를 추정합니다.
 * 한글: 1자당 약 2토큰
 * 기타: 1자당 약 0.5토큰
 * 
 * @param text - 토큰 수를 추정할 텍스트
 * @returns 추정된 토큰 수
 */
export function estimateTokens(text: string): number {
  // 한글 문자 범위: \u3131-\uD79D (한글 자모, 음절)
  const koreanChars = (text.match(/[\u3131-\uD79D]/g) || []).length;
  const otherChars = text.length - koreanChars;
  
  return Math.ceil(koreanChars * 2 + otherChars * 0.5);
}

/**
 * 텍스트가 토큰 제한 내에 있는지 검증합니다.
 * 
 * @param text - 검증할 텍스트
 * @param limit - 토큰 제한 (기본값: 8000)
 * @returns 제한 내에 있으면 true, 초과하면 false
 */
export function validateTokenLimit(text: string, limit = 8000): boolean {
  return estimateTokens(text) <= limit;
}

/**
 * 텍스트를 토큰 제한 내로 자릅니다.
 * 
 * @param text - 자를 텍스트
 * @param limit - 토큰 제한 (기본값: 8000)
 * @returns 토큰 제한 내로 잘린 텍스트
 */
export function truncateToTokenLimit(text: string, limit = 8000): string {
  if (validateTokenLimit(text, limit)) {
    return text;
  }
  
  // 토큰 초과 시 단계적으로 자르기 (90%씩)
  let truncated = text;
  while (!validateTokenLimit(truncated, limit) && truncated.length > 0) {
    truncated = truncated.slice(0, Math.floor(truncated.length * 0.9));
  }
  
  return truncated;
}

