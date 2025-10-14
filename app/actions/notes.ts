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
import { eq, desc, count } from 'drizzle-orm';

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

    // 노트 목록 조회
    const notes = await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.userId, user.id))
      .orderBy(desc(schema.notes.createdAt))
      .limit(limit)
      .offset(offset);

    // 전체 노트 개수 조회
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(schema.notes)
      .where(eq(schema.notes.userId, user.id));

    const totalPages = Math.ceil(totalCount / limit);

    return { notes, totalPages, currentPage: page };
  } catch (error) {
    console.error('노트 목록 조회 실패:', error);
    return { notes: [], totalPages: 0, error: '노트 목록을 불러올 수 없습니다' };
  }
}

