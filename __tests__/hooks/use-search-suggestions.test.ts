// __tests__/hooks/use-search-suggestions.test.ts
// 검색 제안 훅 테스트
// 디바운싱, 요청 취소, 검색 제안 상태 관리 기능 검증
// 관련 파일: hooks/use-search-suggestions.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchSuggestions } from '@/hooks/use-search-suggestions';
import { getSearchSuggestions } from '@/app/actions/notes';

// Mock server actions
vi.mock('@/app/actions/notes', () => ({
  getSearchSuggestions: vi.fn(),
}));

const mockGetSearchSuggestions = vi.mocked(getSearchSuggestions);

describe('useSearchSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기 상태가 올바르게 설정되어야 함', () => {
    const { result } = renderHook(() => useSearchSuggestions(''));

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.selectedIndex).toBe(-1);
  });

  it('검색어가 2글자 미만일 때 검색 제안을 요청하지 않아야 함', async () => {
    const { result } = renderHook(() => useSearchSuggestions('a'));

    // 시간을 진행시켜 디바운스 완료
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockGetSearchSuggestions).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('검색어가 2글자 이상일 때 검색 제안을 요청해야 함', async () => {
    const mockSuggestions = [
      {
        id: '1',
        title: 'Test Note',
        contentPreview: 'Test content...',
        relevanceScore: 10,
        createdAt: new Date(),
      },
    ];

    mockGetSearchSuggestions.mockResolvedValue({ suggestions: mockSuggestions });

    const { result } = renderHook(() => useSearchSuggestions('test'));

    // 시간을 진행시켜 디바운스 완료
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockGetSearchSuggestions).toHaveBeenCalledWith('test', 10);
    expect(result.current.suggestions).toEqual(mockSuggestions);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('디바운싱이 올바르게 작동해야 함', async () => {
    mockGetSearchSuggestions.mockResolvedValue({ suggestions: [] });

    const { result, rerender } = renderHook(
      ({ query }) => useSearchSuggestions(query),
      { initialProps: { query: 'te' } }
    );

    // 첫 번째 검색어 입력
    act(() => {
      vi.advanceTimersByTime(200); // 아직 디바운스 완료되지 않음
    });

    expect(mockGetSearchSuggestions).not.toHaveBeenCalled();

    // 검색어 변경
    rerender({ query: 'test' });

    act(() => {
      vi.advanceTimersByTime(200); // 아직 디바운스 완료되지 않음
    });

    expect(mockGetSearchSuggestions).not.toHaveBeenCalled();

    // 디바운스 완료
    act(() => {
      vi.advanceTimersByTime(100);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockGetSearchSuggestions).toHaveBeenCalledTimes(1);
    expect(mockGetSearchSuggestions).toHaveBeenCalledWith('test', 10);
  });

  it('이전 요청이 취소되어야 함', async () => {
    let resolveFirstRequest: (value: any) => void;
    const firstRequestPromise = new Promise((resolve) => {
      resolveFirstRequest = resolve;
    });

    let resolveSecondRequest: (value: any) => void;
    const secondRequestPromise = new Promise((resolve) => {
      resolveSecondRequest = resolve;
    });

    mockGetSearchSuggestions
      .mockReturnValueOnce(firstRequestPromise as any)
      .mockReturnValueOnce(secondRequestPromise as any);

    const { result, rerender } = renderHook(
      ({ query }) => useSearchSuggestions(query),
      { initialProps: { query: 'test' } }
    );

    // 첫 번째 요청 시작
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockGetSearchSuggestions).toHaveBeenCalledTimes(1);

    // 검색어 변경 (두 번째 요청 시작)
    rerender({ query: 'testing' });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockGetSearchSuggestions).toHaveBeenCalledTimes(2);

    // 첫 번째 요청 완료 (취소되어야 함)
    await act(async () => {
      resolveFirstRequest!({ suggestions: [{ id: '1', title: 'First', contentPreview: '', relevanceScore: 10, createdAt: new Date() }] });
    });

    // 첫 번째 요청 결과가 반영되지 않아야 함
    expect(result.current.suggestions).toEqual([]);

    // 두 번째 요청 완료
    await act(async () => {
      resolveSecondRequest!({ suggestions: [{ id: '2', title: 'Second', contentPreview: '', relevanceScore: 10, createdAt: new Date() }] });
    });

    expect(result.current.suggestions).toEqual([{ id: '2', title: 'Second', contentPreview: '', relevanceScore: 10, createdAt: new Date() }]);
  });

  it('에러 상태가 올바르게 처리되어야 함', async () => {
    mockGetSearchSuggestions.mockResolvedValue({ 
      suggestions: [], 
      error: '검색 제안을 불러올 수 없습니다' 
    });

    const { result } = renderHook(() => useSearchSuggestions('test'));

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBe('검색 제안을 불러올 수 없습니다');
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('선택된 인덱스가 올바르게 관리되어야 함', () => {
    const { result } = renderHook(() => useSearchSuggestions('test'));

    // 인덱스 설정
    act(() => {
      result.current.setSelectedIndex(2);
    });

    expect(result.current.selectedIndex).toBe(2);

    // 범위를 벗어난 인덱스 설정
    act(() => {
      result.current.setSelectedIndex(10);
    });

    expect(result.current.selectedIndex).toBe(2); // 변경되지 않아야 함

    // 음수 인덱스 설정
    act(() => {
      result.current.setSelectedIndex(-5);
    });

    expect(result.current.selectedIndex).toBe(-1); // -1로 클램핑되어야 함
  });

  it('검색 제안 초기화가 올바르게 작동해야 함', async () => {
    mockGetSearchSuggestions.mockResolvedValue({ 
      suggestions: [{ id: '1', title: 'Test', contentPreview: '', relevanceScore: 10, createdAt: new Date() }] 
    });

    const { result } = renderHook(() => useSearchSuggestions('test'));

    // 검색 제안 로드
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.suggestions).toHaveLength(1);

    // 선택된 인덱스 설정
    act(() => {
      result.current.setSelectedIndex(0);
    });

    expect(result.current.selectedIndex).toBe(0);

    // 초기화
    act(() => {
      result.current.clearSuggestions();
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.selectedIndex).toBe(-1);
  });

  it('커스텀 디바운스 지연 시간이 적용되어야 함', async () => {
    mockGetSearchSuggestions.mockResolvedValue({ suggestions: [] });

    const { result } = renderHook(() => useSearchSuggestions('test', 500));

    act(() => {
      vi.advanceTimersByTime(300); // 기본 지연 시간
    });

    expect(mockGetSearchSuggestions).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200); // 커스텀 지연 시간 완료
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockGetSearchSuggestions).toHaveBeenCalledWith('test', 10);
  });

  it('커스텀 최소 검색어 길이가 적용되어야 함', async () => {
    const { result } = renderHook(() => useSearchSuggestions('ab', 300, 3));

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockGetSearchSuggestions).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
  });
});
