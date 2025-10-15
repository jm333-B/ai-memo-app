// hooks/use-integrated-search.ts
// 통합 검색 상태 관리 훅
// 검색 상태와 URL 파라미터를 동기화하고 검색 기능을 제공
// 관련 파일: app/actions/notes.ts, app/notes/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchNotes, filterNotesByTags, filterNotesByDateRange } from '@/app/actions/notes';
import { Note } from '@/drizzle/schema';

interface SearchState {
  query: string;
  results: Note[];
  isLoading: boolean;
  hasSearched: boolean;
  error?: string;
  selectedTags: string[];
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
    isActive: boolean;
  };
}

interface UseIntegratedSearchReturn {
  searchState: SearchState;
  handleSearch: (query: string, tags?: string[], dateRange?: { startDate: Date | null; endDate: Date | null; isActive: boolean }) => void;
  clearSearch: () => void;
  updateURL: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setDateRange: (startDate: Date | null, endDate: Date | null, isActive: boolean) => void;
}

export function useIntegratedSearch(): UseIntegratedSearchReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL에서 초기 검색어 가져오기
  const initialQuery = searchParams.get('search') || '';
  
  const [searchState, setSearchState] = useState<SearchState>({
    query: initialQuery,
    results: [],
    isLoading: false,
    hasSearched: false,
    selectedTags: [],
    dateRange: {
      startDate: null,
      endDate: null,
      isActive: false,
    },
  });

  // URL 업데이트 함수
  const updateURL = useCallback((query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }
    
    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.replace(newURL, { scroll: false });
  }, [router, searchParams]);

  // 검색 실행 함수
  const handleSearch = useCallback(async (
    query: string, 
    tags?: string[], 
    dateRange?: { startDate: Date | null; endDate: Date | null; isActive: boolean }
  ) => {
    const trimmedQuery = query.trim();
    const searchTags = tags || searchState.selectedTags;
    const searchDateRange = dateRange || searchState.dateRange;
    
    // URL 업데이트
    updateURL(trimmedQuery);
    
    // 검색어, 태그, 날짜 범위가 모두 없으면 초기화
    if (!trimmedQuery && searchTags.length === 0 && !searchDateRange.isActive) {
      setSearchState({
        query: '',
        results: [],
        isLoading: false,
        hasSearched: false,
        selectedTags: [],
        dateRange: {
          startDate: null,
          endDate: null,
          isActive: false,
        },
      });
      return;
    }

    setSearchState(prev => ({
      ...prev,
      query: trimmedQuery,
      selectedTags: searchTags,
      dateRange: searchDateRange,
      isLoading: true,
      hasSearched: true,
      error: undefined,
    }));

    try {
      let result;
      
      // 날짜 범위가 활성화된 경우 날짜 필터링 사용
      if (searchDateRange.isActive && searchDateRange.startDate && searchDateRange.endDate) {
        result = await filterNotesByDateRange(
          searchDateRange.startDate,
          searchDateRange.endDate,
          trimmedQuery || undefined,
          searchTags.length > 0 ? searchTags : undefined
        );
      }
      // 태그가 선택된 경우 태그 필터링 사용
      else if (searchTags.length > 0) {
        result = await filterNotesByTags(searchTags, trimmedQuery || undefined);
      } 
      // 일반 검색 사용
      else {
        result = await searchNotes(trimmedQuery);
      }
      
      if (result.error) {
        setSearchState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error,
        }));
      } else {
        setSearchState(prev => ({
          ...prev,
          results: result.notes,
          isLoading: false,
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
  }, [updateURL, searchState.selectedTags, searchState.dateRange]);

  // 검색 초기화 함수
  const clearSearch = useCallback(() => {
    handleSearch('');
  }, [handleSearch]);

  // 선택된 태그 설정 함수
  const setSelectedTags = useCallback((tags: string[]) => {
    setSearchState(prev => ({
      ...prev,
      selectedTags: tags,
    }));
  }, []);

  // 날짜 범위 설정 함수
  const setDateRange = useCallback((startDate: Date | null, endDate: Date | null, isActive: boolean) => {
    const dateRange = { startDate, endDate, isActive };
    
    setSearchState(prev => ({
      ...prev,
      dateRange,
    }));
  }, []);

  // URL 파라미터 변경 시 검색 상태 복원
  useEffect(() => {
    const urlQuery = searchParams.get('search') || '';
    
    if (urlQuery !== searchState.query) {
      if (urlQuery) {
        handleSearch(urlQuery);
      } else {
        setSearchState(prev => ({
          ...prev,
          query: '',
          results: [],
          hasSearched: false,
        }));
      }
    }
  }, [searchParams, searchState.query, handleSearch]);

  return {
    searchState,
    handleSearch,
    clearSearch,
    updateURL,
    setSelectedTags,
    setDateRange,
  };
}
