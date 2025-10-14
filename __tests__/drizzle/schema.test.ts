// __tests__/drizzle/schema.test.ts
// Drizzle 스키마 타입 검증 테스트
// Notes 테이블 스키마의 필드와 타입이 올바르게 정의되었는지 확인
// 관련 파일: drizzle/schema.ts, lib/db/index.ts

import { describe, it, expect } from 'vitest';
import { notes, type Note, type NewNote } from '@/drizzle/schema';

describe('Notes Schema', () => {
  it('notes 테이블이 정의되어 있어야 함', () => {
    expect(notes).toBeDefined();
  });

  it('Note 타입이 모든 필수 필드를 포함해야 함', () => {
    const mockNote: Note = {
      id: 'test-uuid',
      userId: 'user-uuid',
      title: '테스트 제목',
      content: '테스트 내용',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(mockNote.id).toBeDefined();
    expect(mockNote.userId).toBeDefined();
    expect(mockNote.title).toBeDefined();
    expect(mockNote.content).toBeDefined();
    expect(mockNote.createdAt).toBeDefined();
    expect(mockNote.updatedAt).toBeDefined();
  });

  it('NewNote 타입이 선택적 필드를 제외한 필수 필드를 포함해야 함', () => {
    const mockNewNote: NewNote = {
      userId: 'user-uuid',
      title: '새 노트 제목',
      content: '새 노트 내용',
    };

    expect(mockNewNote.userId).toBeDefined();
    expect(mockNewNote.title).toBeDefined();
    expect(mockNewNote.content).toBeDefined();

    // id, createdAt, updatedAt는 선택적이므로 없어도 됨
    expect('id' in mockNewNote).toBe(false);
  });

  it('NewNote에 선택적 필드를 포함할 수 있어야 함', () => {
    const mockNewNoteWithOptional: NewNote = {
      id: 'custom-uuid',
      userId: 'user-uuid',
      title: '새 노트 제목',
      content: '새 노트 내용',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(mockNewNoteWithOptional.id).toBeDefined();
    expect(mockNewNoteWithOptional.createdAt).toBeDefined();
    expect(mockNewNoteWithOptional.updatedAt).toBeDefined();
  });

  it('notes 테이블의 컬럼 정보가 올바르게 정의되어야 함', () => {
    // 테이블 스키마 구조 확인
    expect(notes.id).toBeDefined();
    expect(notes.userId).toBeDefined();
    expect(notes.title).toBeDefined();
    expect(notes.content).toBeDefined();
    expect(notes.createdAt).toBeDefined();
    expect(notes.updatedAt).toBeDefined();
  });
});

