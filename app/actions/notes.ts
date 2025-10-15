// app/actions/notes.ts
// 노트 관리를 위한 Server Actions
// 노트 생성, 조회, 수정, 삭제 기능 제공
// 관련 파일: lib/db/index.ts, drizzle/schema.ts, lib/validations/notes.ts

'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db, schema } from '@/lib/db';
import { createNoteSchema } from '@/lib/validations/notes';
import { createClient } from '@/lib/supabase/server';
import { generateNoteTags } from '@/app/actions/ai';
import { eq, desc, asc, count, and, isNull, isNotNull, ilike, or, inArray, gte, lte } from 'drizzle-orm';

export async function createNote(formData: FormData) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: '로그인이 필요합니다' };
    }

    // 폼 데이터 추출
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const autoGenerateTags = formData.get('autoGenerateTags') === 'true';

    // 유효성 검증
    const validation = createNoteSchema.safeParse({ title, content });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return {
        error: errors.title?.[0] || errors.content?.[0] || '입력값이 올바르지 않습니다',
      };
    }

    // 노트 생성
    const [newNote] = await db
      .insert(schema.notes)
      .values({
        userId: user.id,
        title: validation.data.title,
        content: validation.data.content,
      })
      .returning();

    // 자동 태그 생성 (백그라운드에서 실행)
    if (autoGenerateTags && newNote.content && newNote.content.trim().length > 0) {
      // 비동기로 태그 생성 (에러가 발생해도 노트 생성은 성공으로 처리)
      generateNoteTags(newNote.id).catch((error) => {
        console.error('자동 태그 생성 실패:', error);
      });
    }

    // 목록 페이지 캐시 무효화
    revalidatePath('/notes');
  } catch (error) {
    console.error('노트 생성 실패:', error);
    return { error: '노트 생성에 실패했습니다' };
  }

  // 성공 시 목록 페이지로 리다이렉션
  redirect('/notes');
}

export async function getNotes(
  page: number = 1,
  sortBy: 'latest' | 'oldest' | 'title-asc' | 'title-desc' = 'latest'
) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { notes: [], totalPages: 0, error: '로그인이 필요합니다' };
    }

    const limit = 20;
    const offset = (page - 1) * limit;

    // 정렬 옵션에 따라 orderBy 절 결정
    let orderByClause;
    switch (sortBy) {
      case 'oldest':
        orderByClause = asc(schema.notes.createdAt);
        break;
      case 'title-asc':
        orderByClause = asc(schema.notes.title);
        break;
      case 'title-desc':
        orderByClause = desc(schema.notes.title);
        break;
      case 'latest':
      default:
        orderByClause = desc(schema.notes.createdAt);
        break;
    }

    // 노트 목록 조회 (삭제되지 않은 노트만)
    const notes = await db
      .select()
      .from(schema.notes)
      .where(
        and(
          eq(schema.notes.userId, user.id),
          isNull(schema.notes.deletedAt)
        )
      )
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // 전체 노트 개수 조회 (삭제되지 않은 노트만)
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(schema.notes)
      .where(
        and(
          eq(schema.notes.userId, user.id),
          isNull(schema.notes.deletedAt)
        )
      );

    const totalPages = Math.ceil(totalCount / limit);

    return { notes, totalPages, currentPage: page };
  } catch (error) {
    console.error('노트 목록 조회 실패:', error);
    return { notes: [], totalPages: 0, error: '노트 목록을 불러올 수 없습니다' };
  }
}

export async function getNoteById(noteId: string) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { note: null, error: '로그인이 필요합니다' };
    }

    // 노트 조회 (사용자 스코프 필터링)
    const [note] = await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.id, noteId))
      .limit(1);

    // 노트가 없거나 권한이 없는 경우
    if (!note) {
      return { note: null, error: '노트를 찾을 수 없습니다' };
    }

    // 권한 검증: 현재 사용자의 노트인지 확인
    if (note.userId !== user.id) {
      return { note: null, error: '이 노트에 접근할 권한이 없습니다' };
    }

    return { note };
  } catch (error) {
    console.error('노트 조회 실패:', error);
    return { note: null, error: '노트를 불러올 수 없습니다' };
  }
}

export async function updateNote(noteId: string, formData: FormData) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: '로그인이 필요합니다' };
    }

    // 폼 데이터 추출
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    // 유효성 검증
    const validation = createNoteSchema.safeParse({ title, content });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return {
        error: errors.title?.[0] || errors.content?.[0] || '입력값이 올바르지 않습니다',
      };
    }

    // 권한 검증: 수정하려는 노트가 현재 사용자의 것인지 확인
    const [existingNote] = await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.id, noteId))
      .limit(1);

    if (!existingNote) {
      return { error: '노트를 찾을 수 없습니다' };
    }

    if (existingNote.userId !== user.id) {
      return { error: '이 노트를 수정할 권한이 없습니다' };
    }

    // 노트 업데이트 (updated_at은 자동으로 현재 시간으로 설정)
    await db
      .update(schema.notes)
      .set({
        title: validation.data.title,
        content: validation.data.content,
        updatedAt: new Date(),
      })
      .where(eq(schema.notes.id, noteId));

    // 상세 페이지 및 목록 페이지 캐시 무효화
    revalidatePath(`/notes/${noteId}`);
    revalidatePath('/notes');
  } catch (error) {
    console.error('노트 수정 실패:', error);
    return { error: '노트 수정에 실패했습니다' };
  }

  // 성공 시 상세 페이지로 리다이렉션
  redirect(`/notes/${noteId}`);
}

export async function deleteNote(noteId: string) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: '로그인이 필요합니다' };
    }

    // 권한 검증: 삭제하려는 노트가 현재 사용자의 것인지 확인
    const [existingNote] = await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.id, noteId))
      .limit(1);

    if (!existingNote) {
      return { error: '노트를 찾을 수 없습니다' };
    }

    if (existingNote.userId !== user.id) {
      return { error: '이 노트를 삭제할 권한이 없습니다' };
    }

    // 소프트 삭제: deleted_at 필드를 현재 시간으로 설정
    await db
      .update(schema.notes)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(schema.notes.id, noteId));

    // 목록 페이지 캐시 무효화
    revalidatePath('/notes');
  } catch (error) {
    console.error('노트 삭제 실패:', error);
    return { error: '노트 삭제에 실패했습니다' };
  }

  // 성공 시 목록 페이지로 리다이렉션
  redirect('/notes');
}

export async function getDeletedNotes() {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { notes: [], error: '로그인이 필요합니다' };
    }

    // 삭제된 노트 목록 조회
    const notes = await db
      .select()
      .from(schema.notes)
      .where(
        and(
          eq(schema.notes.userId, user.id),
          isNotNull(schema.notes.deletedAt)
        )
      )
      .orderBy(desc(schema.notes.deletedAt));

    return { notes };
  } catch (error) {
    console.error('삭제된 노트 목록 조회 실패:', error);
    return { notes: [], error: '삭제된 노트 목록을 불러올 수 없습니다' };
  }
}

export async function restoreNote(noteId: string) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: '로그인이 필요합니다' };
    }

    // 권한 검증: 복구하려는 노트가 현재 사용자의 것인지 확인
    const [existingNote] = await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.id, noteId))
      .limit(1);

    if (!existingNote) {
      return { error: '노트를 찾을 수 없습니다' };
    }

    if (existingNote.userId !== user.id) {
      return { error: '이 노트를 복구할 권한이 없습니다' };
    }

    // 노트 복구: deleted_at을 NULL로 설정
    await db
      .update(schema.notes)
      .set({
        deletedAt: null,
      })
      .where(eq(schema.notes.id, noteId));

    // 목록 페이지 및 휴지통 페이지 캐시 무효화
    revalidatePath('/notes');
    revalidatePath('/notes/trash');
  } catch (error) {
    console.error('노트 복구 실패:', error);
    return { error: '노트 복구에 실패했습니다' };
  }

  // 성공 시 목록 페이지로 리다이렉션
  redirect('/notes');
}

export async function deleteNotes(noteIds: string[]) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: '로그인이 필요합니다' };
    }

    if (!noteIds || noteIds.length === 0) {
      return { error: '삭제할 노트를 선택해주세요' };
    }

    // 권한 검증: 삭제하려는 노트들이 현재 사용자의 것인지 확인
    const existingNotes = await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.userId, user.id));

    const userNoteIds = new Set(existingNotes.map((note) => note.id));
    const invalidNoteIds = noteIds.filter((id) => !userNoteIds.has(id));

    if (invalidNoteIds.length > 0) {
      return { error: '권한이 없는 노트가 포함되어 있습니다' };
    }

    // 일괄 소프트 삭제
    for (const noteId of noteIds) {
      await db
        .update(schema.notes)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(schema.notes.id, noteId));
    }

    // 목록 페이지 캐시 무효화
    revalidatePath('/notes');

    return { success: true, deletedCount: noteIds.length };
  } catch (error) {
    console.error('노트 일괄 삭제 실패:', error);
    return { error: '노트 삭제에 실패했습니다' };
  }
}

export async function searchNotes(query: string, limit: number = 20) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { notes: [], error: '로그인이 필요합니다' };
    }

    // 검색어 유효성 검증
    if (!query || query.trim().length === 0) {
      return { notes: [], error: '검색어를 입력해주세요' };
    }

    // 검색어 정규화 (앞뒤 공백 제거)
    const normalizedQuery = query.trim();

    // ILIKE 패턴 생성 (% 검색어 %)
    const searchPattern = `%${normalizedQuery}%`;

    // 검색 시작 시간 기록 (성능 측정용)
    const searchStartTime = Date.now();

    // 노트 검색 (제목과 내용에서 대소문자 구분 없는 부분 일치 검색)
    const notes = await db
      .select()
      .from(schema.notes)
      .where(
        and(
          eq(schema.notes.userId, user.id), // 사용자 스코프 필터링
          isNull(schema.notes.deletedAt), // 삭제되지 않은 노트만
          or(
            ilike(schema.notes.title, searchPattern), // 제목에서 검색
            ilike(schema.notes.content, searchPattern) // 내용에서 검색
          )
        )
      )
      .orderBy(desc(schema.notes.updatedAt)) // 최근 수정된 순으로 정렬
      .limit(limit);

    // 검색 완료 시간 기록
    const searchEndTime = Date.now();
    const searchDuration = searchEndTime - searchStartTime;

    // 검색 결과 메타데이터
    const metadata = {
      query: normalizedQuery,
      totalResults: notes.length,
      searchDuration,
      timestamp: new Date().toISOString(),
    };

    return { notes, metadata };
  } catch (error) {
    console.error('노트 검색 실패:', error);
    return { notes: [], error: '검색 중 오류가 발생했습니다' };
  }
}

export async function filterNotesByTags(tags: string[], searchQuery?: string, limit: number = 20) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { notes: [], error: '로그인이 필요합니다' };
    }

    // 태그 유효성 검증
    if (!tags || tags.length === 0) {
      return { notes: [], error: '태그를 선택해주세요' };
    }

    // 검색 시작 시간 기록
    const filterStartTime = Date.now();

    // 태그 필터링 쿼리 (다중 태그 AND 조건)
    let query = db
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
          eq(schema.notes.userId, user.id),
          isNull(schema.notes.deletedAt),
          inArray(schema.noteTags.tag, tags)
        )
      );

    // 검색어가 있으면 추가 필터링
    if (searchQuery && searchQuery.trim()) {
      const searchPattern = `%${searchQuery.trim()}%`;
      query = query.where(
        and(
          eq(schema.notes.userId, user.id),
          isNull(schema.notes.deletedAt),
          inArray(schema.noteTags.tag, tags),
          or(
            ilike(schema.notes.title, searchPattern),
            ilike(schema.notes.content, searchPattern)
          )
        )
      );
    }

    // 결과 정렬 및 제한
    const notes = await query
      .orderBy(desc(schema.notes.updatedAt))
      .limit(limit);

    // 다중 태그 AND 조건을 위한 추가 필터링
    // 선택된 모든 태그를 가진 노트만 반환
    const filteredNotes = [];
    for (const note of notes) {
      const noteTags = await db
        .select({ tag: schema.noteTags.tag })
        .from(schema.noteTags)
        .where(eq(schema.noteTags.noteId, note.id));

      const noteTagSet = new Set(noteTags.map(nt => nt.tag));
      const hasAllTags = tags.every(tag => noteTagSet.has(tag));

      if (hasAllTags) {
        filteredNotes.push(note);
      }
    }

    // 필터링 완료 시간 기록
    const filterEndTime = Date.now();
    const filterDuration = filterEndTime - filterStartTime;

    // 필터링 결과 메타데이터
    const metadata = {
      tags,
      searchQuery: searchQuery?.trim() || null,
      totalResults: filteredNotes.length,
      filterDuration,
      timestamp: new Date().toISOString(),
    };

    return { notes: filteredNotes, metadata };
  } catch (error) {
    console.error('태그 필터링 실패:', error);
    return { notes: [], error: '태그 필터링 중 오류가 발생했습니다' };
  }
}

export async function getUserTags() {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { tags: [], error: '로그인이 필요합니다' };
    }

    // 사용자의 모든 태그 조회
    const tags = await db
      .selectDistinct({ tag: schema.noteTags.tag })
      .from(schema.noteTags)
      .innerJoin(schema.notes, eq(schema.noteTags.noteId, schema.notes.id))
      .where(
        and(
          eq(schema.notes.userId, user.id),
          isNull(schema.notes.deletedAt)
        )
      )
      .orderBy(schema.noteTags.tag);

    return { tags: tags.map(t => t.tag) };
  } catch (error) {
    console.error('태그 목록 조회 실패:', error);
    return { tags: [], error: '태그 목록을 불러올 수 없습니다' };
  }
}

export async function getTagStats() {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { tagStats: [], error: '로그인이 필요합니다' };
    }

    // 태그별 노트 개수 조회
    const tagStats = await db
      .select({
        tag: schema.noteTags.tag,
        count: count(),
      })
      .from(schema.noteTags)
      .innerJoin(schema.notes, eq(schema.noteTags.noteId, schema.notes.id))
      .where(
        and(
          eq(schema.notes.userId, user.id),
          isNull(schema.notes.deletedAt)
        )
      )
      .groupBy(schema.noteTags.tag)
      .orderBy(desc(count()));

    return { tagStats };
  } catch (error) {
    console.error('태그 통계 조회 실패:', error);
    return { tagStats: [], error: '태그 통계를 불러올 수 없습니다' };
  }
}

export async function filterNotesByDateRange(
  startDate: Date,
  endDate: Date,
  searchQuery?: string,
  tags?: string[],
  limit: number = 20
) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { notes: [], error: '로그인이 필요합니다' };
    }

    // 날짜 유효성 검증
    if (!startDate || !endDate) {
      return { notes: [], error: '시작일과 종료일을 모두 선택해주세요' };
    }

    if (startDate > endDate) {
      return { notes: [], error: '시작일은 종료일보다 이전이어야 합니다' };
    }

    // 날짜 범위 정규화 (자정부터 23:59:59까지)
    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);
    
    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setHours(23, 59, 59, 999);

    // 필터링 시작 시간 기록
    const filterStartTime = Date.now();

    // 기본 날짜 범위 조건
    const dateConditions = and(
      eq(schema.notes.userId, user.id),
      isNull(schema.notes.deletedAt),
      gte(schema.notes.createdAt, normalizedStartDate),
      lte(schema.notes.createdAt, normalizedEndDate)
    );

    let notes: any[] = [];

    // 태그 필터링이 있는 경우
    if (tags && tags.length > 0) {
      // 태그와 날짜 범위 조합 쿼리
      let query = db
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
            dateConditions,
            inArray(schema.noteTags.tag, tags)
          )
        );

      // 검색어가 있으면 추가 필터링
      if (searchQuery && searchQuery.trim()) {
        const searchPattern = `%${searchQuery.trim()}%`;
        query = query.where(
          and(
            dateConditions,
            inArray(schema.noteTags.tag, tags),
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        );
      }

      const rawNotes = await query
        .orderBy(desc(schema.notes.updatedAt))
        .limit(limit);

      // 다중 태그 AND 조건을 위한 추가 필터링
      for (const note of rawNotes) {
        const noteTags = await db
          .select({ tag: schema.noteTags.tag })
          .from(schema.noteTags)
          .where(eq(schema.noteTags.noteId, note.id));

        const noteTagSet = new Set(noteTags.map(nt => nt.tag));
        const hasAllTags = tags.every(tag => noteTagSet.has(tag));

        if (hasAllTags) {
          notes.push(note);
        }
      }
    } else {
      // 태그 필터링이 없는 경우 - 날짜 범위와 검색어만
      let query = db
        .select()
        .from(schema.notes)
        .where(dateConditions);

      // 검색어가 있으면 추가 필터링
      if (searchQuery && searchQuery.trim()) {
        const searchPattern = `%${searchQuery.trim()}%`;
        query = query.where(
          and(
            dateConditions,
            or(
              ilike(schema.notes.title, searchPattern),
              ilike(schema.notes.content, searchPattern)
            )
          )
        );
      }

      notes = await query
        .orderBy(desc(schema.notes.updatedAt))
        .limit(limit);
    }

    // 필터링 완료 시간 기록
    const filterEndTime = Date.now();
    const filterDuration = filterEndTime - filterStartTime;

    // 필터링 결과 메타데이터
    const metadata = {
      startDate: normalizedStartDate.toISOString(),
      endDate: normalizedEndDate.toISOString(),
      searchQuery: searchQuery?.trim() || null,
      tags: tags || null,
      totalResults: notes.length,
      filterDuration,
      timestamp: new Date().toISOString(),
    };

    return { notes, metadata };
  } catch (error) {
    console.error('날짜 범위 필터링 실패:', error);
    return { notes: [], error: '날짜 범위 필터링 중 오류가 발생했습니다' };
  }
}

export async function getDateRangeStats(startDate: Date, endDate: Date) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { stats: null, error: '로그인이 필요합니다' };
    }

    // 날짜 유효성 검증
    if (!startDate || !endDate) {
      return { stats: null, error: '시작일과 종료일을 모두 선택해주세요' };
    }

    // 날짜 범위 정규화
    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);
    
    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setHours(23, 59, 59, 999);

    // 날짜 범위별 노트 개수 조회
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(schema.notes)
      .where(
        and(
          eq(schema.notes.userId, user.id),
          isNull(schema.notes.deletedAt),
          gte(schema.notes.createdAt, normalizedStartDate),
          lte(schema.notes.createdAt, normalizedEndDate)
        )
      );

    // 날짜별 노트 개수 조회 (일별 그룹화)
    const dailyStats = await db
      .select({
        date: schema.notes.createdAt,
        count: count(),
      })
      .from(schema.notes)
      .where(
        and(
          eq(schema.notes.userId, user.id),
          isNull(schema.notes.deletedAt),
          gte(schema.notes.createdAt, normalizedStartDate),
          lte(schema.notes.createdAt, normalizedEndDate)
        )
      )
      .groupBy(schema.notes.createdAt)
      .orderBy(schema.notes.createdAt);

    const stats = {
      totalCount,
      startDate: normalizedStartDate.toISOString(),
      endDate: normalizedEndDate.toISOString(),
      dailyStats: dailyStats.map(stat => ({
        date: stat.date.toISOString().split('T')[0], // YYYY-MM-DD 형식
        count: stat.count,
      })),
    };

    return { stats };
  } catch (error) {
    console.error('날짜 범위 통계 조회 실패:', error);
    return { stats: null, error: '날짜 범위 통계를 불러올 수 없습니다' };
  }
}

export async function getSearchSuggestions(query: string, limit: number = 10) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { suggestions: [], error: '로그인이 필요합니다' };
    }

    // 검색어 유효성 검증
    if (!query || query.trim().length < 2) {
      return { suggestions: [] };
    }

    // 검색어 정규화
    const normalizedQuery = query.trim();
    const searchPattern = `%${normalizedQuery}%`;

    // 검색 제안 조회 (제목 우선, 내용 보조)
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
          eq(schema.notes.userId, user.id),
          isNull(schema.notes.deletedAt),
          or(
            ilike(schema.notes.title, searchPattern),
            ilike(schema.notes.content, searchPattern)
          )
        )
      )
      .orderBy(desc(schema.notes.updatedAt))
      .limit(limit);

    // 검색 제안 생성 (제목과 내용 미리보기 포함)
    const suggestions = notes.map(note => {
      // 내용 미리보기 생성 (최대 100자)
      const contentPreview = note.content 
        ? note.content.length > 100 
          ? note.content.substring(0, 100) + '...'
          : note.content
        : '';

      // 관련도 점수 계산 (제목 일치 시 높은 점수)
      const titleMatch = note.title.toLowerCase().includes(normalizedQuery.toLowerCase());
      const contentMatch = note.content?.toLowerCase().includes(normalizedQuery.toLowerCase());
      
      let relevanceScore = 0;
      if (titleMatch) relevanceScore += 10;
      if (contentMatch) relevanceScore += 5;
      
      // 최근 업데이트된 노트에 가중치
      const daysSinceUpdate = Math.floor((Date.now() - note.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      relevanceScore += Math.max(0, 10 - daysSinceUpdate);

      return {
        id: note.id,
        title: note.title,
        contentPreview,
        relevanceScore,
        createdAt: note.createdAt,
      };
    });

    // 관련도 점수로 정렬
    suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return { suggestions };
  } catch (error) {
    console.error('검색 제안 조회 실패:', error);
    return { suggestions: [], error: '검색 제안을 불러올 수 없습니다' };
  }
}

export async function getPopularTags(limit: number = 5) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { tags: [], error: '로그인이 필요합니다' };
    }

    // 인기 태그 조회 (사용자별)
    const popularTags = await db
      .select({
        tag: schema.noteTags.tag,
        count: count(),
      })
      .from(schema.noteTags)
      .innerJoin(schema.notes, eq(schema.noteTags.noteId, schema.notes.id))
      .where(
        and(
          eq(schema.notes.userId, user.id),
          isNull(schema.notes.deletedAt)
        )
      )
      .groupBy(schema.noteTags.tag)
      .orderBy(desc(count()))
      .limit(limit);

    return { tags: popularTags.map(t => t.tag) };
  } catch (error) {
    console.error('인기 태그 조회 실패:', error);
    return { tags: [], error: '인기 태그를 불러올 수 없습니다' };
  }
}

export async function getRecentSearches(limit: number = 5) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { searches: [], error: '로그인이 필요합니다' };
    }

    // 최근 검색어 조회 (로컬 스토리지 기반이므로 임시로 빈 배열 반환)
    // 실제 구현에서는 사용자별 검색 히스토리를 저장하는 테이블이 필요
    return { searches: [] };
  } catch (error) {
    console.error('최근 검색어 조회 실패:', error);
    return { searches: [], error: '최근 검색어를 불러올 수 없습니다' };
  }
}

export async function getSearchQuerySuggestions(query: string) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { suggestions: [], error: '로그인이 필요합니다' };
    }

    // 검색어 유효성 검증
    if (!query || query.trim().length < 2) {
      return { suggestions: [] };
    }

    const normalizedQuery = query.trim().toLowerCase();

    // 유사한 제목이나 내용을 가진 노트에서 검색어 제안 생성
    const notes = await db
      .select({
        title: schema.notes.title,
        content: schema.notes.content,
      })
      .from(schema.notes)
      .where(
        and(
          eq(schema.notes.userId, user.id),
          isNull(schema.notes.deletedAt)
        )
      )
      .limit(50); // 성능을 위해 제한

    // 검색어 제안 생성
    const suggestions = new Set<string>();
    
    notes.forEach(note => {
      // 제목에서 단어 추출
      const titleWords = note.title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.length >= 2 && word.includes(normalizedQuery) && word !== normalizedQuery) {
          suggestions.add(word);
        }
      });

      // 내용에서 단어 추출
      if (note.content) {
        const contentWords = note.content.toLowerCase().split(/\s+/);
        contentWords.forEach(word => {
          if (word.length >= 2 && word.includes(normalizedQuery) && word !== normalizedQuery) {
            suggestions.add(word);
          }
        });
      }
    });

    // 제안을 배열로 변환하고 정렬
    const suggestionArray = Array.from(suggestions)
      .sort((a, b) => {
        // 검색어와의 유사도로 정렬
        const aSimilarity = calculateSimilarity(normalizedQuery, a);
        const bSimilarity = calculateSimilarity(normalizedQuery, b);
        return bSimilarity - aSimilarity;
      })
      .slice(0, 5); // 최대 5개 제안

    return { suggestions: suggestionArray };
  } catch (error) {
    console.error('검색어 제안 조회 실패:', error);
    return { suggestions: [], error: '검색어 제안을 불러올 수 없습니다' };
  }
}

// 문자열 유사도 계산 함수 (간단한 Levenshtein 거리 기반)
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

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

