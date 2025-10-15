// components/notes/note-card.tsx
// 노트 목록의 각 노트 항목을 카드 형태로 표시하는 컴포넌트
// 제목, 본문 미리보기, 작성일시를 표시하고 클릭 시 상세 페이지로 이동
// 관련 파일: app/notes/page.tsx, lib/utils/date.ts

'use client';

import Link from 'next/link';
import { type Note } from '@/lib/db';
import { formatRelativeTime, truncateText } from '@/lib/utils/date';
import { truncateMarkdown } from '@/lib/utils/markdown';
import { highlightText, createHighlightedHTML } from '@/lib/utils/highlight';

interface NoteCardProps {
  note: Note;
  isDeleteMode?: boolean;
  isSelected?: boolean;
  onSelect?: (noteId: string) => void;
  showPreview?: boolean;
  highlightQuery?: string;
}

export function NoteCard({ 
  note, 
  isDeleteMode = false, 
  isSelected = false, 
  onSelect,
  showPreview = false,
  highlightQuery
}: NoteCardProps) {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelect) {
      onSelect(note.id);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDeleteMode) {
      e.preventDefault();
      if (onSelect) {
        onSelect(note.id);
      }
    }
  };

  const cardContent = (
    <div 
      className={`rounded-lg bg-white p-6 shadow-sm ring-1 transition-all ${
        isDeleteMode 
          ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' 
          : 'ring-gray-900/5 hover:shadow-md'
      } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between gap-4">
        {isDeleteMode && (
          <div className="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-gray-900">
            {highlightQuery ? (
              <span 
                dangerouslySetInnerHTML={createHighlightedHTML(
                  highlightText(note.title, highlightQuery)
                )}
              />
            ) : (
              note.title
            )}
          </h3>
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {highlightQuery ? (
              <span 
                dangerouslySetInnerHTML={createHighlightedHTML(
                  highlightText(truncateMarkdown(note.content, 150), highlightQuery)
                )}
              />
            ) : (
              truncateMarkdown(note.content, 150)
            )}
          </p>
        </div>
        <time className="flex-shrink-0 text-xs text-gray-500">
          {formatRelativeTime(note.createdAt)}
        </time>
      </div>
    </div>
  );

  if (isDeleteMode) {
    return cardContent;
  }

  return (
    <Link href={`/notes/${note.id}`}>
      {cardContent}
    </Link>
  );
}

