// components/notes/delete-note-button.tsx
// 노트 삭제 버튼 컴포넌트 - 확인 다이얼로그 포함
// 실수로 인한 삭제를 방지하기 위한 확인 절차 제공
// 관련 파일: app/notes/[id]/page.tsx, app/actions/notes.ts

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteNote } from '@/app/actions/notes';

interface DeleteNoteButtonProps {
  noteId: string;
  noteTitle: string;
}

export function DeleteNoteButton({ noteId, noteTitle }: DeleteNoteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteNote(noteId);

      if (result?.error) {
        setError(result.error);
      }
      // 성공 시 Server Action에서 redirect 처리
    } catch (err) {
      setError('노트 삭제에 실패했습니다');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isDeleting}>
            삭제
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>노트를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{noteTitle}&quot; 노트가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </>
  );
}

