// components/notes/note-summary.tsx
// 노트 요약 표시 및 생성 컴포넌트
// AI를 사용하여 노트 내용을 요약하고 표시하는 UI 제공
// 관련 파일: app/actions/ai.ts, app/notes/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { generateNoteSummary, getNoteSummary } from '@/app/actions/ai';
import { toast } from 'sonner';
import type { Summary } from '@/drizzle/schema';

interface NoteSummaryProps {
  noteId: string;
}

export function NoteSummary({ noteId }: NoteSummaryProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 페이지 로드 시 기존 요약 확인
  useEffect(() => {
    async function loadSummary() {
      try {
        const result = await getNoteSummary(noteId);
        if (result.success && result.summary) {
          setSummary(result.summary);
        }
      } catch (err) {
        console.error('Failed to load summary:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSummary();
  }, [noteId]);

  // 요약 생성 핸들러
  async function handleGenerateSummary() {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateNoteSummary(noteId);

      if (result.success && result.summary) {
        setSummary(result.summary);
        toast.success('✨ 요약이 생성되었습니다!');
      } else {
        const errorMessage = result.error || '요약 생성에 실패했습니다';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = '요약 생성 중 오류가 발생했습니다';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm ring-1 ring-blue-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">🤖 AI 요약</h2>
          <div className="h-5 w-20 animate-pulse bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm ring-1 ring-blue-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">🤖 AI 요약</h2>
        <Button
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isGenerating ? (
            <>
              <span className="inline-block animate-spin mr-2">⚡</span>
              생성 중...
            </>
          ) : summary ? (
            '재생성'
          ) : (
            '요약 생성'
          )}
        </Button>
      </div>

      {/* 로딩 스피너 */}
      {isGenerating && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-sm text-gray-600">AI가 요약을 생성하고 있습니다...</p>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && !isGenerating && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">❌ {error}</p>
        </div>
      )}

      {/* 요약 내용 */}
      {summary && !isGenerating && (
        <div className="space-y-3">
          <div className="rounded-md bg-white p-4 shadow-sm border border-blue-100">
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {summary.content}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>모델: {summary.model}</span>
            <span>
              생성일: {new Date(summary.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      )}

      {/* 초기 상태 (요약 없음) */}
      {!summary && !isGenerating && !error && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-600 mb-3">
            아직 요약이 생성되지 않았습니다.
          </p>
          <p className="text-xs text-gray-500">
            버튼을 클릭하여 AI 요약을 생성해보세요.
          </p>
        </div>
      )}
    </div>
  );
}

