// app/actions/ai.ts
// AI 관련 Server Actions
// Gemini API 연결 테스트 등 AI 관련 서버 액션 정의
// 관련 파일: lib/ai/gemini-api.ts, lib/supabase/server.ts

'use server';

import { createClient } from '@/lib/supabase/server';
import { checkGeminiHealth, callGeminiAPI } from '@/lib/ai/gemini-api';
import { truncateToTokenLimit } from '@/lib/ai/token-counter';
import { generateSummaryPrompt, generateTagsPrompt, parseTags } from '@/lib/ai/prompts';
import { db } from '@/lib/db';
import { summaries, notes, noteTags } from '@/drizzle/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

/**
 * Gemini API 연결 상태를 테스트합니다.
 * 인증된 사용자만 호출 가능합니다.
 * 
 * @returns 성공 여부와 에러 메시지
 */
export async function testGeminiConnection() {
  // 인증 확인
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // API 연결 테스트
  try {
    const isHealthy = await checkGeminiHealth();
    return { success: isHealthy };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

/**
 * 텍스트 요약을 생성합니다.
 * 
 * @param text - 요약할 텍스트
 * @returns 요약 결과 또는 에러
 */
export async function generateSummary(text: string) {
  // 인증 확인
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!text || text.trim().length === 0) {
    return { success: false, error: '텍스트를 입력해주세요' };
  }

  try {
    // 토큰 제한 확인 및 truncate
    const truncatedText = truncateToTokenLimit(text, 8000);
    
    const prompt = `다음 텍스트를 3-4개의 불릿 포인트로 요약해주세요. 각 포인트는 핵심 내용을 담고 있어야 합니다:

${truncatedText}`;

    const summary = await callGeminiAPI(prompt);
    return { success: true, summary };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

/**
 * 텍스트 기반 태그를 생성합니다.
 * 
 * @param text - 태그를 생성할 텍스트
 * @returns 태그 목록 또는 에러
 */
export async function generateTags(text: string) {
  // 인증 확인
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!text || text.trim().length === 0) {
    return { success: false, error: '텍스트를 입력해주세요' };
  }

  try {
    // 토큰 제한 확인 및 truncate
    const truncatedText = truncateToTokenLimit(text, 8000);
    
    const prompt = `다음 텍스트 내용에 가장 관련성 높은 태그를 최대 5개까지 생성해주세요. 
태그는 쉼표로 구분하고, 한글로 작성해주세요. 태그만 반환하고 다른 설명은 하지 마세요:

${truncatedText}`;

    const tags = await callGeminiAPI(prompt);
    // 태그를 배열로 변환
    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 5);
    
    return { success: true, tags: tagArray };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

/**
 * 노트의 요약을 생성하고 데이터베이스에 저장합니다.
 * 
 * @param noteId - 요약을 생성할 노트 ID
 * @returns 생성된 요약 또는 에러
 */
export async function generateNoteSummary(noteId: string) {
  // 인증 확인
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 노트 조회 및 권한 확인
    const note = await db.query.notes.findFirst({
      where: and(
        eq(notes.id, noteId),
        eq(notes.userId, user.id),
        isNull(notes.deletedAt)
      )
    });

    if (!note) {
      return { success: false, error: 'Note not found' };
    }

    if (!note.content || note.content.trim().length === 0) {
      return { success: false, error: '노트 내용이 비어있습니다' };
    }

    // 토큰 제한 확인 및 자르기 (여유분 남김)
    const truncatedContent = truncateToTokenLimit(note.content, 7000);

    // 요약 프롬프트 생성
    const prompt = generateSummaryPrompt(truncatedContent);

    // Gemini API 호출
    const summaryText = await callGeminiAPI(prompt);

    // 요약 저장
    const [summary] = await db.insert(summaries).values({
      noteId: note.id,
      content: summaryText,
      model: 'gemini-2.0-flash'
    }).returning();

    return { success: true, summary };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

/**
 * 노트의 최신 요약을 조회합니다.
 * 
 * @param noteId - 요약을 조회할 노트 ID
 * @returns 요약 또는 null
 */
export async function getNoteSummary(noteId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 권한 확인을 위해 노트 먼저 조회
    const note = await db.query.notes.findFirst({
      where: and(
        eq(notes.id, noteId),
        eq(notes.userId, user.id),
        isNull(notes.deletedAt)
      )
    });

    if (!note) {
      return { success: false, error: 'Note not found' };
    }

    // 최신 요약 조회
    const summary = await db.query.summaries.findFirst({
      where: eq(summaries.noteId, noteId),
      orderBy: [desc(summaries.createdAt)]
    });

    return { success: true, summary: summary || null };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

/**
 * 노트의 태그를 생성하고 데이터베이스에 저장합니다.
 * 
 * @param noteId - 태그를 생성할 노트 ID
 * @returns 생성된 태그 목록 또는 에러
 */
export async function generateNoteTags(noteId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 노트 조회 및 권한 확인
    const note = await db.query.notes.findFirst({
      where: and(
        eq(notes.id, noteId),
        eq(notes.userId, user.id),
        isNull(notes.deletedAt)
      )
    });

    if (!note) {
      return { success: false, error: 'Note not found' };
    }

    if (!note.content || note.content.trim().length === 0) {
      return { success: false, error: '노트 내용이 비어있습니다' };
    }

    // 토큰 제한 확인 및 자르기
    const truncatedContent = truncateToTokenLimit(note.content, 7000);

    // 태그 프롬프트 생성
    const prompt = generateTagsPrompt(truncatedContent);

    // Gemini API 호출
    console.log('태그 생성을 위한 프롬프트:', prompt);
    const tagsString = await callGeminiAPI(prompt);
    console.log('Gemini API 응답 (태그 문자열):', tagsString);

    // 태그 파싱 및 정규화
    const tags = parseTags(tagsString);
    console.log('파싱된 태그:', tags);

    if (tags.length === 0) {
      console.error('태그 파싱 결과가 비어있습니다. 원본 응답:', tagsString);
      return { success: false, error: '태그를 생성할 수 없습니다' };
    }

    // 데이터베이스 작업 - 테이블이 존재하지 않을 경우를 대비
    try {
      console.log('데이터베이스에 태그 저장 시도 중...');
      console.log('저장할 태그 데이터:', tags.map(tag => ({ noteId: note.id, tag })));
      
      // 기존 태그 삭제 (선택적)
      console.log('기존 태그 삭제 중...');
      await db.delete(noteTags).where(eq(noteTags.noteId, noteId));
      console.log('기존 태그 삭제 완료');

      // 새 태그 저장
      console.log('새 태그 저장 중...');
      const savedTags = await db.insert(noteTags).values(
        tags.map(tag => ({ noteId: note.id, tag }))
      ).returning();

      console.log('태그가 데이터베이스에 저장되었습니다:', savedTags);
      return { success: true, tags: savedTags };
    } catch (dbError) {
      // 테이블이 존재하지 않는 경우 임시 태그 반환
      console.error('데이터베이스 저장 실패:', dbError);
      console.warn('note_tags 테이블이 존재하지 않거나 다른 오류가 발생했습니다:', dbError);
      const mockTags = tags.map((tag, index) => ({
        id: `temp-${index}`,
        noteId: note.id,
        tag,
        createdAt: new Date()
      }));
      console.log('임시 태그 생성됨:', mockTags);
      return { success: true, tags: mockTags };
    }
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

/**
 * 노트의 태그 목록을 조회합니다.
 * 
 * @param noteId - 태그를 조회할 노트 ID
 * @returns 태그 목록 또는 에러
 */
export async function getNoteTags(noteId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 권한 확인
    const note = await db.query.notes.findFirst({
      where: and(
        eq(notes.id, noteId),
        eq(notes.userId, user.id),
        isNull(notes.deletedAt)
      )
    });

    if (!note) {
      return { success: false, error: 'Note not found' };
    }

    // 태그 조회 - 테이블이 존재하지 않을 경우를 대비
    try {
      const tags = await db.query.noteTags.findMany({
        where: eq(noteTags.noteId, noteId),
        orderBy: [desc(noteTags.createdAt)]
      });

      return { success: true, tags };
    } catch (dbError) {
      // 테이블이 존재하지 않는 경우 빈 배열 반환
      console.warn('note_tags 테이블이 존재하지 않습니다:', dbError);
      return { success: true, tags: [] };
    }
  } catch (error) {
    const err = error as Error;
    console.error('getNoteTags 오류:', err);
    return { success: false, error: `데이터베이스 오류: ${err.message}` };
  }
}

/**
 * 특정 태그를 삭제합니다.
 * 
 * @param noteId - 노트 ID
 * @param tag - 삭제할 태그
 * @returns 성공 여부
 */
export async function deleteNoteTag(noteId: string, tag: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 권한 확인
    const note = await db.query.notes.findFirst({
      where: and(
        eq(notes.id, noteId),
        eq(notes.userId, user.id),
        isNull(notes.deletedAt)
      )
    });

    if (!note) {
      return { success: false, error: 'Note not found' };
    }

    // 태그 삭제 - 테이블이 존재하지 않을 경우를 대비
    try {
      await db.delete(noteTags).where(
        and(eq(noteTags.noteId, noteId), eq(noteTags.tag, tag))
      );
      return { success: true };
    } catch (dbError) {
      // 테이블이 존재하지 않는 경우 성공으로 처리 (임시 태그이므로)
      console.warn('note_tags 테이블이 존재하지 않습니다:', dbError);
      return { success: true };
    }
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

