// __tests__/hooks/use-search-loading.test.ts
// 검색 로딩 상태 관리 훅 테스트
// 로딩 상태 전환, 에러 처리, 재시도 로직 검증
// 관련 파일: hooks/use-search-loading.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchLoading } from '@/hooks/use-search-loading';

describe('useSearchLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기 상태가 올바르게 설정되어야 함', () => {
    const { result } = renderHook(() => useSearchLoading());

    expect(result.current.loadingState.state).toBe('idle');
    expect(result.current.loadingState.actionType).toBeNull();
    expect(result.current.loadingState.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.canRetry).toBe(false);
  });

  it('로딩 시작 시 상태가 올바르게 변경되어야 함', () => {
    const { result } = renderHook(() => useSearchLoading());

    act(() => {
      result.current.startLoading('search');
    });

    expect(result.current.loadingState.state).toBe('loading');
    expect(result.current.loadingState.actionType).toBe('search');
    expect(result.current.loadingState.error).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasError).toBe(false);
  });

  it('로딩 성공 시 상태가 올바르게 변경되어야 함', () => {
    const { result } = renderHook(() => useSearchLoading());

    act(() => {
      result.current.startLoading('search');
    });

    act(() => {
      result.current.finishLoading(true);
    });

    expect(result.current.loadingState.state).toBe('success');
    expect(result.current.loadingState.actionType).toBeNull();
    expect(result.current.loadingState.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it('로딩 실패 시 에러 상태가 올바르게 설정되어야 함', () => {
    const { result } = renderHook(() => useSearchLoading());

    act(() => {
      result.current.startLoading('search');
    });

    act(() => {
      result.current.finishLoading(false, {
        type: 'network',
        message: '네트워크 오류가 발생했습니다'
      });
    });

    expect(result.current.loadingState.state).toBe('error');
    expect(result.current.loadingState.error).toEqual({
      type: 'network',
      message: '네트워크 오류가 발생했습니다',
      retryCount: 0
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(true);
  });

  it('재시도 기능이 올바르게 작동해야 함', async () => {
    const mockRetry = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useSearchLoading(mockRetry, 3));

    // 에러 상태 설정
    act(() => {
      result.current.startLoading('search');
    });

    act(() => {
      result.current.finishLoading(false, {
        type: 'network',
        message: '네트워크 오류'
      });
    });

    expect(result.current.canRetry).toBe(true);

    // 재시도 실행
    act(() => {
      result.current.retry();
    });

    // exponential backoff 시간 진행
    act(() => {
      vi.advanceTimersByTime(1000); // 첫 번째 재시도는 1초 후
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockRetry).toHaveBeenCalledTimes(1);
    expect(result.current.loadingState.error?.retryCount).toBe(1);
  });

  it('최대 재시도 횟수 초과 시 재시도가 비활성화되어야 함', () => {
    const mockRetry = vi.fn();
    const { result } = renderHook(() => useSearchLoading(mockRetry, 2));

    // 에러 상태 설정 (재시도 횟수 2회로 설정)
    act(() => {
      result.current.startLoading('search');
    });

    act(() => {
      result.current.finishLoading(false, {
        type: 'network',
        message: '네트워크 오류'
      });
    });

    // 재시도 횟수를 최대값으로 설정
    act(() => {
      result.current.loadingState.error!.retryCount = 2;
    });

    expect(result.current.canRetry).toBe(false);
  });

  it('상태 초기화가 올바르게 작동해야 함', () => {
    const { result } = renderHook(() => useSearchLoading());

    // 에러 상태 설정
    act(() => {
      result.current.startLoading('search');
    });

    act(() => {
      result.current.finishLoading(false, {
        type: 'server',
        message: '서버 오류'
      });
    });

    expect(result.current.hasError).toBe(true);

    // 상태 초기화
    act(() => {
      result.current.reset();
    });

    expect(result.current.loadingState.state).toBe('idle');
    expect(result.current.loadingState.actionType).toBeNull();
    expect(result.current.loadingState.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it('성능 메트릭이 올바르게 기록되어야 함', () => {
    const { result } = renderHook(() => useSearchLoading());

    const startTime = Date.now();

    act(() => {
      result.current.startLoading('search');
    });

    expect(result.current.loadingState.performance.startTime).toBeGreaterThanOrEqual(startTime);

    act(() => {
      result.current.finishLoading(true);
    });

    expect(result.current.loadingState.performance.duration).toBeGreaterThan(0);
    expect(result.current.loadingState.performance.lastSearchTime).toBeGreaterThanOrEqual(startTime);
  });

  it('다양한 검색 액션 타입이 올바르게 처리되어야 함', () => {
    const { result } = renderHook(() => useSearchLoading());

    const actionTypes = ['search', 'filter', 'pagination', 'suggestion'] as const;

    actionTypes.forEach(actionType => {
      act(() => {
        result.current.startLoading(actionType);
      });

      expect(result.current.loadingState.actionType).toBe(actionType);

      act(() => {
        result.current.finishLoading(true);
      });
    });
  });

  it('에러 타입별 처리가 올바르게 작동해야 함', () => {
    const { result } = renderHook(() => useSearchLoading());

    const errorTypes = ['network', 'server', 'timeout', 'unknown'] as const;

    errorTypes.forEach(errorType => {
      act(() => {
        result.current.startLoading('search');
      });

      act(() => {
        result.current.finishLoading(false, {
          type: errorType,
          message: `${errorType} 오류`
        });
      });

      expect(result.current.loadingState.error?.type).toBe(errorType);
      expect(result.current.loadingState.error?.message).toBe(`${errorType} 오류`);

      act(() => {
        result.current.reset();
      });
    });
  });

  it('exponential backoff가 올바르게 적용되어야 함', async () => {
    const mockRetry = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useSearchLoading(mockRetry, 3));

    // 첫 번째 재시도
    act(() => {
      result.current.startLoading('search');
    });

    act(() => {
      result.current.finishLoading(false, {
        type: 'network',
        message: '네트워크 오류'
      });
    });

    act(() => {
      result.current.retry();
    });

    // 1초 후 첫 번째 재시도 실행
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockRetry).toHaveBeenCalledTimes(1);

    // 두 번째 재시도 (2초 후)
    act(() => {
      result.current.retry();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockRetry).toHaveBeenCalledTimes(2);

    // 세 번째 재시도 (4초 후)
    act(() => {
      result.current.retry();
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockRetry).toHaveBeenCalledTimes(3);
  });

  it('타임아웃 정리가 올바르게 작동해야 함', () => {
    const mockRetry = vi.fn();
    const { result } = renderHook(() => useSearchLoading(mockRetry, 3));

    // 재시도 시작
    act(() => {
      result.current.startLoading('search');
    });

    act(() => {
      result.current.finishLoading(false, {
        type: 'network',
        message: '네트워크 오류'
      });
    });

    act(() => {
      result.current.retry();
    });

    // 상태 초기화 (타임아웃 정리)
    act(() => {
      result.current.reset();
    });

    // 시간 진행 (타임아웃이 정리되었으므로 재시도가 실행되지 않아야 함)
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockRetry).not.toHaveBeenCalled();
  });
});
