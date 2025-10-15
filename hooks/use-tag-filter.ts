// hooks/use-tag-filter.ts
// 태그 필터링 상태 관리 훅
// 태그 선택, 필터링, 통계 조회 기능 제공
// 관련 파일: app/actions/notes.ts, components/notes/tag-filter.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { filterNotesByTags, getUserTags, getTagStats } from '@/app/actions/notes';
import { Note } from '@/drizzle/schema';

interface TagStats {
  tag: string;
  count: number;
}

interface TagFilterState {
  selectedTags: string[];
  availableTags: string[];
  tagStats: TagStats[];
  isLoading: boolean;
  error?: string;
}

interface UseTagFilterReturn {
  tagFilterState: TagFilterState;
  toggleTag: (tag: string) => void;
  clearAllTags: () => void;
  filterNotes: (searchQuery?: string) => Promise<{ notes: Note[]; metadata?: any; error?: string }>;
  loadTags: () => Promise<void>;
}

export function useTagFilter(): UseTagFilterReturn {
  const [tagFilterState, setTagFilterState] = useState<TagFilterState>({
    selectedTags: [],
    availableTags: [],
    tagStats: [],
    isLoading: false,
  });

  // 태그 목록 및 통계 로드
  const loadTags = useCallback(async () => {
    setTagFilterState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const [tagsResult, statsResult] = await Promise.all([
        getUserTags(),
        getTagStats(),
      ]);

      if (tagsResult.error) {
        setTagFilterState(prev => ({
          ...prev,
          isLoading: false,
          error: tagsResult.error,
        }));
        return;
      }

      if (statsResult.error) {
        setTagFilterState(prev => ({
          ...prev,
          isLoading: false,
          error: statsResult.error,
        }));
        return;
      }

      setTagFilterState(prev => ({
        ...prev,
        availableTags: tagsResult.tags,
        tagStats: statsResult.tagStats,
        isLoading: false,
      }));
    } catch (error) {
      console.error('태그 로드 실패:', error);
      setTagFilterState(prev => ({
        ...prev,
        isLoading: false,
        error: '태그를 불러올 수 없습니다',
      }));
    }
  }, []);

  // 태그 선택/해제 토글
  const toggleTag = useCallback((tag: string) => {
    setTagFilterState(prev => {
      const isSelected = prev.selectedTags.includes(tag);
      const newSelectedTags = isSelected
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag];

      return {
        ...prev,
        selectedTags: newSelectedTags,
      };
    });
  }, []);

  // 모든 태그 필터 초기화
  const clearAllTags = useCallback(() => {
    setTagFilterState(prev => ({
      ...prev,
      selectedTags: [],
    }));
  }, []);

  // 태그로 노트 필터링
  const filterNotes = useCallback(async (searchQuery?: string) => {
    if (tagFilterState.selectedTags.length === 0) {
      return { notes: [], error: '태그를 선택해주세요' };
    }

    try {
      const result = await filterNotesByTags(tagFilterState.selectedTags, searchQuery);
      return result;
    } catch (error) {
      console.error('태그 필터링 실패:', error);
      return { notes: [], error: '태그 필터링 중 오류가 발생했습니다' };
    }
  }, [tagFilterState.selectedTags]);

  // 초기 태그 로드
  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return {
    tagFilterState,
    toggleTag,
    clearAllTags,
    filterNotes,
    loadTags,
  };
}
