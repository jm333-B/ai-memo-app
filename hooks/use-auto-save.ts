// hooks/use-auto-save.ts
// 자동 저장 훅 - 작성 중인 노트를 자동으로 임시 저장
// 디바운스를 사용하여 입력이 멈춘 후 일정 시간 후에 저장
// 관련 파일: hooks/use-debounce.ts, lib/utils/draft-storage.ts, app/notes/new/page.tsx

import { useEffect, useState, useCallback } from 'react';
import { useDebounce } from './use-debounce';
import { saveDraft, deleteDraft, type DraftData } from '@/lib/utils/draft-storage';

interface UseAutoSaveOptions {
  key: string;
  title: string;
  content: string;
  delay?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  clearDraft: () => void;
}

/**
 * 자동 저장 훅
 * @param options - 자동 저장 옵션
 */
export function useAutoSave({
  key,
  title,
  content,
  delay = 1500,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 제목 또는 본문이 변경되면 디바운스
  const debouncedTitle = useDebounce(title, delay);
  const debouncedContent = useDebounce(content, delay);

  // 디바운스된 값이 변경되면 저장
  useEffect(() => {
    if (!enabled) return;

    // 제목과 본문이 모두 비어있으면 저장하지 않음
    if (!debouncedTitle.trim() && !debouncedContent.trim()) {
      return;
    }

    setIsSaving(true);
    const success = saveDraft(key, {
      title: debouncedTitle,
      content: debouncedContent,
    });

    if (success) {
      setLastSaved(new Date());
    }
    setIsSaving(false);
  }, [debouncedTitle, debouncedContent, key, enabled]);

  const clearDraft = useCallback(() => {
    deleteDraft(key);
    setLastSaved(null);
  }, [key]);

  return {
    isSaving,
    lastSaved,
    clearDraft,
  };
}

