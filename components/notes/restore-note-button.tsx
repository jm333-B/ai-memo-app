// components/notes/restore-note-button.tsx
// 노트 복구 버튼 컴포넌트 - 휴지통에서 노트 복구
// 삭제된 노트를 다시 활성화하는 기능 제공
// 관련 파일: app/notes/trash/page.tsx, app/actions/notes.ts

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { restoreNote } from '@/app/actions/notes';

interface RestoreNoteButtonProps {
  noteId: string;
  noteTitle: string;
}

export function RestoreNoteButton({ noteId, noteTitle }: RestoreNoteButtonProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRestore() {
    setIsRestoring(true);
    setError(null);

    try {
      const result = await restoreNote(noteId);

      if (result?.error) {
        setError(result.error);
      }
      // 성공 시 Server Action에서 redirect 처리
    } catch (err) {
      setError('노트 복구에 실패했습니다');
      console.error(err);
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={handleRestore}
        disabled={isRestoring}
        variant="default"
        size="sm"
      >
        {isRestoring ? '복구 중...' : '복구'}
      </Button>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

