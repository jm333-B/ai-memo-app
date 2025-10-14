// app/notes/trash/page.tsx
// 삭제된 노트 목록(휴지통) 페이지
// 삭제된 노트를 확인하고 복구할 수 있는 페이지
// 관련 파일: app/actions/notes.ts, components/notes/restore-note-button.tsx

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getDeletedNotes } from '@/app/actions/notes';
import { formatRelativeTime } from '@/lib/utils/date';
import { RestoreNoteButton } from '@/components/notes/restore-note-button';

export default async function TrashPage() {
  const { notes, error } = await getDeletedNotes();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link href="/notes">
            <Button variant="outline" className="mt-4">
              노트 목록으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              휴지통
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {notes.length > 0 ? `삭제된 노트 ${notes.length}개` : '삭제된 노트가 없습니다'}
            </p>
          </div>
          <Link href="/notes">
            <Button variant="outline">노트 목록으로</Button>
          </Link>
        </div>

        {notes.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              휴지통이 비어있습니다
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              삭제된 노트가 없습니다
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-semibold text-gray-900">
                      {note.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {note.content}
                    </p>
                    <div className="mt-3 flex gap-x-4 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">삭제됨:</span>{' '}
                        {note.deletedAt ? formatRelativeTime(note.deletedAt) : '알 수 없음'}
                      </div>
                    </div>
                  </div>
                  <RestoreNoteButton noteId={note.id} noteTitle={note.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

