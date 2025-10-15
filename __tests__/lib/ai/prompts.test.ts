// __tests__/lib/ai/prompts.test.ts
// AI 프롬프트 생성 함수 테스트
// 요약 및 태그 생성 프롬프트의 형식과 내용을 검증
// 관련 파일: lib/ai/prompts.ts

import { describe, it, expect } from 'vitest';
import { generateSummaryPrompt, generateTagsPrompt, normalizeTag, parseTags } from '@/lib/ai/prompts';

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

    expect(prompt).toContain('최대 6개');
    expect(prompt).toContain('쉼표');
    expect(prompt).toContain('한글');
    expect(prompt).toContain('핵심 주제');
  });

  it('빈 내용도 처리할 수 있어야 함', () => {
    const prompt = generateTagsPrompt('');

    expect(prompt).toBeDefined();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('프롬프트에 태그 형식 지침이 포함되어야 함', () => {
    const content = '테스트';
    const prompt = generateTagsPrompt(content);

    expect(prompt).toContain('한 단어 또는 짧은 구문');
    expect(prompt).toContain('너무 일반적인 태그는 피해주세요');
  });
});

describe('normalizeTag', () => {
  it('앞뒤 공백을 제거해야 함', () => {
    expect(normalizeTag('  태그  ')).toBe('태그');
  });

  it('소문자로 변환해야 함', () => {
    expect(normalizeTag('TAG')).toBe('tag');
  });

  it('공백을 하이픈으로 변환해야 함', () => {
    expect(normalizeTag('블록 체인')).toBe('블록-체인');
  });

  it('특수문자를 제거해야 함', () => {
    expect(normalizeTag('태그!@#$%')).toBe('태그');
  });

  it('한글과 영문, 숫자, 하이픈만 유지해야 함', () => {
    expect(normalizeTag('AI-블록체인-2024')).toBe('ai-블록체인-2024');
  });

  it('빈 문자열을 처리할 수 있어야 함', () => {
    expect(normalizeTag('')).toBe('');
  });
});

describe('parseTags', () => {
  it('쉼표로 구분된 태그를 파싱해야 함', () => {
    const result = parseTags('블록체인, NFT, 암호화폐');
    expect(result).toEqual(['블록체인', 'nft', '암호화폐']);
  });

  it('최대 6개 태그만 반환해야 함', () => {
    const result = parseTags('태그1, 태그2, 태그3, 태그4, 태그5, 태그6, 태그7, 태그8');
    expect(result).toHaveLength(6);
    expect(result).toEqual(['태그1', '태그2', '태그3', '태그4', '태그5', '태그6']);
  });

  it('빈 태그를 필터링해야 함', () => {
    const result = parseTags('태그1, , 태그2, , 태그3');
    expect(result).toEqual(['태그1', '태그2', '태그3']);
  });

  it('20자 초과 태그를 필터링해야 함', () => {
    const longTag = 'a'.repeat(25);
    const result = parseTags(`태그1, ${longTag}, 태그2`);
    expect(result).toEqual(['태그1', '태그2']);
  });

  it('빈 문자열을 처리할 수 있어야 함', () => {
    const result = parseTags('');
    expect(result).toEqual([]);
  });

  it('정규화를 적용해야 함', () => {
    const result = parseTags('  블록체인  , NFT!@#, 암호화폐 ');
    expect(result).toEqual(['블록체인', 'nft', '암호화폐']);
  });
});

