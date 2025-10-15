// hooks/use-date-filter.ts
// 날짜 범위 필터링을 위한 커스텀 훅
// 날짜 선택, 미리 정의된 범위, 필터 상태 관리 기능 제공
// 관련 파일: app/actions/notes.ts, components/notes/date-filter.tsx

'use client';

import { useState, useCallback } from 'react';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface DateFilterState {
  dateRange: DateRange;
  isActive: boolean;
  presetRange: string | null;
}

export interface UseDateFilterReturn {
  dateFilterState: DateFilterState;
  setDateRange: (startDate: Date | null, endDate: Date | null) => void;
  setPresetRange: (preset: string | null) => void;
  clearDateFilter: () => void;
  applyDateFilter: () => void;
  isDateRangeValid: boolean;
}

// 미리 정의된 날짜 범위 옵션
export const PRESET_DATE_RANGES = {
  today: {
    label: '오늘',
    getRange: () => {
      const today = new Date();
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999),
      };
    },
  },
  thisWeek: {
    label: '이번 주',
    getRange: () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return { startDate: startOfWeek, endDate: endOfWeek };
    },
  },
  thisMonth: {
    label: '이번 달',
    getRange: () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      return { startDate: startOfMonth, endDate: endOfMonth };
    },
  },
  last30Days: {
    label: '최근 30일',
    getRange: () => {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      
      today.setHours(23, 59, 59, 999);
      
      return { startDate: thirtyDaysAgo, endDate: today };
    },
  },
} as const;

export type PresetRangeKey = keyof typeof PRESET_DATE_RANGES;

export function useDateFilter(): UseDateFilterReturn {
  const [dateFilterState, setDateFilterState] = useState<DateFilterState>({
    dateRange: {
      startDate: null,
      endDate: null,
    },
    isActive: false,
    presetRange: null,
  });

  // 날짜 범위 유효성 검증
  const isDateRangeValid = useCallback(() => {
    const { startDate, endDate } = dateFilterState.dateRange;
    return startDate !== null && endDate !== null && startDate <= endDate;
  }, [dateFilterState.dateRange]);

  // 날짜 범위 설정
  const setDateRange = useCallback((startDate: Date | null, endDate: Date | null) => {
    setDateFilterState(prev => ({
      ...prev,
      dateRange: { startDate, endDate },
      presetRange: null, // 수동 날짜 선택 시 프리셋 해제
    }));
  }, []);

  // 미리 정의된 범위 설정
  const setPresetRange = useCallback((preset: string | null) => {
    if (!preset || !(preset in PRESET_DATE_RANGES)) {
      setDateFilterState(prev => ({
        ...prev,
        presetRange: null,
        dateRange: { startDate: null, endDate: null },
        isActive: false,
      }));
      return;
    }

    const presetConfig = PRESET_DATE_RANGES[preset as PresetRangeKey];
    const { startDate, endDate } = presetConfig.getRange();

    setDateFilterState(prev => ({
      ...prev,
      dateRange: { startDate, endDate },
      presetRange: preset,
      isActive: true,
    }));
  }, []);

  // 날짜 필터 초기화
  const clearDateFilter = useCallback(() => {
    setDateFilterState({
      dateRange: {
        startDate: null,
        endDate: null,
      },
      isActive: false,
      presetRange: null,
    });
  }, []);

  // 날짜 필터 적용
  const applyDateFilter = useCallback(() => {
    if (isDateRangeValid()) {
      setDateFilterState(prev => ({
        ...prev,
        isActive: true,
      }));
    }
  }, [isDateRangeValid]);

  return {
    dateFilterState,
    setDateRange,
    setPresetRange,
    clearDateFilter,
    applyDateFilter,
    isDateRangeValid: isDateRangeValid(),
  };
}
