// __tests__/lib/ai/token-counter.test.ts
// 토큰 카운터 유틸리티 함수 테스트
// 토큰 추정, 검증, 자르기 기능 검증
// 관련 파일: lib/ai/token-counter.ts

import { describe, it, expect } from 'vitest';
import { estimateTokens, validateTokenLimit, truncateToTokenLimit } from '@/lib/ai/token-counter';

describe('estimateTokens', () => {
  it('영문 텍스트의 토큰을 추정해야 함', () => {
    const text = 'Hello World';
    const tokens = estimateTokens(text);
    // 11자 * 0.5 = 5.5 -> ceil(5.5) = 6
    expect(tokens).toBe(6);
  });

  it('한글 텍스트의 토큰을 추정해야 함', () => {
    const text = '안녕하세요';
    const tokens = estimateTokens(text);
    // 5자 * 2 = 10
    expect(tokens).toBe(10);
  });

  it('혼합 텍스트의 토큰을 추정해야 함', () => {
    const text = '안녕 Hello';
    const tokens = estimateTokens(text);
    // 한글 2자 * 2 = 4, 영문+공백 6자 * 0.5 = 3, 총 7
    expect(tokens).toBe(7);
  });

  it('빈 문자열은 0 토큰이어야 함', () => {
    const text = '';
    const tokens = estimateTokens(text);
    expect(tokens).toBe(0);
  });

  it('긴 텍스트의 토큰을 정확히 추정해야 함', () => {
    const text = '가'.repeat(1000) + 'a'.repeat(1000);
    const tokens = estimateTokens(text);
    // 한글 1000자 * 2 = 2000, 영문 1000자 * 0.5 = 500, 총 2500
    expect(tokens).toBe(2500);
  });
});

describe('validateTokenLimit', () => {
  it('제한 내의 텍스트는 true를 반환해야 함', () => {
    const text = '가'.repeat(1000); // 약 2000 토큰
    expect(validateTokenLimit(text, 8000)).toBe(true);
  });

  it('제한을 초과한 텍스트는 false를 반환해야 함', () => {
    const text = '가'.repeat(5000); // 약 10000 토큰
    expect(validateTokenLimit(text, 8000)).toBe(false);
  });

  it('제한과 정확히 같은 텍스트는 true를 반환해야 함', () => {
    const text = '가'.repeat(4000); // 정확히 8000 토큰
    expect(validateTokenLimit(text, 8000)).toBe(true);
  });

  it('기본 제한값 8000을 사용해야 함', () => {
    const text = '가'.repeat(3000); // 약 6000 토큰
    expect(validateTokenLimit(text)).toBe(true);
  });
});

describe('truncateToTokenLimit', () => {
  it('제한 내의 텍스트는 그대로 반환해야 함', () => {
    const text = '가'.repeat(1000);
    expect(truncateToTokenLimit(text, 8000)).toBe(text);
  });

  it('제한을 초과한 텍스트는 잘라야 함', () => {
    const text = '가'.repeat(5000); // 약 10000 토큰
    const truncated = truncateToTokenLimit(text, 8000);
    expect(truncated.length).toBeLessThan(text.length);
    expect(validateTokenLimit(truncated, 8000)).toBe(true);
  });

  it('잘린 텍스트는 제한 내에 있어야 함', () => {
    const text = 'a'.repeat(20000); // 약 10000 토큰
    const truncated = truncateToTokenLimit(text, 5000);
    expect(validateTokenLimit(truncated, 5000)).toBe(true);
  });

  it('기본 제한값 8000을 사용해야 함', () => {
    const text = '가'.repeat(5000);
    const truncated = truncateToTokenLimit(text);
    expect(validateTokenLimit(truncated, 8000)).toBe(true);
  });

  it('빈 문자열은 빈 문자열을 반환해야 함', () => {
    const text = '';
    expect(truncateToTokenLimit(text)).toBe('');
  });
});

