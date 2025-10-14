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
import { eq, desc, count, and, isNull, isNotNull } from 'drizzle-orm';

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

    // 목록 페이지 캐시 무효화
    revalidatePath('/notes');
  } catch (error) {
    console.error('노트 생성 실패:', error);
    return { error: '노트 생성에 실패했습니다' };
  }

  // 성공 시 목록 페이지로 리다이렉션
  redirect('/notes');
}

export async function getNotes(page: number = 1) {
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
      .orderBy(desc(schema.notes.createdAt))
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

