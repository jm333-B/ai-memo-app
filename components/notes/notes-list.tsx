// components/notes/notes-list.tsx
// 노트 목록을 표시하고 일괄 삭제 기능을 제공하는 클라이언트 컴포넌트
// 삭제 모드 토글, 선택된 노트 관리, 일괄 삭제 실행 기능 포함
// 관련 파일: app/notes/page.tsx, components/notes/note-card.tsx, app/actions/notes.ts

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { type Note } from '@/lib/db';
import { NoteCard } from '@/components/notes/note-card';
import { Button } from '@/components/ui/button';
import { deleteNotes } from '@/app/actions/notes';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface NotesListProps {
  notes: Note[];
}

export function NotesList({ notes }: NotesListProps) {
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedNoteIds(new Set());
  };

  const handleSelectNote = (noteId: string) => {
    setSelectedNoteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handleDeleteClick = () => {
    if (selectedNoteIds.size === 0) {
      toast.error('삭제할 노트를 선택해주세요');
      return;
    }
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    startTransition(async () => {
      const result = await deleteNotes(Array.from(selectedNoteIds));
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${result.deletedCount}개의 노트가 삭제되었습니다`);
        setIsDeleteMode(false);
        setSelectedNoteIds(new Set());
        router.refresh();
      }
      setShowDeleteDialog(false);
    });
  };

  const handleSelectAll = () => {
    if (selectedNoteIds.size === notes.length) {
      setSelectedNoteIds(new Set());
    } else {
      setSelectedNoteIds(new Set(notes.map((note) => note.id)));
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {isDeleteMode ? (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleToggleDeleteMode}
                disabled={isPending}
              >
                취소
              </Button>
              <Button
                variant="outline"
                onClick={handleSelectAll}
                disabled={isPending || notes.length === 0}
              >
                {selectedNoteIds.size === notes.length ? '전체 해제' : '전체 선택'}
              </Button>
              <span className="text-sm text-gray-600">
                {selectedNoteIds.size}개 선택됨
              </span>
            </div>
          ) : (
            <div />
          )}
          
          {isDeleteMode ? (
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isPending || selectedNoteIds.size === 0}
            >
              {isPending ? '삭제 중...' : `삭제하기 (${selectedNoteIds.size})`}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleToggleDeleteMode}
              disabled={notes.length === 0}
            >
              삭제하기
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isDeleteMode={isDeleteMode}
              isSelected={selectedNoteIds.has(note.id)}
              onSelect={handleSelectNote}
            />
          ))}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>노트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedNoteIds.size}개의 노트를 삭제하시겠습니까?
              삭제된 노트는 휴지통에서 복구할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

