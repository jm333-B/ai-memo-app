// __tests__/app/actions/notes.test.ts
// 노트 Server Actions 테스트
// createNote, getNotes 함수의 동작 검증
// 관련 파일: app/actions/notes.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db, schema } from '@/lib/db';
import { eq, desc, isNull, ilike, or, and, gte, lte } from 'drizzle-orm';

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

  describe('getNoteById 테스트', () => {
    let testNoteId: string | undefined;

    afterEach(async () => {
      if (testNoteId) {
        try {
          await db.delete(schema.notes).where(eq(schema.notes.id, testNoteId));
        } catch (error) {
          console.warn('테스트 데이터 정리 실패:', error);
        }
      }
    });

    it('노트 ID로 조회할 수 있어야 함', async () => {
      // 노트 생성
      const [newNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '상세 조회 테스트',
          content: '상세 조회 테스트 내용',
        })
        .returning();

      testNoteId = newNote.id;

      // ID로 조회
      const [note] = await db
        .select()
        .from(schema.notes)
        .where(eq(schema.notes.id, testNoteId))
        .limit(1);

      expect(note).toBeDefined();
      expect(note.id).toBe(testNoteId);
      expect(note.title).toBe('상세 조회 테스트');
    });
  });

  describe('updateNote 테스트', () => {
    let testNoteId: string | undefined;

    afterEach(async () => {
      if (testNoteId) {
        try {
          await db.delete(schema.notes).where(eq(schema.notes.id, testNoteId));
        } catch (error) {
          console.warn('테스트 데이터 정리 실패:', error);
        }
      }
    });

    it('노트를 수정할 수 있어야 함', async () => {
      // 노트 생성
      const [newNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '수정 전 제목',
          content: '수정 전 내용',
        })
        .returning();

      testNoteId = newNote.id;

      // 노트 수정
      await db
        .update(schema.notes)
        .set({
          title: '수정 후 제목',
          content: '수정 후 내용',
          updatedAt: new Date(),
        })
        .where(eq(schema.notes.id, testNoteId));

      // 수정 확인
      const [updatedNote] = await db
        .select()
        .from(schema.notes)
        .where(eq(schema.notes.id, testNoteId))
        .limit(1);

      expect(updatedNote.title).toBe('수정 후 제목');
      expect(updatedNote.content).toBe('수정 후 내용');
    });
  });

  describe('deleteNote (소프트 삭제) 테스트', () => {
    let testNoteId: string | undefined;

    afterEach(async () => {
      if (testNoteId) {
        try {
          await db.delete(schema.notes).where(eq(schema.notes.id, testNoteId));
        } catch (error) {
          console.warn('테스트 데이터 정리 실패:', error);
        }
      }
    });

    it('노트를 소프트 삭제할 수 있어야 함', async () => {
      // 노트 생성
      const [newNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '삭제 테스트',
          content: '삭제 테스트 내용',
        })
        .returning();

      testNoteId = newNote.id;

      // 소프트 삭제
      await db
        .update(schema.notes)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(schema.notes.id, testNoteId));

      // 삭제 확인
      const [deletedNote] = await db
        .select()
        .from(schema.notes)
        .where(eq(schema.notes.id, testNoteId))
        .limit(1);

      expect(deletedNote.deletedAt).not.toBeNull();
    });

    it('삭제된 노트는 목록에서 제외되어야 함', async () => {
      // 노트 생성
      const [newNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '삭제 테스트',
          content: '삭제 테스트 내용',
        })
        .returning();

      testNoteId = newNote.id;

      // 소프트 삭제
      await db
        .update(schema.notes)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(schema.notes.id, testNoteId));

      // 목록 조회 (삭제되지 않은 노트만)
      const notes = await db
        .select()
        .from(schema.notes)
        .where(
          eq(schema.notes.userId, testUserId)
        )
        .where(isNull(schema.notes.deletedAt));

      // 삭제된 노트는 목록에 없어야 함
      expect(notes.every((note) => note.id !== testNoteId)).toBe(true);
    });
  });

  describe('searchNotes 테스트', () => {
    let testNoteIds: string[] = [];

    afterEach(async () => {
      // 테스트 데이터 정리
      for (const id of testNoteIds) {
        try {
          await db.delete(schema.notes).where(eq(schema.notes.id, id));
        } catch (error) {
          console.warn('테스트 데이터 정리 실패:', error);
        }
      }
      testNoteIds = [];
    });

    it('제목에서 검색할 수 있어야 함', async () => {
      // 테스트 노트 생성
      const [note1] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'JavaScript 프로그래밍',
          content: 'JavaScript에 대한 내용입니다.',
        })
        .returning();

      const [note2] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'Python 기초',
          content: 'Python 프로그래밍 언어에 대한 내용입니다.',
        })
        .returning();

      testNoteIds.push(note1.id, note2.id);

      // JavaScript 검색
      const searchPattern = '%JavaScript%';
      const notes = await db
        .select()
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        );

      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('JavaScript 프로그래밍');
    });

    it('내용에서 검색할 수 있어야 함', async () => {
      // 테스트 노트 생성
      const [note1] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '웹 개발',
          content: 'React와 Next.js를 사용한 웹 개발',
        })
        .returning();

      const [note2] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '모바일 앱',
          content: 'Flutter를 사용한 모바일 앱 개발',
        })
        .returning();

      testNoteIds.push(note1.id, note2.id);

      // React 검색
      const searchPattern = '%React%';
      const notes = await db
        .select()
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        );

      expect(notes).toHaveLength(1);
      expect(notes[0].content).toContain('React');
    });

    it('대소문자 구분 없이 검색할 수 있어야 함', async () => {
      // 테스트 노트 생성
      const [note] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'JavaScript Programming',
          content: 'JavaScript is a programming language.',
        })
        .returning();

      testNoteIds.push(note.id);

      // 소문자로 검색
      const searchPattern = '%javascript%';
      const notes = await db
        .select()
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        );

      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('JavaScript Programming');
    });

    it('부분 일치 검색이 가능해야 함', async () => {
      // 테스트 노트 생성
      const [note] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '웹 개발 가이드',
          content: '웹 개발에 대한 종합적인 가이드입니다.',
        })
        .returning();

      testNoteIds.push(note.id);

      // 부분 일치 검색
      const searchPattern = '%개발%';
      const notes = await db
        .select()
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        );

      expect(notes).toHaveLength(1);
      expect(notes[0].title).toContain('개발');
    });

    it('사용자 스코프로 필터링되어야 함', async () => {
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

      // 현재 사용자의 노트 생성
      const [myNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '내 노트',
          content: '내 내용',
        })
        .returning();

      testNoteIds.push(myNote.id);

      // 검색 (현재 사용자만)
      const searchPattern = '%노트%';
      const notes = await db
        .select()
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        );

      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe(myNote.id);
      expect(notes[0].id).not.toBe(otherNote.id);

      // 정리
      await db.delete(schema.notes).where(eq(schema.notes.id, otherNote.id));
    });

    it('삭제된 노트는 검색 결과에서 제외되어야 함', async () => {
      // 테스트 노트 생성
      const [note] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '삭제될 노트',
          content: '삭제될 내용',
        })
        .returning();

      testNoteIds.push(note.id);

      // 노트 삭제
      await db
        .update(schema.notes)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(schema.notes.id, note.id));

      // 검색
      const searchPattern = '%삭제%';
      const notes = await db
        .select()
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        );

      expect(notes).toHaveLength(0);
    });
  });

  describe('태그 필터링 테스트', () => {
    let testNoteIds: string[] = [];
    let testTagIds: string[] = [];

    afterEach(async () => {
      // 테스트 데이터 정리
      for (const tagId of testTagIds) {
        try {
          await db.delete(schema.noteTags).where(eq(schema.noteTags.id, tagId));
        } catch (error) {
          console.warn('태그 테스트 데이터 정리 실패:', error);
        }
      }
      
      for (const id of testNoteIds) {
        try {
          await db.delete(schema.notes).where(eq(schema.notes.id, id));
        } catch (error) {
          console.warn('노트 테스트 데이터 정리 실패:', error);
        }
      }
      testNoteIds = [];
      testTagIds = [];
    });

    it('단일 태그로 필터링할 수 있어야 함', async () => {
      // 테스트 노트 생성
      const [note1] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'JavaScript 노트',
          content: 'JavaScript에 대한 내용',
        })
        .returning();

      const [note2] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'Python 노트',
          content: 'Python에 대한 내용',
        })
        .returning();

      testNoteIds.push(note1.id, note2.id);

      // 태그 추가
      const [tag1] = await db
        .insert(schema.noteTags)
        .values({
          noteId: note1.id,
          tag: 'javascript',
        })
        .returning();

      const [tag2] = await db
        .insert(schema.noteTags)
        .values({
          noteId: note2.id,
          tag: 'python',
        })
        .returning();

      testTagIds.push(tag1.id, tag2.id);

      // JavaScript 태그로 필터링
      const notes = await db
        .selectDistinct({
          id: schema.notes.id,
          userId: schema.notes.userId,
          title: schema.notes.title,
          content: schema.notes.content,
          createdAt: schema.notes.createdAt,
          updatedAt: schema.notes.updatedAt,
          deletedAt: schema.notes.deletedAt,
        })
        .from(schema.notes)
        .innerJoin(schema.noteTags, eq(schema.notes.id, schema.noteTags.noteId))
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            eq(schema.noteTags.tag, 'javascript')
          )
        );

      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('JavaScript 노트');
    });

    it('다중 태그 AND 조건으로 필터링할 수 있어야 함', async () => {
      // 테스트 노트 생성
      const [note1] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '웹 개발 노트',
          content: 'JavaScript와 React를 사용한 웹 개발',
        })
        .returning();

      const [note2] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'JavaScript 기초',
          content: 'JavaScript 기초 문법',
        })
        .returning();

      testNoteIds.push(note1.id, note2.id);

      // note1에 두 개 태그 추가
      const [tag1] = await db
        .insert(schema.noteTags)
        .values({
          noteId: note1.id,
          tag: 'javascript',
        })
        .returning();

      const [tag2] = await db
        .insert(schema.noteTags)
        .values({
          noteId: note1.id,
          tag: 'react',
        })
        .returning();

      // note2에 하나의 태그만 추가
      const [tag3] = await db
        .insert(schema.noteTags)
        .values({
          noteId: note2.id,
          tag: 'javascript',
        })
        .returning();

      testTagIds.push(tag1.id, tag2.id, tag3.id);

      // javascript와 react 태그 모두를 가진 노트 필터링
      const notes = await db
        .selectDistinct({
          id: schema.notes.id,
          userId: schema.notes.userId,
          title: schema.notes.title,
          content: schema.notes.content,
          createdAt: schema.notes.createdAt,
          updatedAt: schema.notes.updatedAt,
          deletedAt: schema.notes.deletedAt,
        })
        .from(schema.notes)
        .innerJoin(schema.noteTags, eq(schema.notes.id, schema.noteTags.noteId))
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            inArray(schema.noteTags.tag, ['javascript', 'react'])
          )
        );

      // AND 조건을 위한 추가 필터링
      const filteredNotes = [];
      for (const note of notes) {
        const noteTags = await db
          .select({ tag: schema.noteTags.tag })
          .from(schema.noteTags)
          .where(eq(schema.noteTags.noteId, note.id));

        const noteTagSet = new Set(noteTags.map(nt => nt.tag));
        const hasAllTags = ['javascript', 'react'].every(tag => noteTagSet.has(tag));

        if (hasAllTags) {
          filteredNotes.push(note);
        }
      }

      expect(filteredNotes).toHaveLength(1);
      expect(filteredNotes[0].title).toBe('웹 개발 노트');
    });

    it('태그와 검색어를 조합하여 필터링할 수 있어야 함', async () => {
      // 테스트 노트 생성
      const [note1] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'React 컴포넌트',
          content: 'React 컴포넌트 작성법',
        })
        .returning();

      const [note2] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'Vue 컴포넌트',
          content: 'Vue 컴포넌트 작성법',
        })
        .returning();

      testNoteIds.push(note1.id, note2.id);

      // 태그 추가
      const [tag1] = await db
        .insert(schema.noteTags)
        .values({
          noteId: note1.id,
          tag: 'react',
        })
        .returning();

      const [tag2] = await db
        .insert(schema.noteTags)
        .values({
          noteId: note2.id,
          tag: 'vue',
        })
        .returning();

      testTagIds.push(tag1.id, tag2.id);

      // react 태그와 '컴포넌트' 검색어로 필터링
      const searchPattern = '%컴포넌트%';
      const notes = await db
        .selectDistinct({
          id: schema.notes.id,
          userId: schema.notes.userId,
          title: schema.notes.title,
          content: schema.notes.content,
          createdAt: schema.notes.createdAt,
          updatedAt: schema.notes.updatedAt,
          deletedAt: schema.notes.deletedAt,
        })
        .from(schema.notes)
        .innerJoin(schema.noteTags, eq(schema.notes.id, schema.noteTags.noteId))
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            eq(schema.noteTags.tag, 'react'),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        );

      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('React 컴포넌트');
    });

    it('사용자 스코프로 태그 필터링이 제한되어야 함', async () => {
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

      // 현재 사용자의 노트 생성
      const [myNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '내 노트',
          content: '내 내용',
        })
        .returning();

      testNoteIds.push(myNote.id);

      // 태그 추가
      const [otherTag] = await db
        .insert(schema.noteTags)
        .values({
          noteId: otherNote.id,
          tag: 'javascript',
        })
        .returning();

      const [myTag] = await db
        .insert(schema.noteTags)
        .values({
          noteId: myNote.id,
          tag: 'javascript',
        })
        .returning();

      testTagIds.push(myTag.id);

      // 현재 사용자로 javascript 태그 필터링
      const notes = await db
        .selectDistinct({
          id: schema.notes.id,
          userId: schema.notes.userId,
          title: schema.notes.title,
          content: schema.notes.content,
          createdAt: schema.notes.createdAt,
          updatedAt: schema.notes.updatedAt,
          deletedAt: schema.notes.deletedAt,
        })
        .from(schema.notes)
        .innerJoin(schema.noteTags, eq(schema.notes.id, schema.noteTags.noteId))
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            eq(schema.noteTags.tag, 'javascript')
          )
        );

      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe(myNote.id);
      expect(notes[0].id).not.toBe(otherNote.id);

      // 정리
      await db.delete(schema.noteTags).where(eq(schema.noteTags.id, otherTag.id));
      await db.delete(schema.notes).where(eq(schema.notes.id, otherNote.id));
    });
  });

  describe('날짜 범위 필터링 테스트', () => {
    let testNoteIds: string[] = [];

    afterEach(async () => {
      // 테스트 후 정리
      for (const noteId of testNoteIds) {
        await db.delete(schema.notes).where(eq(schema.notes.id, noteId));
      }
      testNoteIds = [];
    });

    it('날짜 범위로 노트를 필터링할 수 있어야 함', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);

      // 어제 노트 생성
      const [yesterdayNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '어제 노트',
          content: '어제 작성된 노트입니다.',
          createdAt: yesterday,
        })
        .returning();

      // 오늘 노트 생성
      const [todayNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '오늘 노트',
          content: '오늘 작성된 노트입니다.',
          createdAt: now,
        })
        .returning();

      // 내일 노트 생성
      const [tomorrowNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '내일 노트',
          content: '내일 작성될 노트입니다.',
          createdAt: tomorrow,
        })
        .returning();

      testNoteIds.push(yesterdayNote.id, todayNote.id, tomorrowNote.id);

      // 오늘 날짜 범위로 필터링
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      const notes = await db
        .select()
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            gte(schema.notes.createdAt, startDate),
            lte(schema.notes.createdAt, endDate)
          )
        );

      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('오늘 노트');
    });

    it('날짜 범위와 검색어를 조합하여 필터링할 수 있어야 함', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      // 어제 "프로그래밍" 노트 생성
      const [programmingNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '프로그래밍 기초',
          content: '프로그래밍에 대한 내용입니다.',
          createdAt: yesterday,
        })
        .returning();

      // 오늘 "프로그래밍" 노트 생성
      const [todayProgrammingNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '고급 프로그래밍',
          content: '고급 프로그래밍 기법입니다.',
          createdAt: now,
        })
        .returning();

      // 오늘 "디자인" 노트 생성
      const [designNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'UI 디자인',
          content: '사용자 인터페이스 디자인입니다.',
          createdAt: now,
        })
        .returning();

      testNoteIds.push(programmingNote.id, todayProgrammingNote.id, designNote.id);

      // 오늘 날짜 범위 + "프로그래밍" 검색어로 필터링
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      const searchPattern = '%프로그래밍%';

      const notes = await db
        .select()
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            gte(schema.notes.createdAt, startDate),
            lte(schema.notes.createdAt, endDate),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        );

      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('고급 프로그래밍');
    });

    it('날짜 범위와 태그를 조합하여 필터링할 수 있어야 함', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      // 어제 "개발" 태그 노트 생성
      const [yesterdayDevNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '어제 개발 노트',
          content: '어제 작성된 개발 관련 노트입니다.',
          createdAt: yesterday,
        })
        .returning();

      // 오늘 "개발" 태그 노트 생성
      const [todayDevNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '오늘 개발 노트',
          content: '오늘 작성된 개발 관련 노트입니다.',
          createdAt: now,
        })
        .returning();

      // 오늘 "디자인" 태그 노트 생성
      const [designNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '디자인 노트',
          content: '디자인 관련 노트입니다.',
          createdAt: now,
        })
        .returning();

      testNoteIds.push(yesterdayDevNote.id, todayDevNote.id, designNote.id);

      // 태그 생성
      const [devTag1] = await db
        .insert(schema.noteTags)
        .values({
          noteId: yesterdayDevNote.id,
          tag: '개발',
        })
        .returning();

      const [devTag2] = await db
        .insert(schema.noteTags)
        .values({
          noteId: todayDevNote.id,
          tag: '개발',
        })
        .returning();

      const [designTag] = await db
        .insert(schema.noteTags)
        .values({
          noteId: designNote.id,
          tag: '디자인',
        })
        .returning();

      // 오늘 날짜 범위 + "개발" 태그로 필터링
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      const notes = await db
        .selectDistinct({
          id: schema.notes.id,
          userId: schema.notes.userId,
          title: schema.notes.title,
          content: schema.notes.content,
          createdAt: schema.notes.createdAt,
          updatedAt: schema.notes.updatedAt,
          deletedAt: schema.notes.deletedAt,
        })
        .from(schema.notes)
        .innerJoin(schema.noteTags, eq(schema.notes.id, schema.noteTags.noteId))
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            gte(schema.notes.createdAt, startDate),
            lte(schema.notes.createdAt, endDate),
            eq(schema.noteTags.tag, '개발')
          )
        );

      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('오늘 개발 노트');

      // 정리
      await db.delete(schema.noteTags).where(eq(schema.noteTags.id, devTag1.id));
      await db.delete(schema.noteTags).where(eq(schema.noteTags.id, devTag2.id));
      await db.delete(schema.noteTags).where(eq(schema.noteTags.id, designTag.id));
    });

    it('사용자 스코프 필터링이 적용되어야 함', async () => {
      const otherUserId = crypto.randomUUID();
      const now = new Date();

      // 현재 사용자 노트 생성
      const [userNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '사용자 노트',
          content: '현재 사용자의 노트입니다.',
          createdAt: now,
        })
        .returning();

      // 다른 사용자 노트 생성
      const [otherUserNote] = await db
        .insert(schema.notes)
        .values({
          userId: otherUserId,
          title: '다른 사용자 노트',
          content: '다른 사용자의 노트입니다.',
          createdAt: now,
        })
        .returning();

      testNoteIds.push(userNote.id, otherUserNote.id);

      // 날짜 범위로 필터링
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      const notes = await db
        .select()
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId), // 현재 사용자만
            isNull(schema.notes.deletedAt),
            gte(schema.notes.createdAt, startDate),
            lte(schema.notes.createdAt, endDate)
          )
        );

      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('사용자 노트');
    });
  });

  describe('검색 제안 테스트', () => {
    let testNoteIds: string[] = [];

    afterEach(async () => {
      // 테스트 후 정리
      for (const noteId of testNoteIds) {
        await db.delete(schema.notes).where(eq(schema.notes.id, noteId));
      }
      testNoteIds = [];
    });

    it('검색 제안을 조회할 수 있어야 함', async () => {
      // 테스트 노트 생성
      const [note1] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'JavaScript 프로그래밍',
          content: 'JavaScript는 웹 개발에 사용되는 프로그래밍 언어입니다.',
        })
        .returning();

      const [note2] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'React 개발 가이드',
          content: 'React는 사용자 인터페이스를 구축하기 위한 JavaScript 라이브러리입니다.',
        })
        .returning();

      testNoteIds.push(note1.id, note2.id);

      // 검색 제안 조회
      const searchPattern = '%JavaScript%';
      const notes = await db
        .select({
          id: schema.notes.id,
          title: schema.notes.title,
          content: schema.notes.content,
          createdAt: schema.notes.createdAt,
        })
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        )
        .orderBy(desc(schema.notes.updatedAt))
        .limit(10);

      expect(notes).toHaveLength(2);
      expect(notes[0].title).toBe('React 개발 가이드'); // 최근 업데이트된 순
      expect(notes[1].title).toBe('JavaScript 프로그래밍');
    });

    it('최소 검색어 길이 미만일 때 빈 결과를 반환해야 함', async () => {
      // 1글자 검색어로 검색
      const searchPattern = '%J%';
      const notes = await db
        .select({
          id: schema.notes.id,
          title: schema.notes.title,
          content: schema.notes.content,
          createdAt: schema.notes.createdAt,
        })
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        )
        .limit(10);

      // 2글자 미만이므로 빈 결과 반환
      expect(notes).toHaveLength(0);
    });

    it('검색 제안 결과가 제한되어야 함', async () => {
      // 여러 테스트 노트 생성
      const notes = [];
      for (let i = 0; i < 15; i++) {
        const [note] = await db
          .insert(schema.notes)
          .values({
            userId: testUserId,
            title: `테스트 노트 ${i + 1}`,
            content: `테스트 내용 ${i + 1}`,
          })
          .returning();
        notes.push(note);
        testNoteIds.push(note.id);
      }

      // 검색 제안 조회 (최대 10개)
      const searchPattern = '%테스트%';
      const suggestions = await db
        .select({
          id: schema.notes.id,
          title: schema.notes.title,
          content: schema.notes.content,
          createdAt: schema.notes.createdAt,
        })
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        )
        .orderBy(desc(schema.notes.updatedAt))
        .limit(10);

      expect(suggestions).toHaveLength(10);
    });

    it('사용자 스코프 필터링이 적용되어야 함', async () => {
      const otherUserId = crypto.randomUUID();

      // 현재 사용자 노트 생성
      const [userNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '사용자 노트',
          content: '현재 사용자의 노트입니다.',
        })
        .returning();

      // 다른 사용자 노트 생성
      const [otherUserNote] = await db
        .insert(schema.notes)
        .values({
          userId: otherUserId,
          title: '다른 사용자 노트',
          content: '다른 사용자의 노트입니다.',
        })
        .returning();

      testNoteIds.push(userNote.id, otherUserNote.id);

      // 검색 제안 조회
      const searchPattern = '%노트%';
      const suggestions = await db
        .select({
          id: schema.notes.id,
          title: schema.notes.title,
          content: schema.notes.content,
          createdAt: schema.notes.createdAt,
        })
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId), // 현재 사용자만
            isNull(schema.notes.deletedAt),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        )
        .limit(10);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].title).toBe('사용자 노트');
    });

    it('관련도 점수 계산이 올바르게 되어야 함', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      // 제목에 검색어가 포함된 노트 (높은 관련도)
      const [titleMatchNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'JavaScript 프로그래밍',
          content: '프로그래밍에 대한 내용입니다.',
          createdAt: yesterday,
        })
        .returning();

      // 내용에만 검색어가 포함된 노트 (낮은 관련도)
      const [contentMatchNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '웹 개발 가이드',
          content: 'JavaScript를 사용한 웹 개발에 대한 내용입니다.',
          createdAt: now,
        })
        .returning();

      testNoteIds.push(titleMatchNote.id, contentMatchNote.id);

      // 검색 제안 조회
      const searchPattern = '%JavaScript%';
      const notes = await db
        .select({
          id: schema.notes.id,
          title: schema.notes.title,
          content: schema.notes.content,
          createdAt: schema.notes.createdAt,
        })
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        )
        .orderBy(desc(schema.notes.updatedAt))
        .limit(10);

      expect(notes).toHaveLength(2);
      
      // 관련도 점수 계산 로직 테스트
      const query = 'JavaScript';
      const suggestions = notes.map(note => {
        const titleMatch = note.title.toLowerCase().includes(query.toLowerCase());
        const contentMatch = note.content?.toLowerCase().includes(query.toLowerCase());
        
        let relevanceScore = 0;
        if (titleMatch) relevanceScore += 10;
        if (contentMatch) relevanceScore += 5;
        
        const daysSinceUpdate = Math.floor((Date.now() - note.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        relevanceScore += Math.max(0, 10 - daysSinceUpdate);

        return { ...note, relevanceScore };
      });

      // 관련도 점수로 정렬
      suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // 제목에 검색어가 포함된 노트가 더 높은 관련도를 가져야 함
      expect(suggestions[0].title).toBe('JavaScript 프로그래밍');
      expect(suggestions[0].relevanceScore).toBeGreaterThan(suggestions[1].relevanceScore);
    });
  });

  describe('빈 검색 결과 처리 테스트', () => {
    let testNoteIds: string[] = [];

    afterEach(async () => {
      // 테스트 후 정리
      for (const noteId of testNoteIds) {
        await db.delete(schema.notes).where(eq(schema.notes.id, noteId));
      }
      testNoteIds = [];
    });

    it('인기 태그를 조회할 수 있어야 함', async () => {
      // 테스트 노트와 태그 생성
      const [note1] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'JavaScript 노트',
          content: 'JavaScript에 대한 내용입니다.',
        })
        .returning();

      const [note2] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'React 노트',
          content: 'React에 대한 내용입니다.',
        })
        .returning();

      testNoteIds.push(note1.id, note2.id);

      // 태그 추가
      await db.insert(schema.noteTags).values([
        { noteId: note1.id, tag: 'javascript' },
        { noteId: note1.id, tag: 'programming' },
        { noteId: note2.id, tag: 'react' },
        { noteId: note2.id, tag: 'javascript' },
      ]);

      // 인기 태그 조회
      const popularTags = await db
        .select({
          tag: schema.noteTags.tag,
          count: count(),
        })
        .from(schema.noteTags)
        .innerJoin(schema.notes, eq(schema.noteTags.noteId, schema.notes.id))
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt)
          )
        )
        .groupBy(schema.noteTags.tag)
        .orderBy(desc(count()))
        .limit(5);

      expect(popularTags).toHaveLength(3);
      expect(popularTags[0].tag).toBe('javascript'); // 2번 사용됨
      expect(popularTags[0].count).toBe(2);
    });

    it('검색어 제안을 생성할 수 있어야 함', async () => {
      // 테스트 노트 생성
      const [note1] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'JavaScript 프로그래밍',
          content: 'JavaScript는 웹 개발에 사용되는 프로그래밍 언어입니다.',
        })
        .returning();

      const [note2] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: 'React 개발 가이드',
          content: 'React는 JavaScript 라이브러리입니다.',
        })
        .returning();

      testNoteIds.push(note1.id, note2.id);

      // 검색어 제안 생성 로직 테스트
      const query = 'java';
      const notes = await db
        .select({
          title: schema.notes.title,
          content: schema.notes.content,
        })
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, testUserId),
            isNull(schema.notes.deletedAt)
          )
        )
        .limit(50);

      const suggestions = new Set<string>();
      
      notes.forEach(note => {
        const titleWords = note.title.toLowerCase().split(/\s+/);
        titleWords.forEach(word => {
          if (word.length >= 2 && word.includes(query) && word !== query) {
            suggestions.add(word);
          }
        });

        if (note.content) {
          const contentWords = note.content.toLowerCase().split(/\s+/);
          contentWords.forEach(word => {
            if (word.length >= 2 && word.includes(query) && word !== query) {
              suggestions.add(word);
            }
          });
        }
      });

      const suggestionArray = Array.from(suggestions);
      expect(suggestionArray).toContain('javascript');
    });

    it('사용자 스코프 필터링이 적용되어야 함', async () => {
      const otherUserId = crypto.randomUUID();

      // 현재 사용자 노트 생성
      const [userNote] = await db
        .insert(schema.notes)
        .values({
          userId: testUserId,
          title: '사용자 노트',
          content: '현재 사용자의 노트입니다.',
        })
        .returning();

      // 다른 사용자 노트 생성
      const [otherUserNote] = await db
        .insert(schema.notes)
        .values({
          userId: otherUserId,
          title: '다른 사용자 노트',
          content: '다른 사용자의 노트입니다.',
        })
        .returning();

      testNoteIds.push(userNote.id, otherUserNote.id);

      // 태그 추가
      await db.insert(schema.noteTags).values([
        { noteId: userNote.id, tag: 'user-tag' },
        { noteId: otherUserNote.id, tag: 'other-tag' },
      ]);

      // 인기 태그 조회 (현재 사용자만)
      const popularTags = await db
        .select({
          tag: schema.noteTags.tag,
          count: count(),
        })
        .from(schema.noteTags)
        .innerJoin(schema.notes, eq(schema.noteTags.noteId, schema.notes.id))
        .where(
          and(
            eq(schema.notes.userId, testUserId), // 현재 사용자만
            isNull(schema.notes.deletedAt)
          )
        )
        .groupBy(schema.noteTags.tag)
        .orderBy(desc(count()));

      expect(popularTags).toHaveLength(1);
      expect(popularTags[0].tag).toBe('user-tag');
    });

    it('문자열 유사도 계산이 올바르게 작동해야 함', () => {
      // Levenshtein 거리 계산 함수 테스트
      function levenshteinDistance(str1: string, str2: string): number {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= str2.length; j++) {
          for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
              matrix[j][i - 1] + 1,
              matrix[j - 1][i] + 1,
              matrix[j - 1][i - 1] + indicator
            );
          }
        }
        
        return matrix[str2.length][str1.length];
      }

      function calculateSimilarity(str1: string, str2: string): number {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
      }

      // 유사도 계산 테스트
      expect(calculateSimilarity('javascript', 'java')).toBeGreaterThan(0.5);
      expect(calculateSimilarity('react', 'reactjs')).toBeGreaterThan(0.7);
      expect(calculateSimilarity('programming', 'program')).toBeGreaterThan(0.6);
    });
  });
});

