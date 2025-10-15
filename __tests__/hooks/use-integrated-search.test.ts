// __tests__/hooks/use-integrated-search.test.ts
// 통합 검색 훅 테스트
// 검색 상태 관리, URL 동기화, 검색 실행 기능 검증
// 관련 파일: hooks/use-integrated-search.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useIntegratedSearch } from '@/hooks/use-integrated-search';
import { searchNotes, filterNotesByTags, filterNotesByDateRange } from '@/app/actions/notes';

// Next.js 훅 모킹
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// 검색 API 모킹
vi.mock('@/app/actions/notes', () => ({
  searchNotes: vi.fn(),
  filterNotesByTags: vi.fn(),
  filterNotesByDateRange: vi.fn(),
}));

describe('useIntegratedSearch', () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useRouter as any).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    
    (useSearchParams as any).mockReturnValue(mockSearchParams);
  });

  it('초기 상태가 올바르게 설정되어야 함', () => {
    const { result } = renderHook(() => useIntegratedSearch());
    
    expect(result.current.searchState).toEqual({
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
  });

  it('URL에서 초기 검색어를 가져와야 함', () => {
    mockSearchParams.set('search', 'initial query');
    
    const { result } = renderHook(() => useIntegratedSearch());
    
    expect(result.current.searchState.query).toBe('initial query');
  });

  it('검색 실행 시 상태가 올바르게 업데이트되어야 함', async () => {
    const mockNotes = [
      { id: '1', title: 'Test Note', content: 'Test Content' },
    ];
    
    (searchNotes as any).mockResolvedValue({
      notes: mockNotes,
      metadata: { query: 'test', totalResults: 1, searchDuration: 100 },
    });

    const { result } = renderHook(() => useIntegratedSearch());
    
    await act(async () => {
      await result.current.handleSearch('test query');
    });
    
    expect(result.current.searchState).toEqual({
      query: 'test query',
      results: mockNotes,
      isLoading: false,
      hasSearched: true,
      selectedTags: [],
      dateRange: {
        startDate: null,
        endDate: null,
        isActive: false,
      },
    });
  });

  it('검색 에러 시 에러 상태가 설정되어야 함', async () => {
    (searchNotes as any).mockResolvedValue({
      notes: [],
      error: '검색 실패',
    });

    const { result } = renderHook(() => useIntegratedSearch());
    
    await act(async () => {
      await result.current.handleSearch('test query');
    });
    
    expect(result.current.searchState.error).toBe('검색 실패');
    expect(result.current.searchState.isLoading).toBe(false);
  });

  it('빈 검색어로 검색 시 초기화되어야 함', async () => {
    const { result } = renderHook(() => useIntegratedSearch());
    
    // 먼저 검색 상태 설정
    await act(async () => {
      await result.current.handleSearch('test query');
    });
    
    // 빈 검색어로 검색
    await act(async () => {
      await result.current.handleSearch('');
    });
    
    expect(result.current.searchState).toEqual({
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
  });

  it('clearSearch 함수가 올바르게 동작해야 함', async () => {
    const { result } = renderHook(() => useIntegratedSearch());
    
    // 먼저 검색 상태 설정
    await act(async () => {
      await result.current.handleSearch('test query');
    });
    
    // 검색 초기화
    await act(async () => {
      result.current.clearSearch();
    });
    
    expect(result.current.searchState).toEqual({
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
  });

  it('URL 업데이트가 올바르게 동작해야 함', () => {
    const { result } = renderHook(() => useIntegratedSearch());
    
    act(() => {
      result.current.updateURL('test query');
    });
    
    expect(mockReplace).toHaveBeenCalledWith('?search=test%20query', { scroll: false });
  });

  it('빈 검색어로 URL 업데이트 시 파라미터가 제거되어야 함', () => {
    mockSearchParams.set('search', 'existing query');
    
    const { result } = renderHook(() => useIntegratedSearch());
    
    act(() => {
      result.current.updateURL('');
    });
    
    expect(mockReplace).toHaveBeenCalledWith('', { scroll: false });
  });

  it('URL 파라미터 변경 시 검색 상태가 복원되어야 함', async () => {
    const mockNotes = [
      { id: '1', title: 'Test Note', content: 'Test Content' },
    ];
    
    (searchNotes as any).mockResolvedValue({
      notes: mockNotes,
      metadata: { query: 'url query', totalResults: 1, searchDuration: 100 },
    });

    // 초기 렌더링
    const { result, rerender } = renderHook(() => useIntegratedSearch());
    
    // URL 파라미터 변경 시뮬레이션
    mockSearchParams.set('search', 'url query');
    
    await act(async () => {
      rerender();
    });
    
    expect(result.current.searchState.query).toBe('url query');
  });

  it('검색 중 로딩 상태가 올바르게 관리되어야 함', async () => {
    let resolveSearch: (value: any) => void;
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve;
    });
    
    (searchNotes as any).mockReturnValue(searchPromise);

    const { result } = renderHook(() => useIntegratedSearch());
    
    // 검색 시작
    act(() => {
      result.current.handleSearch('test query');
    });
    
    // 로딩 상태 확인
    expect(result.current.searchState.isLoading).toBe(true);
    
    // 검색 완료
    await act(async () => {
      resolveSearch!({
        notes: [],
        metadata: { query: 'test query', totalResults: 0, searchDuration: 100 },
      });
    });
    
    // 로딩 상태 해제 확인
    expect(result.current.searchState.isLoading).toBe(false);
  });

  describe('날짜 필터링 기능', () => {
    it('날짜 범위 설정이 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useIntegratedSearch());
      
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');
      
      act(() => {
        result.current.setDateRange(startDate, endDate, true);
      });
      
      expect(result.current.searchState.dateRange).toEqual({
        startDate,
        endDate,
        isActive: true,
      });
    });

    it('날짜 범위 필터링이 활성화되면 filterNotesByDateRange가 호출되어야 함', async () => {
      const mockNotes = [
        { id: '1', title: 'Date Filtered Note', content: 'Test Content' },
      ];
      
      (filterNotesByDateRange as any).mockResolvedValue({
        notes: mockNotes,
        metadata: { 
          startDate: '2024-12-01T00:00:00.000Z',
          endDate: '2024-12-31T23:59:59.999Z',
          totalResults: 1,
          filterDuration: 100 
        },
      });

      const { result } = renderHook(() => useIntegratedSearch());
      
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');
      
      await act(async () => {
        await result.current.handleSearch('test', [], { startDate, endDate, isActive: true });
      });
      
      expect(filterNotesByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate,
        'test',
        undefined
      );
      
      expect(result.current.searchState.results).toEqual(mockNotes);
    });

    it('날짜 범위와 태그를 조합하여 필터링할 수 있어야 함', async () => {
      const mockNotes = [
        { id: '1', title: 'Date and Tag Filtered Note', content: 'Test Content' },
      ];
      
      (filterNotesByDateRange as any).mockResolvedValue({
        notes: mockNotes,
        metadata: { 
          startDate: '2024-12-01T00:00:00.000Z',
          endDate: '2024-12-31T23:59:59.999Z',
          tags: ['개발'],
          totalResults: 1,
          filterDuration: 100 
        },
      });

      const { result } = renderHook(() => useIntegratedSearch());
      
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');
      const tags = ['개발'];
      
      await act(async () => {
        await result.current.handleSearch('test', tags, { startDate, endDate, isActive: true });
      });
      
      expect(filterNotesByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate,
        'test',
        tags
      );
      
      expect(result.current.searchState.results).toEqual(mockNotes);
    });

    it('날짜 범위가 비활성화되면 일반 검색이 사용되어야 함', async () => {
      const mockNotes = [
        { id: '1', title: 'Regular Search Note', content: 'Test Content' },
      ];
      
      (searchNotes as any).mockResolvedValue({
        notes: mockNotes,
        metadata: { query: 'test', totalResults: 1, searchDuration: 100 },
      });

      const { result } = renderHook(() => useIntegratedSearch());
      
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');
      
      await act(async () => {
        await result.current.handleSearch('test', [], { startDate, endDate, isActive: false });
      });
      
      expect(searchNotes).toHaveBeenCalledWith('test');
      expect(filterNotesByDateRange).not.toHaveBeenCalled();
      
      expect(result.current.searchState.results).toEqual(mockNotes);
    });

    it('날짜 범위 초기화가 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useIntegratedSearch());
      
      // 먼저 날짜 범위 설정
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');
      
      act(() => {
        result.current.setDateRange(startDate, endDate, true);
      });
      
      expect(result.current.searchState.dateRange.isActive).toBe(true);
      
      // 날짜 범위 초기화
      act(() => {
        result.current.setDateRange(null, null, false);
      });
      
      expect(result.current.searchState.dateRange).toEqual({
        startDate: null,
        endDate: null,
        isActive: false,
      });
    });
  });
});
