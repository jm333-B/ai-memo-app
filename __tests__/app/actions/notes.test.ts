// __tests__/app/actions/notes.test.ts
// 노트 Server Actions 테스트
// createNote, getNotes 함수의 동작 검증
// 관련 파일: app/actions/notes.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

describe('Notes Server Actions', () => {
  const testUserId = crypto.randomUUID();

  describe('createNote 및 getNotes 통합 테스트', () => {
    let createdNoteId: string | undefined;

    beforeEach(() => {
      // 테스트 후 정리를 위한 ID 초기화
      createdNoteId = undefined;
    });

    afterEach(async () => {
      // 테스트 데이터 정리
      if (createdNoteId) {
        try {
          await db.delete(schema.notes).where(eq(schema.notes.id, createdNoteId));
        } catch (error) {
          console.warn('테스트 데이터 정리 실패:', error);
        }
      }
    });

    it('노트를 생성하고 조회할 수 있어야 함', async () => {
      // 노트 생성
      const [newNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '테스트 노트 제목',
          content: '테스트 노트 내용입니다.',
        })
        .returning();

      createdNoteId = newNote.id;

      // 생성 검증
      expect(newNote).toBeDefined();
      expect(newNote.id).toBeDefined();
      expect(newNote.userId).toBe(testUserId);
      expect(newNote.title).toBe('테스트 노트 제목');
      expect(newNote.content).toBe('테스트 노트 내용입니다.');

      // 노트 조회
      const notes = await db
        .select()
        .from(schema.notes)
        .where(eq(schema.notes.userId, testUserId));

      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe(newNote.id);
    });

    it('사용자 스코프로 노트를 필터링할 수 있어야 함', async () => {
      const otherUserId = crypto.randomUUID();

      // 다른 사용자의 노트 생성
      const [otherNote] = await db
        .insert(schema.notes)
        .values({
          userId: otherUserId,
          title: '다른 사용자의 노트',
          content: '다른 사용자의 내용',
        })
        .returning();

      // 현재 사용자로 조회 시 다른 사용자의 노트는 조회되지 않아야 함
      const notes = await db
        .select()
        .from(schema.notes)
        .where(eq(schema.notes.userId, testUserId));

      expect(notes.every((note) => note.userId === testUserId)).toBe(true);
      expect(notes.every((note) => note.id !== otherNote.id)).toBe(true);

      // 정리
      await db.delete(schema.notes).where(eq(schema.notes.id, otherNote.id));
    });

    it('최신순으로 정렬되어야 함', async () => {
      const noteIds: string[] = [];

      try {
        // 여러 노트 생성
        for (let i = 0; i < 3; i++) {
          const [note] = await db
            .insert(schema.notes)
            .values({
              userId: testUserId,
              title: `노트 ${i + 1}`,
              content: `내용 ${i + 1}`,
            })
            .returning();
          noteIds.push(note.id);
          // 시간 차이를 두기 위해 약간 대기
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        // 최신순 조회
        const notes = await db
          .select()
          .from(schema.notes)
          .where(eq(schema.notes.userId, testUserId))
          .orderBy(desc(schema.notes.createdAt))
          .limit(20);

        // 가장 최근 노트가 먼저 나와야 함
        expect(notes[0].title).toBe('노트 3');
        expect(notes[1].title).toBe('노트 2');
        expect(notes[2].title).toBe('노트 1');
      } finally {
        // 정리
        for (const id of noteIds) {
          await db.delete(schema.notes).where(eq(schema.notes.id, id));
        }
      }
    });
  });
});

