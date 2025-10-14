// __tests__/lib/ai/prompts.test.ts
// AI 프롬프트 생성 함수 테스트
// 요약 및 태그 생성 프롬프트의 형식과 내용을 검증
// 관련 파일: lib/ai/prompts.ts

import { describe, it, expect } from 'vitest';
import { generateSummaryPrompt, generateTagsPrompt } from '@/lib/ai/prompts';

describe('generateSummaryPrompt', () => {
  it('프롬프트에 노트 내용이 포함되어야 함', () => {
    const content = '이것은 테스트 노트 내용입니다.';
    const prompt = generateSummaryPrompt(content);

    expect(prompt).toContain(content);
  });

  it('프롬프트에 요약 지침이 포함되어야 함', () => {
    const content = '테스트 내용';
    const prompt = generateSummaryPrompt(content);

    expect(prompt).toContain('3-6개의 불릿 포인트');
    expect(prompt).toContain('핵심 내용');
    expect(prompt).toContain('한글');
    expect(prompt).toContain('-');
  });

  it('빈 내용도 처리할 수 있어야 함', () => {
    const prompt = generateSummaryPrompt('');

    expect(prompt).toBeDefined();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('긴 내용도 처리할 수 있어야 함', () => {
    const longContent = 'a'.repeat(10000);
    const prompt = generateSummaryPrompt(longContent);

    expect(prompt).toContain(longContent);
  });

  it('특수 문자가 포함된 내용을 처리할 수 있어야 함', () => {
    const content = '특수문자: !@#$%^&*() "인용문" \'작은따옴표\'';
    const prompt = generateSummaryPrompt(content);

    expect(prompt).toContain(content);
  });
});

describe('generateTagsPrompt', () => {
  it('프롬프트에 노트 내용이 포함되어야 함', () => {
    const content = '블록체인과 NFT에 관한 노트입니다.';
    const prompt = generateTagsPrompt(content);

    expect(prompt).toContain(content);
  });

  it('프롬프트에 태그 생성 지침이 포함되어야 함', () => {
    const content = '테스트 내용';
    const prompt = generateTagsPrompt(content);

    expect(prompt).toContain('최대 5개');
    expect(prompt).toContain('쉼표');
    expect(prompt).toContain('한글');
    expect(prompt).toContain('태그만 반환');
  });

  it('빈 내용도 처리할 수 있어야 함', () => {
    const prompt = generateTagsPrompt('');

    expect(prompt).toBeDefined();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('프롬프트에 태그 길이 제한이 포함되어야 함', () => {
    const content = '테스트';
    const prompt = generateTagsPrompt(content);

    expect(prompt).toContain('2-8자');
  });
});

