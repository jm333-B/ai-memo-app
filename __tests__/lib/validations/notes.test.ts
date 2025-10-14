// __tests__/lib/validations/notes.test.ts
// 노트 유효성 검증 스키마 테스트
// 제목과 본문의 필수 여부 및 길이 제한 검증
// 관련 파일: lib/validations/notes.ts

import { describe, it, expect } from 'vitest';
import { createNoteSchema } from '@/lib/validations/notes';

describe('createNoteSchema', () => {
  it('유효한 노트 데이터를 통과시켜야 함', () => {
    const validData = {
      title: '테스트 노트',
      content: '테스트 내용입니다.',
    };

    const result = createNoteSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('빈 제목은 에러를 발생시켜야 함', () => {
    const invalidData = {
      title: '',
      content: '테스트 내용입니다.',
    };

    const result = createNoteSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('제목을 입력해주세요');
    }
  });

  it('빈 본문은 에러를 발생시켜야 함', () => {
    const invalidData = {
      title: '테스트 노트',
      content: '',
    };

    const result = createNoteSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('본문을 입력해주세요');
    }
  });

  it('255자를 초과하는 제목은 에러를 발생시켜야 함', () => {
    const invalidData = {
      title: 'a'.repeat(256),
      content: '테스트 내용입니다.',
    };

    const result = createNoteSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        '제목은 최대 255자까지 입력 가능합니다'
      );
    }
  });

  it('255자 제목은 통과시켜야 함', () => {
    const validData = {
      title: 'a'.repeat(255),
      content: '테스트 내용입니다.',
    };

    const result = createNoteSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

