// components/notes/search-suggestions.tsx
// 검색 제안 드롭다운 컴포넌트
// 검색 제안 표시, 키보드 네비게이션, 클릭 이벤트 처리 기능 제공
// 관련 파일: hooks/use-search-suggestions.ts, app/actions/notes.ts

'use client';

import { useEffect, useRef } from 'react';
import { Search, FileText, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchSuggestion } from '@/hooks/use-search-suggestions';

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error: string | null;
  selectedIndex: number;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  isVisible: boolean;
  className?: string;
}

interface SearchSuggestionItemProps {
  suggestion: SearchSuggestion;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

function SearchSuggestionItem({ 
  suggestion, 
  isSelected, 
  onClick, 
  onMouseEnter 
}: SearchSuggestionItemProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 cursor-pointer transition-colors',
        'hover:bg-muted/50',
        isSelected && 'bg-muted'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex-shrink-0 mt-0.5">
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-foreground truncate">
          {suggestion.title}
        </div>
        
        {suggestion.contentPreview && (
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {suggestion.contentPreview}
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {suggestion.createdAt.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            관련도: {suggestion.relevanceScore}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchSuggestions({
  suggestions,
  isLoading,
  error,
  selectedIndex,
  onSuggestionSelect,
  onKeyDown,
  isVisible,
  className = '',
}: SearchSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 키보드 이벤트 핸들러
  const handleKeyDown = (event: React.KeyboardEvent) => {
    onKeyDown(event);
  };

  // 검색 제안 클릭 핸들러
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSuggestionSelect(suggestion);
  };

  // 마우스 호버 핸들러
  const handleMouseEnter = (index: number) => {
    // 마우스 호버 시 선택된 인덱스 업데이트는 부모 컴포넌트에서 처리
  };

  // 포커스 관리
  useEffect(() => {
    if (isVisible && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute top-full left-0 right-0 z-50 mt-1',
        'bg-background border border-border rounded-md shadow-lg',
        'max-h-80 overflow-y-auto',
        className
      )}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground border-t-transparent" />
            <span>검색 중...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 text-center">
          <div className="text-sm text-destructive">
            {error}
          </div>
        </div>
      )}

      {!isLoading && !error && suggestions.length === 0 && (
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>검색 결과가 없습니다</span>
          </div>
        </div>
      )}

      {!isLoading && !error && suggestions.length > 0 && (
        <div className="py-1">
          {suggestions.map((suggestion, index) => (
            <SearchSuggestionItem
              key={suggestion.id}
              suggestion={suggestion}
              isSelected={index === selectedIndex}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => handleMouseEnter(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
