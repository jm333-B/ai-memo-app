// components/notes/note-card.tsx
// 노트 목록의 각 노트 항목을 카드 형태로 표시하는 컴포넌트
// 제목, 본문 미리보기, 작성일시를 표시하고 클릭 시 상세 페이지로 이동
// 관련 파일: app/notes/page.tsx, lib/utils/date.ts

'use client';

import Link from 'next/link';
import { type Note } from '@/lib/db';
import { formatRelativeTime, truncateText } from '@/lib/utils/date';

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <Link href={`/notes/${note.id}`}>
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-gray-900">
              {note.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {truncateText(note.content, 150)}
            </p>
          </div>
          <time className="flex-shrink-0 text-xs text-gray-500">
            {formatRelativeTime(note.createdAt)}
          </time>
        </div>
      </div>
    </Link>
  );
}

