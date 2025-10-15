// components/notes/search-input.tsx
// 검색 입력 필드 컴포넌트 (검색 제안 기능 포함)
// 사용자가 검색어를 입력할 수 있는 인터페이스와 실시간 검색 제안 제공
// 관련 파일: app/actions/notes.ts, components/notes/search-results.tsx, hooks/use-search-suggestions.ts

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchSuggestions } from '@/hooks/use-search-suggestions';
import { SearchSuggestions } from './search-suggestions';
import { SearchSuggestion } from '@/hooks/use-search-suggestions';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
  enableSuggestions?: boolean;
}

export function SearchInput({ 
  onSearch, 
  placeholder = "노트 검색...", 
  className = "",
  initialValue = "",
  enableSuggestions = true
}: SearchInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 검색 제안 훅
  const {
    suggestions,
    isLoading: isSuggestionsLoading,
    error: suggestionsError,
    selectedIndex,
    setSelectedIndex,
    clearSuggestions,
  } = useSearchSuggestions(query, 300, 2);

  // 검색 실행 핸들러
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  }, [query, onSearch]);

  // 검색 제안 선택 핸들러
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    clearSuggestions();
    
    // 노트 페이지로 이동
    router.push(`/notes/${suggestion.id}`);
  }, [router, clearSuggestions]);

  // 키보드 네비게이션 핸들러
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(selectedIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(selectedIndex - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        clearSuggestions();
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, setSelectedIndex, handleSuggestionSelect, handleSearch, clearSuggestions]);

  // 검색어 초기화 핸들러
  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
    setShowSuggestions(false);
    clearSuggestions();
  }, [onSearch, clearSuggestions]);

  // 입력 변경 핸들러
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  }, []);

  // 포커스 핸들러
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (query.trim().length >= 2) {
      setShowSuggestions(true);
    }
  }, [query]);

  // 블러 핸들러
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // 약간의 지연을 두어 클릭 이벤트가 처리되도록 함
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {/* 검색 제안 드롭다운 */}
      {enableSuggestions && (
        <SearchSuggestions
          suggestions={suggestions}
          isLoading={isSuggestionsLoading}
          error={suggestionsError}
          selectedIndex={selectedIndex}
          onSuggestionSelect={handleSuggestionSelect}
          onKeyDown={handleKeyDown}
          isVisible={showSuggestions && isFocused}
        />
      )}
      
      <Button
        onClick={handleSearch}
        disabled={!query.trim()}
        className="mt-2 w-full"
      >
        검색
      </Button>
    </div>
  );
}
