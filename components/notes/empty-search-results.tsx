// components/notes/empty-search-results.tsx
// 빈 검색 결과를 위한 컴포넌트
// 검색어 표시, 검색어 수정 제안, 추천 콘텐츠 제공 기능
// 관련 파일: app/actions/notes.ts, components/ui/empty-state.tsx

'use client';

import { useState, useEffect } from 'react';
import { Search, RotateCcw, Tag, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState as BaseEmptyState } from '@/components/ui/empty-state';
import { getPopularTags, getSearchQuerySuggestions } from '@/app/actions/notes';

interface EmptySearchResultsProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onClearFilters: () => void;
  className?: string;
}

interface RecommendedContentProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onClearFilters: () => void;
}

function RecommendedContent({ 
  searchQuery, 
  onSearchQueryChange, 
  onClearFilters 
}: RecommendedContentProps) {
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [querySuggestions, setQuerySuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        // 인기 태그와 검색어 제안을 병렬로 조회
        const [tagsResult, suggestionsResult] = await Promise.all([
          getPopularTags(5),
          getSearchQuerySuggestions(searchQuery)
        ]);

        if (tagsResult.tags) {
          setPopularTags(tagsResult.tags);
        }

        if (suggestionsResult.suggestions) {
          setQuerySuggestions(suggestionsResult.suggestions);
        }
      } catch (error) {
        console.error('추천 콘텐츠 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded w-16"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-14"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* 검색어 수정 제안 */}
      {querySuggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>다음 검색어를 시도해보세요:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {querySuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onSearchQueryChange(suggestion)}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 인기 태그 추천 */}
      {popularTags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="h-4 w-4" />
            <span>인기 태그:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => onSearchQueryChange(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 필터 초기화 옵션 */}
      <div className="pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          필터 초기화
        </Button>
      </div>
    </div>
  );
}

export function EmptySearchResults({
  searchQuery,
  onSearchQueryChange,
  onClearFilters,
  className = '',
}: EmptySearchResultsProps) {
  return (
    <div className={className}>
      <BaseEmptyState
        icon={<Search className="h-8 w-8 text-gray-400" />}
        title="검색 결과가 없습니다"
        description={
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-medium">"{searchQuery}"</span>에 대한 검색 결과를 찾을 수 없습니다.
            </p>
            <p className="text-sm text-gray-500">
              다른 검색어를 시도하거나 필터를 조정해보세요.
            </p>
          </div>
        }
        className="min-h-[300px]"
      />
      
      <RecommendedContent
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        onClearFilters={onClearFilters}
      />
    </div>
  );
}
