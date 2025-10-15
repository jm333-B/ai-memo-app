// components/notes/save-note-content.tsx
// 노트의 AI 요약과 태그를 저장하는 컴포넌트
// 조회 페이지에서 AI 생성 콘텐츠를 데이터베이스에 저장하는 기능 제공
// 관련 파일: app/actions/ai.ts, app/notes/[id]/page.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateNoteSummary, generateNoteTags } from '@/app/actions/ai';
import { toast } from 'sonner';
import { Save, Sparkles } from 'lucide-react';

interface SaveNoteContentProps {
  noteId: string;
  onSummaryGenerated?: () => void;
  onTagsGenerated?: () => void;
}

export function SaveNoteContent({ 
  noteId, 
  onSummaryGenerated, 
  onTagsGenerated 
}: SaveNoteContentProps) {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // 요약 생성 및 저장
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const result = await generateNoteSummary(noteId);
      if (result.success) {
        toast.success('✨ 요약이 생성되고 저장되었습니다!');
        onSummaryGenerated?.();
      } else {
        toast.error(result.error || '요약 생성에 실패했습니다');
      }
    } catch (error) {
      toast.error('요약 생성 중 오류가 발생했습니다');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 태그 생성 및 저장
  const handleGenerateTags = async () => {
    setIsGeneratingTags(true);
    try {
      console.log('태그 생성 시작 - noteId:', noteId);
      const result = await generateNoteTags(noteId);
      console.log('태그 생성 결과:', result);
      
      if (result.success) {
        console.log('태그 생성 성공, 생성된 태그:', result.tags);
        toast.success(`🏷️ 태그가 생성되고 저장되었습니다! (${result.tags?.length || 0}개 태그)`);
        onTagsGenerated?.();
      } else {
        console.error('태그 생성 실패:', result.error);
        toast.error(result.error || '태그 생성에 실패했습니다');
      }
    } catch (error) {
      console.error('태그 생성 중 오류 발생:', error);
      toast.error('태그 생성 중 오류가 발생했습니다');
    } finally {
      setIsGeneratingTags(false);
    }
  };

  // 요약과 태그 모두 생성
  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    try {
      const [summaryResult, tagsResult] = await Promise.all([
        generateNoteSummary(noteId),
        generateNoteTags(noteId)
      ]);

      let successCount = 0;
      if (summaryResult.success) successCount++;
      if (tagsResult.success) successCount++;

      if (successCount === 2) {
        toast.success('✨ 요약과 태그가 모두 생성되고 저장되었습니다!');
      } else if (successCount === 1) {
        toast.success('일부 콘텐츠가 생성되었습니다');
      } else {
        toast.error('콘텐츠 생성에 실패했습니다');
      }

      onSummaryGenerated?.();
      onTagsGenerated?.();
    } catch (error) {
      toast.error('콘텐츠 생성 중 오류가 발생했습니다');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  return (
    <div className="rounded-lg bg-gradient-to-br from-green-50 to-blue-50 p-6 shadow-sm ring-1 ring-green-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Save className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI 콘텐츠 저장</h3>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-gray-600">AI 생성</span>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        AI가 생성한 요약과 태그를 데이터베이스에 저장하여 나중에 활용할 수 있습니다.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleGenerateSummary}
          disabled={isGeneratingSummary || isGeneratingAll}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {isGeneratingSummary ? (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              요약 생성 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              요약 저장
            </>
          )}
        </Button>

        <Button
          onClick={handleGenerateTags}
          disabled={isGeneratingTags || isGeneratingAll}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {isGeneratingTags ? (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              태그 생성 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              태그 저장
            </>
          )}
        </Button>

        <Button
          onClick={handleGenerateAll}
          disabled={isGeneratingSummary || isGeneratingTags || isGeneratingAll}
          size="sm"
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          {isGeneratingAll ? (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              모두 생성 중...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              모두 저장
            </>
          )}
        </Button>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        💡 팁: "모두 저장" 버튼을 사용하면 요약과 태그를 한 번에 생성하고 저장할 수 있습니다.
      </div>
    </div>
  );
}
