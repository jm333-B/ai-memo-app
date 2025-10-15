// hooks/use-search-suggestions.ts
// 검색 제안을 위한 커스텀 훅
// 디바운싱, 요청 취소, 검색 제안 상태 관리 기능 제공
// 관련 파일: app/actions/notes.ts, components/notes/search-suggestions.tsx

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './use-debounce';
import { getSearchSuggestions } from '@/app/actions/notes';

export interface SearchSuggestion {
  id: string;
  title: string;
  contentPreview: string;
  relevanceScore: number;
  createdAt: Date;
}

export interface UseSearchSuggestionsReturn {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error: string | null;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  clearSuggestions: () => void;
}

export function useSearchSuggestions(
  query: string,
  debounceDelay: number = 300,
  minQueryLength: number = 2
): UseSearchSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // 디바운스된 검색어
  const debouncedQuery = useDebounce(query, debounceDelay);
  
  // AbortController 참조
  const abortControllerRef = useRef<AbortController | null>(null);

  // 검색 제안 조회 함수
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새로운 AbortController 생성
    abortControllerRef.current = new AbortController();

    // 최소 검색어 길이 검증
    if (!searchQuery || searchQuery.trim().length < minQueryLength) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getSearchSuggestions(searchQuery.trim());
      
      // 요청이 취소되지 않았는지 확인
      if (!abortControllerRef.current?.signal.aborted) {
        if (result.error) {
          setError(result.error);
          setSuggestions([]);
        } else {
          setSuggestions(result.suggestions);
          setError(null);
        }
        setIsLoading(false);
      }
    } catch (error) {
      // AbortError는 무시 (요청 취소)
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      // 요청이 취소되지 않았을 때만 에러 처리
      if (!abortControllerRef.current?.signal.aborted) {
        console.error('검색 제안 조회 실패:', error);
        setError('검색 제안을 불러올 수 없습니다');
        setSuggestions([]);
        setIsLoading(false);
      }
    }
  }, [minQueryLength]);

  // 디바운스된 검색어 변경 시 검색 제안 조회
  useEffect(() => {
    fetchSuggestions(debouncedQuery);
    
    // 컴포넌트 언마운트 시 요청 취소
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, fetchSuggestions]);

  // 검색 제안 초기화 함수
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setIsLoading(false);
    setSelectedIndex(-1);
    
    // 진행 중인 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // 선택된 인덱스 설정 함수
  const handleSetSelectedIndex = useCallback((index: number) => {
    const maxIndex = suggestions.length - 1;
    const clampedIndex = Math.max(-1, Math.min(index, maxIndex));
    setSelectedIndex(clampedIndex);
  }, [suggestions.length]);

  return {
    suggestions,
    isLoading,
    error,
    selectedIndex,
    setSelectedIndex: handleSetSelectedIndex,
    clearSuggestions,
  };
}
