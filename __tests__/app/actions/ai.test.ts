// __tests__/app/actions/ai.test.ts
// AI Server Action 테스트
// Gemini 연결 테스트 및 인증 확인 검증
// 관련 파일: app/actions/ai.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testGeminiConnection, generateNoteSummary, getNoteSummary, generateNoteTags, getNoteTags, deleteNoteTag } from '@/app/actions/ai';

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}));

// Gemini API 모킹
vi.mock('@/lib/ai/gemini-api', () => ({
  checkGeminiHealth: vi.fn(),
  callGeminiAPI: vi.fn()
}));

// Prompts 모킹
vi.mock('@/lib/ai/prompts', () => ({
  generateSummaryPrompt: vi.fn((content) => `요약 프롬프트: ${content}`),
  generateTagsPrompt: vi.fn((content) => `태그 프롬프트: ${content}`),
  parseTags: vi.fn((tagsString) => tagsString.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0))
}));

// Token counter 모킹
vi.mock('@/lib/ai/token-counter', () => ({
  truncateToTokenLimit: vi.fn((text) => text)
}));

// DB 모킹
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      notes: {
        findFirst: vi.fn()
      },
      summaries: {
        findFirst: vi.fn()
      },
      noteTags: {
        findMany: vi.fn()
      }
    },
    insert: vi.fn(),
    delete: vi.fn()
  }
}));

describe('testGeminiConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증된 사용자는 API 연결을 테스트할 수 있어야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const { checkGeminiHealth } = await import('@/lib/ai/gemini-api');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (checkGeminiHealth as any).mockResolvedValue(true);

    const result = await testGeminiConnection();
    
    expect(result.success).toBe(true);
    expect(checkGeminiHealth).toHaveBeenCalled();
  });

  it('인증되지 않은 사용자는 Unauthorized 에러를 받아야 함', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const result = await testGeminiConnection();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('API 헬스체크 실패 시 에러를 반환해야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const { checkGeminiHealth } = await import('@/lib/ai/gemini-api');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (checkGeminiHealth as any).mockRejectedValue(new Error('API 실패'));

    const result = await testGeminiConnection();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('API 실패');
  });

  it('API가 비정상이면 success false를 반환해야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const { checkGeminiHealth } = await import('@/lib/ai/gemini-api');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (checkGeminiHealth as any).mockResolvedValue(false);

    const result = await testGeminiConnection();
    
    expect(result.success).toBe(false);
  });
});

describe('generateNoteSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증된 사용자는 노트 요약을 생성할 수 있어야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockNote = {
      id: 'note-123',
      userId: 'user-123',
      title: '테스트 노트',
      content: '이것은 테스트 내용입니다.',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
    const mockSummary = {
      id: 'summary-123',
      noteId: 'note-123',
      content: '- 테스트 요약 포인트 1\n- 테스트 요약 포인트 2',
      model: 'gemini-2.0-flash',
      createdAt: new Date()
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const { db } = await import('@/lib/db');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.notes.findFirst as any).mockResolvedValue(mockNote);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockSummary])
      })
    });

    const { callGeminiAPI } = await import('@/lib/ai/gemini-api');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (callGeminiAPI as any).mockResolvedValue(mockSummary.content);

    const result = await generateNoteSummary('note-123');

    expect(result.success).toBe(true);
    expect(result.summary).toEqual(mockSummary);
  });

  it('인증되지 않은 사용자는 Unauthorized 에러를 받아야 함', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const result = await generateNoteSummary('note-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('존재하지 않는 노트는 Not found 에러를 반환해야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const { db } = await import('@/lib/db');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.notes.findFirst as any).mockResolvedValue(null);

    const result = await generateNoteSummary('not-exist');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Note not found');
  });

  it('내용이 비어있는 노트는 에러를 반환해야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockNote = {
      id: 'note-123',
      userId: 'user-123',
      title: '빈 노트',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const { db } = await import('@/lib/db');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.notes.findFirst as any).mockResolvedValue(mockNote);

    const result = await generateNoteSummary('note-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('노트 내용이 비어있습니다');
  });
});

describe('getNoteSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증된 사용자는 노트 요약을 조회할 수 있어야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockNote = {
      id: 'note-123',
      userId: 'user-123',
      title: '테스트 노트',
      content: '내용',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
    const mockSummary = {
      id: 'summary-123',
      noteId: 'note-123',
      content: '- 요약 포인트 1',
      model: 'gemini-2.0-flash',
      createdAt: new Date()
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const { db } = await import('@/lib/db');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.notes.findFirst as any).mockResolvedValue(mockNote);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.summaries.findFirst as any).mockResolvedValue(mockSummary);

    const result = await getNoteSummary('note-123');

    expect(result.success).toBe(true);
    expect(result.summary).toEqual(mockSummary);
  });

  it('요약이 없으면 null을 반환해야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockNote = {
      id: 'note-123',
      userId: 'user-123',
      title: '테스트 노트',
      content: '내용',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const { db } = await import('@/lib/db');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.notes.findFirst as any).mockResolvedValue(mockNote);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.summaries.findFirst as any).mockResolvedValue(null);

    const result = await getNoteSummary('note-123');

    expect(result.success).toBe(true);
    expect(result.summary).toBe(null);
  });

  it('인증되지 않은 사용자는 Unauthorized 에러를 받아야 함', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const result = await getNoteSummary('note-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });
});

describe('generateNoteTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증된 사용자는 노트 태그를 생성할 수 있어야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockNote = {
      id: 'note-123',
      userId: 'user-123',
      title: '테스트 노트',
      content: '블록체인과 NFT에 관한 내용입니다.',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
    const mockTags = [
      { id: 'tag-1', noteId: 'note-123', tag: '블록체인', createdAt: new Date() },
      { id: 'tag-2', noteId: 'note-123', tag: 'nft', createdAt: new Date() }
    ];

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const { db } = await import('@/lib/db');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.notes.findFirst as any).mockResolvedValue(mockNote);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.delete as any).mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined)
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(mockTags)
      })
    });

    const { callGeminiAPI } = await import('@/lib/ai/gemini-api');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (callGeminiAPI as any).mockResolvedValue('블록체인, NFT, 암호화폐');

    const result = await generateNoteTags('note-123');

    expect(result.success).toBe(true);
    expect(result.tags).toEqual(mockTags);
  });

  it('인증되지 않은 사용자는 Unauthorized 에러를 받아야 함', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const result = await generateNoteTags('note-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('존재하지 않는 노트는 Not found 에러를 반환해야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const { db } = await import('@/lib/db');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.notes.findFirst as any).mockResolvedValue(null);

    const result = await generateNoteTags('not-exist');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Note not found');
  });

  it('내용이 비어있는 노트는 에러를 반환해야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockNote = {
      id: 'note-123',
      userId: 'user-123',
      title: '빈 노트',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const { db } = await import('@/lib/db');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.notes.findFirst as any).mockResolvedValue(mockNote);

    const result = await generateNoteTags('note-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('노트 내용이 비어있습니다');
  });
});

describe('getNoteTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증된 사용자는 노트 태그를 조회할 수 있어야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockNote = {
      id: 'note-123',
      userId: 'user-123',
      title: '테스트 노트',
      content: '내용',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
    const mockTags = [
      { id: 'tag-1', noteId: 'note-123', tag: '블록체인', createdAt: new Date() },
      { id: 'tag-2', noteId: 'note-123', tag: 'nft', createdAt: new Date() }
    ];

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const { db } = await import('@/lib/db');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.notes.findFirst as any).mockResolvedValue(mockNote);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.noteTags.findMany as any).mockResolvedValue(mockTags);

    const result = await getNoteTags('note-123');

    expect(result.success).toBe(true);
    expect(result.tags).toEqual(mockTags);
  });

  it('인증되지 않은 사용자는 Unauthorized 에러를 받아야 함', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const result = await getNoteTags('note-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });
});

describe('deleteNoteTag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증된 사용자는 노트 태그를 삭제할 수 있어야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockNote = {
      id: 'note-123',
      userId: 'user-123',
      title: '테스트 노트',
      content: '내용',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const { db } = await import('@/lib/db');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.notes.findFirst as any).mockResolvedValue(mockNote);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.delete as any).mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined)
    });

    const result = await deleteNoteTag('note-123', '블록체인');

    expect(result.success).toBe(true);
  });

  it('인증되지 않은 사용자는 Unauthorized 에러를 받아야 함', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') })
      }
    };

    const { createClient } = await import('@/lib/supabase/server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);

    const result = await deleteNoteTag('note-123', '블록체인');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });
});

