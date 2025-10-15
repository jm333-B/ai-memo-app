// app/notes/[id]/page.tsx
// 노트 상세 조회 페이지 - 선택한 노트의 전체 내용 표시
// 제목, 본문, 작성일시, 수정일시 및 수정/삭제/목록 액션 버튼 제공
// 관련 파일: app/actions/notes.ts, app/notes/[id]/edit/page.tsx

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getNoteById } from '@/app/actions/notes';
import { formatRelativeTime } from '@/lib/utils/date';
import { DeleteNoteButton } from '@/components/notes/delete-note-button';
import { NoteSummary } from '@/components/notes/note-summary';
import { NoteTags } from '@/components/notes/note-tags';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { hasMarkdownSyntax } from '@/lib/utils/markdown';
import { SaveNoteContent } from '@/components/notes/save-note-content';

interface NoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { id } = await params;
  const { note, error } = await getNoteById(id);

  // 노트를 찾을 수 없거나 권한이 없는 경우
  if (error || !note) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-4xl font-bold tracking-tight text-gray-900">
              {note.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">작성:</span>{' '}
                {formatRelativeTime(note.createdAt)}
              </div>
              <div>
                <span className="font-medium">수정:</span>{' '}
                {formatRelativeTime(note.updatedAt)}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-shrink-0 gap-2">
            <Link href={`/notes/${note.id}/edit`}>
              <Button variant="outline">수정</Button>
            </Link>
            <DeleteNoteButton noteId={note.id} noteTitle={note.title} />
            <Link href="/notes">
              <Button variant="outline">목록으로</Button>
            </Link>
          </div>
        </div>

        {/* AI 콘텐츠 저장 */}
        <SaveNoteContent noteId={note.id} />

        {/* AI 요약 */}
        <NoteSummary noteId={note.id} />

        {/* 태그 */}
        <NoteTags noteId={note.id} />

        {/* 본문 */}
        <div className="rounded-lg bg-white px-8 py-10 shadow-sm ring-1 ring-gray-900/5">
          {hasMarkdownSyntax(note.content) ? (
            <MarkdownRenderer content={note.content} />
          ) : (
            <div className="prose prose-gray max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {note.content}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

