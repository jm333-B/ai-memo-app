// __tests__/lib/db/index.test.ts
// Drizzle 클라이언트 연결 및 기본 기능 테스트
// 데이터베이스 연결, 스키마 타입, 기본 CRUD 작동 확인
// 관련 파일: lib/db/index.ts, drizzle/schema.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, schema, type Note, type NewNote } from '@/lib/db';
import { eq } from 'drizzle-orm';

describe('Drizzle Client', () => {
  let testUserId: string;
  let createdNoteId: string | undefined;

  beforeAll(() => {
    // 테스트용 UUID 생성
    testUserId = crypto.randomUUID();
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (createdNoteId) {
      try {
        await db.delete(schema.notes).where(eq(schema.notes.id, createdNoteId));
      } catch (error) {
        console.warn('테스트 데이터 정리 실패:', error);
      }
    }
  });

  it('Drizzle 클라이언트가 정상적으로 초기화되어야 함', () => {
    expect(db).toBeDefined();
    expect(schema).toBeDefined();
    expect(schema.notes).toBeDefined();
  });

  it('스키마 타입이 올바르게 정의되어야 함', () => {
    const newNote: NewNote = {
      userId: testUserId,
      title: '테스트 노트',
      content: '테스트 내용',
    };

    expect(newNote.userId).toBeDefined();
    expect(newNote.title).toBeDefined();
    expect(newNote.content).toBeDefined();
  });

  it('노트를 생성할 수 있어야 함 (insert)', async () => {
    const newNote: NewNote = {
      userId: testUserId,
      title: '테스트 노트 제목',
      content: '테스트 노트 내용입니다.',
    };

    const result = await db.insert(schema.notes).values(newNote).returning();

    expect(result).toHaveLength(1);
    expect(result[0]).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].userId).toBe(testUserId);
    expect(result[0].title).toBe(newNote.title);
    expect(result[0].content).toBe(newNote.content);
    expect(result[0].createdAt).toBeDefined();
    expect(result[0].updatedAt).toBeDefined();

    // 정리를 위해 ID 저장
    createdNoteId = result[0].id;
  });

  it('노트를 조회할 수 있어야 함 (select)', async () => {
    if (!createdNoteId) {
      // 노트가 없으면 생성
      const newNote: NewNote = {
        userId: testUserId,
        title: '조회 테스트 노트',
        content: '조회 테스트 내용',
      };
      const result = await db.insert(schema.notes).values(newNote).returning();
      createdNoteId = result[0].id;
    }

    const notes = await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.id, createdNoteId));

    expect(notes).toHaveLength(1);
    expect(notes[0].id).toBe(createdNoteId);
    expect(notes[0].userId).toBe(testUserId);
  });

  it('사용자 ID로 노트를 필터링할 수 있어야 함', async () => {
    const notes = await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.userId, testUserId));

    expect(Array.isArray(notes)).toBe(true);
    notes.forEach((note) => {
      expect(note.userId).toBe(testUserId);
    });
  });
});

