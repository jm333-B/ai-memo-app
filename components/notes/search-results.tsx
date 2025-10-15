// components/notes/search-results.tsx
// 검색 결과 리스트 컴포넌트
// 검색된 노트들을 표시하고 미리보기 제공
// 관련 파일: app/actions/notes.ts, components/notes/note-card.tsx

'use client';

import { Note } from '@/drizzle/schema';
import { NoteCard } from './note-card';

interface SearchResultsProps {
  notes: Note[];
  query: string;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export function SearchResults({ 
  notes, 
  query, 
  isLoading = false, 
  error,
  className = ""
}: SearchResultsProps) {
  // 로딩 상태
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">검색 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <div className="text-destructive mb-2">⚠️</div>
          <p className="text-destructive font-medium">검색 중 오류가 발생했습니다</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // 빈 검색 결과
  if (notes.length === 0 && query) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">🔍</div>
          <p className="font-medium">검색 결과가 없습니다</p>
          <p className="text-sm text-muted-foreground mt-1">
            &quot;{query}&quot;에 대한 검색 결과를 찾을 수 없습니다
          </p>
        </div>
      </div>
    );
  }

  // 검색 결과 표시
  return (
    <div className={`space-y-4 ${className}`}>
      {query && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            &quot;{query}&quot;에 대한 검색 결과 {notes.length}개
          </p>
        </div>
      )}
      
      <div className="grid gap-4">
        {notes.map((note) => (
          <NoteCard 
            key={note.id} 
            note={note}
            showPreview={true}
            highlightQuery={query}
          />
        ))}
      </div>
    </div>
  );
}
