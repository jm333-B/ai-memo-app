// app/notes/search/page.tsx
// 검색 페이지 컴포넌트
// 사용자가 노트를 검색할 수 있는 전용 페이지
// 관련 파일: app/actions/notes.ts, components/notes/search-input.tsx, components/notes/search-results.tsx

'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchInput } from '@/components/notes/search-input';
import { SearchResults } from '@/components/notes/search-results';
import { searchNotes } from '@/app/actions/notes';
import { Note } from '@/drizzle/schema';

interface SearchState {
  notes: Note[];
  query: string;
  isLoading: boolean;
  error?: string;
  metadata?: {
    query: string;
    totalResults: number;
    searchDuration: number;
    timestamp: string;
  };
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL에서 초기 검색어 가져오기
  const initialQuery = searchParams.get('q') || '';
  
  const [searchState, setSearchState] = useState<SearchState>({
    notes: [],
    query: initialQuery,
    isLoading: false,
  });

  // 검색 실행 함수
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchState({
        notes: [],
        query: '',
        isLoading: false,
      });
      return;
    }

    setSearchState(prev => ({
      ...prev,
      query,
      isLoading: true,
      error: undefined,
    }));

    try {
      const result = await searchNotes(query);
      
      if (result.error) {
        setSearchState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error,
        }));
      } else {
        setSearchState(prev => ({
          ...prev,
          notes: result.notes,
          isLoading: false,
          metadata: result.metadata,
        }));
      }
    } catch (error) {
      console.error('검색 실패:', error);
      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        error: '검색 중 오류가 발생했습니다',
      }));
    }
  }, []);

  // URL 업데이트 함수
  const updateURL = useCallback((query: string) => {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set('q', query.trim());
    }
    const newURL = params.toString() ? `/notes/search?${params.toString()}` : '/notes/search';
    router.replace(newURL);
  }, [router]);

  // 검색어 변경 핸들러
  const handleQueryChange = useCallback((query: string) => {
    updateURL(query);
    handleSearch(query);
  }, [updateURL, handleSearch]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">노트 검색</h1>
        <p className="text-gray-600">
          제목과 내용에서 키워드를 검색하여 원하는 노트를 찾아보세요
        </p>
      </div>

      <div className="mb-8">
        <SearchInput
          onSearch={handleQueryChange}
          placeholder="검색어를 입력하세요..."
          initialValue={initialQuery}
          className="max-w-md"
        />
      </div>

      {searchState.metadata && (
        <div className="mb-4 text-sm text-gray-600">
          검색 시간: {searchState.metadata.searchDuration}ms
        </div>
      )}

      <SearchResults
        notes={searchState.notes}
        query={searchState.query}
        isLoading={searchState.isLoading}
        error={searchState.error}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
