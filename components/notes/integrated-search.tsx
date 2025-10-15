// components/notes/integrated-search.tsx
// 통합 검색 컴포넌트
// 노트 목록 페이지에 통합된 검색 인터페이스 제공
// 관련 파일: hooks/use-integrated-search.ts, components/notes/search-input.tsx

'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useIntegratedSearch } from '@/hooks/use-integrated-search';
import { useSearchLoading } from '@/hooks/use-search-loading';
import { TagFilter } from './tag-filter';
import { DateFilter } from './date-filter';
import { EmptySearchResults } from './empty-search-results';
import { SearchLoadingSpinner, SearchError } from '@/components/ui/search-loading';

interface IntegratedSearchProps {
  className?: string;
  onSearchQueryChange?: (query: string) => void;
  onClearFilters?: () => void;
}

export function IntegratedSearch({ 
  className = "",
  onSearchQueryChange,
  onClearFilters
}: IntegratedSearchProps) {
  const { searchState, handleSearch, clearSearch, setSelectedTags, setDateRange } = useIntegratedSearch();
  
  // 검색 로딩 상태 관리
  const { 
    loadingState, 
    startLoading, 
    finishLoading, 
    retry, 
    reset,
    isLoading,
    hasError,
    canRetry
  } = useSearchLoading(
    async () => {
      // 재시도 시 마지막 검색 재실행
      if (searchState.query) {
        await handleSearch(searchState.query);
      }
    },
    3 // 최대 3회 재시도
  );

  // 검색어 변경 핸들러 (로딩 상태 포함)
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    startLoading('search');
    
    try {
      await handleSearch(query);
      finishLoading(true);
    } catch (error) {
      finishLoading(false, {
        type: 'network',
        message: '검색 중 오류가 발생했습니다'
      });
    }
  };

  // Enter 키 핸들러
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // 검색어 변경 핸들러 (빈 검색 결과에서 사용)
  const handleSearchQueryChange = async (query: string) => {
    startLoading('search');
    
    try {
      await handleSearch(query);
      onSearchQueryChange?.(query);
      finishLoading(true);
    } catch (error) {
      finishLoading(false, {
        type: 'network',
        message: '검색 중 오류가 발생했습니다'
      });
    }
  };

  // 필터 초기화 핸들러
  const handleClearFilters = () => {
    clearSearch();
    setSelectedTags([]);
    setDateRange(null, null, false);
    reset(); // 로딩 상태도 초기화
    onClearFilters?.();
  };

  return (
    <div className={`mb-6 ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          value={searchState.query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="노트 검색..."
          className="pl-10 pr-10"
        />
        {searchState.query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {/* 검색 상태 표시 */}
      {searchState.hasSearched && (
        <div className="mt-2 text-sm text-muted-foreground">
          {isLoading ? (
            <SearchLoadingSpinner 
              actionType={loadingState.actionType || 'search'} 
              className="py-2"
            />
          ) : hasError && loadingState.error ? (
            <SearchError
              errorType={loadingState.error.type}
              message={loadingState.error.message}
              retryCount={loadingState.error.retryCount}
              maxRetries={3}
              onRetry={canRetry ? retry : undefined}
            />
          ) : searchState.error ? (
            <span className="text-destructive">검색 중 오류가 발생했습니다</span>
          ) : (
            <span>
              {searchState.dateRange.isActive 
                ? `날짜 범위 필터` 
                : searchState.selectedTags.length > 0 
                  ? `태그 "${searchState.selectedTags.join(', ')}"` 
                  : searchState.query 
                    ? `"${searchState.query}"` 
                    : ''
              }에 대한 검색 결과 {searchState.results.length}개
            </span>
          )}
        </div>
      )}

      {/* 필터 섹션 */}
      <div className="mt-4 space-y-4">
        {/* 태그 필터 */}
        <TagFilter onFilterChange={setSelectedTags} />
        
        {/* 날짜 필터 */}
        <DateFilter onFilterChange={setDateRange} />
      </div>
    </div>
  );
}
