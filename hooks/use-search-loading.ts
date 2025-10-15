// hooks/use-search-loading.ts
// 검색 로딩 상태 관리 훅
// 검색 액션별 로딩 상태, 에러 처리, 재시도 로직 제공
// 관련 파일: components/notes/integrated-search.tsx, components/ui/search-loading.tsx

'use client';

import { useState, useCallback, useRef } from 'react';

export type SearchActionType = 'search' | 'filter' | 'pagination' | 'suggestion';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type ErrorType = 'network' | 'server' | 'timeout' | 'unknown';

export interface SearchLoadingState {
  state: LoadingState;
  actionType: SearchActionType | null;
  error: {
    type: ErrorType;
    message: string;
    retryCount: number;
  } | null;
  performance: {
    startTime: number | null;
    duration: number | null;
    lastSearchTime: number | null;
  };
}

export interface UseSearchLoadingReturn {
  loadingState: SearchLoadingState;
  startLoading: (actionType: SearchActionType) => void;
  finishLoading: (success: boolean, error?: { type: ErrorType; message: string }) => void;
  retry: () => Promise<void>;
  reset: () => void;
  isLoading: boolean;
  hasError: boolean;
  canRetry: boolean;
}

export function useSearchLoading(
  onRetry?: () => Promise<void>,
  maxRetries: number = 3
): UseSearchLoadingReturn {
  const [loadingState, setLoadingState] = useState<SearchLoadingState>({
    state: 'idle',
    actionType: null,
    error: null,
    performance: {
      startTime: null,
      duration: null,
      lastSearchTime: null,
    },
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 로딩 시작
  const startLoading = useCallback((actionType: SearchActionType) => {
    const startTime = Date.now();
    
    setLoadingState(prev => ({
      ...prev,
      state: 'loading',
      actionType,
      error: null,
      performance: {
        ...prev.performance,
        startTime,
        duration: null,
      },
    }));
  }, []);

  // 로딩 완료
  const finishLoading = useCallback((
    success: boolean, 
    error?: { type: ErrorType; message: string }
  ) => {
    const endTime = Date.now();
    
    setLoadingState(prev => {
      const duration = prev.performance.startTime 
        ? endTime - prev.performance.startTime 
        : null;

      if (success) {
        return {
          ...prev,
          state: 'success',
          actionType: null,
          error: null,
          performance: {
            ...prev.performance,
            duration,
            lastSearchTime: endTime,
          },
        };
      } else {
        return {
          ...prev,
          state: 'error',
          error: error ? {
            ...error,
            retryCount: prev.error?.retryCount || 0,
          } : {
            type: 'unknown',
            message: '알 수 없는 오류가 발생했습니다',
            retryCount: prev.error?.retryCount || 0,
          },
          performance: {
            ...prev.performance,
            duration,
          },
        };
      }
    });
  }, []);

  // 재시도 (exponential backoff)
  const retry = useCallback(async () => {
    if (!onRetry || (loadingState.error?.retryCount || 0) >= maxRetries) {
      return;
    }

    const retryCount = loadingState.error?.retryCount || 0;
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // 최대 10초

    // 이전 타임아웃 정리
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // exponential backoff 적용
    retryTimeoutRef.current = setTimeout(async () => {
      try {
        setLoadingState(prev => ({
          ...prev,
          error: prev.error ? {
            ...prev.error,
            retryCount: retryCount + 1,
          } : null,
        }));

        await onRetry();
      } catch (error) {
        console.error('재시도 실패:', error);
      }
    }, delay);
  }, [onRetry, maxRetries, loadingState.error?.retryCount]);

  // 상태 초기화
  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setLoadingState({
      state: 'idle',
      actionType: null,
      error: null,
      performance: {
        startTime: null,
        duration: null,
        lastSearchTime: loadingState.performance.lastSearchTime,
      },
    });
  }, [loadingState.performance.lastSearchTime]);

  // 편의 속성들
  const isLoading = loadingState.state === 'loading';
  const hasError = loadingState.state === 'error';
  const canRetry = hasError && 
    !!loadingState.error && 
    (loadingState.error.retryCount || 0) < maxRetries &&
    !!onRetry;

  return {
    loadingState,
    startLoading,
    finishLoading,
    retry,
    reset,
    isLoading,
    hasError,
    canRetry,
  };
}
