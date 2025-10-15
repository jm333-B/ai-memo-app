// components/notes/note-tags.tsx
// 노트 태그 표시 및 관리 컴포넌트
// 태그 생성, 조회, 삭제 기능을 제공하는 클라이언트 컴포넌트
// 관련 파일: app/actions/ai.ts, app/notes/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { generateNoteTags, getNoteTags, deleteNoteTag } from '@/app/actions/ai';
import { toast } from 'sonner';

interface NoteTagsProps {
  noteId: string;
}

export function NoteTags({ noteId }: NoteTagsProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 태그 로드
  useEffect(() => {
    async function loadTags() {
      try {
        const result = await getNoteTags(noteId);
        if (result.success && result.tags) {
          setTags(result.tags.map(t => t.tag));
        } else {
          setError(result.error || '태그를 불러올 수 없습니다');
        }
      } catch (err) {
        setError('태그를 불러오는 중 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    }
    loadTags();
  }, [noteId]);

  // 태그 생성 핸들러
  async function handleGenerateTags() {
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await generateNoteTags(noteId);
      
      if (result.success && result.tags) {
        setTags(result.tags.map(t => t.tag));
        toast.success('태그가 생성되었습니다');
      } else {
        setError(result.error || '태그 생성 실패');
        toast.error('태그 생성에 실패했습니다');
      }
    } catch (err) {
      setError('태그 생성 중 오류가 발생했습니다');
      toast.error('태그 생성 중 오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  }

  // 태그 삭제 핸들러
  async function handleDeleteTag(tag: string) {
    try {
      const result = await deleteNoteTag(noteId, tag);
      if (result.success) {
        setTags(tags.filter(t => t !== tag));
        toast.success('태그가 삭제되었습니다');
      } else {
        toast.error('태그 삭제에 실패했습니다');
      }
    } catch (err) {
      toast.error('태그 삭제 중 오류가 발생했습니다');
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white px-8 py-6 shadow-sm ring-1 ring-gray-900/5">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-16 mb-3"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white px-8 py-6 shadow-sm ring-1 ring-gray-900/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">태그</h3>
        <Button
          onClick={handleGenerateTags}
          disabled={isGenerating}
          size="sm"
          variant="outline"
        >
          {isGenerating ? '생성 중...' : '자동 생성'}
        </Button>
      </div>
      
      {isGenerating && (
        <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          AI가 태그를 생성하고 있습니다...
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
          >
            <span>{tag}</span>
            <button
              onClick={() => handleDeleteTag(tag)}
              className="hover:text-blue-600 ml-1 text-blue-500 hover:bg-blue-300 rounded-full w-4 h-4 flex items-center justify-center"
              aria-label="태그 삭제"
            >
              ×
            </button>
          </div>
        ))}
        
        {tags.length === 0 && !isGenerating && !error && (
          <p className="text-sm text-gray-500 italic">
            태그를 자동 생성하려면 "자동 생성" 버튼을 클릭하세요
          </p>
        )}
      </div>
    </div>
  );
}
