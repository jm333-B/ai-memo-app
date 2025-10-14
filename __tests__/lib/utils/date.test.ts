// __tests__/lib/utils/date.test.ts
// 날짜 포맷팅 유틸리티 함수 테스트
// 상대 시간 포맷팅 및 텍스트 truncate 기능 검증
// 관련 파일: lib/utils/date.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatRelativeTime, truncateText } from '@/lib/utils/date';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // 고정된 현재 시간 설정
    vi.setSystemTime(new Date('2024-10-14T12:00:00Z'));
  });

  it('"방금 전"을 반환해야 함 (1분 미만)', () => {
    const date = new Date('2024-10-14T11:59:30Z');
    expect(formatRelativeTime(date)).toBe('방금 전');
  });

  it('"n분 전"을 반환해야 함 (1시간 미만)', () => {
    const date = new Date('2024-10-14T11:45:00Z');
    expect(formatRelativeTime(date)).toBe('15분 전');
  });

  it('"n시간 전"을 반환해야 함 (24시간 미만)', () => {
    const date = new Date('2024-10-14T09:00:00Z');
    expect(formatRelativeTime(date)).toBe('3시간 전');
  });

  it('"어제"를 반환해야 함', () => {
    const date = new Date('2024-10-13T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('어제');
  });

  it('"n일 전"을 반환해야 함 (일주일 미만)', () => {
    const date = new Date('2024-10-10T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('4일 전');
  });

  it('YYYY.MM.DD 형식을 반환해야 함 (일주일 이상)', () => {
    const date = new Date('2024-10-01T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('2024.10.01');
  });

  it('문자열 날짜도 처리할 수 있어야 함', () => {
    const dateString = '2024-10-14T11:45:00Z';
    expect(formatRelativeTime(dateString)).toBe('15분 전');
  });
});

describe('truncateText', () => {
  it('짧은 텍스트는 그대로 반환해야 함', () => {
    const text = '짧은 텍스트';
    expect(truncateText(text, 100)).toBe(text);
  });

  it('긴 텍스트는 자르고 "..."을 추가해야 함', () => {
    const text = 'a'.repeat(150);
    const result = truncateText(text, 100);
    expect(result.length).toBe(103); // 100 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('maxLength를 지정하지 않으면 기본값 100을 사용해야 함', () => {
    const text = 'a'.repeat(150);
    const result = truncateText(text);
    expect(result.length).toBe(103);
  });

  it('정확히 maxLength와 같은 길이는 그대로 반환해야 함', () => {
    const text = 'a'.repeat(100);
    expect(truncateText(text, 100)).toBe(text);
  });
});

