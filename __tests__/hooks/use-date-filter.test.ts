// __tests__/hooks/use-date-filter.test.ts
// 날짜 필터링 훅 테스트
// 날짜 범위 선택, 미리 정의된 범위, 필터 상태 관리 기능 검증
// 관련 파일: hooks/use-date-filter.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDateFilter, PRESET_DATE_RANGES } from '@/hooks/use-date-filter';

describe('useDateFilter', () => {
  beforeEach(() => {
    // 각 테스트 전에 시간을 고정
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-12-19T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기 상태가 올바르게 설정되어야 함', () => {
    const { result } = renderHook(() => useDateFilter());

    expect(result.current.dateFilterState.dateRange.startDate).toBeNull();
    expect(result.current.dateFilterState.dateRange.endDate).toBeNull();
    expect(result.current.dateFilterState.isActive).toBe(false);
    expect(result.current.dateFilterState.presetRange).toBeNull();
    expect(result.current.isDateRangeValid).toBe(false);
  });

  it('날짜 범위를 설정할 수 있어야 함', () => {
    const { result } = renderHook(() => useDateFilter());

    const startDate = new Date('2024-12-01');
    const endDate = new Date('2024-12-31');

    act(() => {
      result.current.setDateRange(startDate, endDate);
    });

    expect(result.current.dateFilterState.dateRange.startDate).toEqual(startDate);
    expect(result.current.dateFilterState.dateRange.endDate).toEqual(endDate);
    expect(result.current.dateFilterState.presetRange).toBeNull();
    expect(result.current.isDateRangeValid).toBe(true);
  });

  it('미리 정의된 범위를 설정할 수 있어야 함', () => {
    const { result } = renderHook(() => useDateFilter());

    act(() => {
      result.current.setPresetRange('today');
    });

    expect(result.current.dateFilterState.presetRange).toBe('today');
    expect(result.current.dateFilterState.isActive).toBe(true);
    expect(result.current.dateFilterState.dateRange.startDate).not.toBeNull();
    expect(result.current.dateFilterState.dateRange.endDate).not.toBeNull();
    expect(result.current.isDateRangeValid).toBe(true);
  });

  it('모든 미리 정의된 범위가 올바르게 작동해야 함', () => {
    const { result } = renderHook(() => useDateFilter());

    // 오늘 범위 테스트
    act(() => {
      result.current.setPresetRange('today');
    });

    const todayRange = PRESET_DATE_RANGES.today.getRange();
    expect(result.current.dateFilterState.dateRange.startDate).toEqual(todayRange.startDate);
    expect(result.current.dateFilterState.dateRange.endDate).toEqual(todayRange.endDate);

    // 이번 주 범위 테스트
    act(() => {
      result.current.setPresetRange('thisWeek');
    });

    const thisWeekRange = PRESET_DATE_RANGES.thisWeek.getRange();
    expect(result.current.dateFilterState.dateRange.startDate).toEqual(thisWeekRange.startDate);
    expect(result.current.dateFilterState.dateRange.endDate).toEqual(thisWeekRange.endDate);

    // 이번 달 범위 테스트
    act(() => {
      result.current.setPresetRange('thisMonth');
    });

    const thisMonthRange = PRESET_DATE_RANGES.thisMonth.getRange();
    expect(result.current.dateFilterState.dateRange.startDate).toEqual(thisMonthRange.startDate);
    expect(result.current.dateFilterState.dateRange.endDate).toEqual(thisMonthRange.endDate);

    // 최근 30일 범위 테스트
    act(() => {
      result.current.setPresetRange('last30Days');
    });

    const last30DaysRange = PRESET_DATE_RANGES.last30Days.getRange();
    expect(result.current.dateFilterState.dateRange.startDate).toEqual(last30DaysRange.startDate);
    expect(result.current.dateFilterState.dateRange.endDate).toEqual(last30DaysRange.endDate);
  });

  it('날짜 필터를 초기화할 수 있어야 함', () => {
    const { result } = renderHook(() => useDateFilter());

    // 먼저 날짜 범위 설정
    act(() => {
      result.current.setPresetRange('today');
    });

    expect(result.current.dateFilterState.isActive).toBe(true);

    // 초기화
    act(() => {
      result.current.clearDateFilter();
    });

    expect(result.current.dateFilterState.dateRange.startDate).toBeNull();
    expect(result.current.dateFilterState.dateRange.endDate).toBeNull();
    expect(result.current.dateFilterState.isActive).toBe(false);
    expect(result.current.dateFilterState.presetRange).toBeNull();
    expect(result.current.isDateRangeValid).toBe(false);
  });

  it('날짜 범위 유효성 검증이 올바르게 작동해야 함', () => {
    const { result } = renderHook(() => useDateFilter());

    // 유효한 날짜 범위
    const validStartDate = new Date('2024-12-01');
    const validEndDate = new Date('2024-12-31');

    act(() => {
      result.current.setDateRange(validStartDate, validEndDate);
    });

    expect(result.current.isDateRangeValid).toBe(true);

    // 시작일이 종료일보다 늦은 경우
    const invalidStartDate = new Date('2024-12-31');
    const invalidEndDate = new Date('2024-12-01');

    act(() => {
      result.current.setDateRange(invalidStartDate, invalidEndDate);
    });

    expect(result.current.isDateRangeValid).toBe(false);

    // null 값이 있는 경우
    act(() => {
      result.current.setDateRange(null, validEndDate);
    });

    expect(result.current.isDateRangeValid).toBe(false);
  });

  it('날짜 필터 적용이 올바르게 작동해야 함', () => {
    const { result } = renderHook(() => useDateFilter());

    const startDate = new Date('2024-12-01');
    const endDate = new Date('2024-12-31');

    act(() => {
      result.current.setDateRange(startDate, endDate);
      result.current.applyDateFilter();
    });

    expect(result.current.dateFilterState.isActive).toBe(true);
  });

  it('수동 날짜 선택 시 프리셋이 해제되어야 함', () => {
    const { result } = renderHook(() => useDateFilter());

    // 먼저 프리셋 설정
    act(() => {
      result.current.setPresetRange('today');
    });

    expect(result.current.dateFilterState.presetRange).toBe('today');

    // 수동 날짜 선택
    const startDate = new Date('2024-12-01');
    const endDate = new Date('2024-12-31');

    act(() => {
      result.current.setDateRange(startDate, endDate);
    });

    expect(result.current.dateFilterState.presetRange).toBeNull();
    expect(result.current.dateFilterState.dateRange.startDate).toEqual(startDate);
    expect(result.current.dateFilterState.dateRange.endDate).toEqual(endDate);
  });

  it('잘못된 프리셋 키 처리', () => {
    const { result } = renderHook(() => useDateFilter());

    // 먼저 유효한 프리셋 설정
    act(() => {
      result.current.setPresetRange('today');
    });

    expect(result.current.dateFilterState.isActive).toBe(true);

    // 잘못된 프리셋 키 설정
    act(() => {
      result.current.setPresetRange('invalid' as any);
    });

    expect(result.current.dateFilterState.presetRange).toBeNull();
    expect(result.current.dateFilterState.isActive).toBe(false);
    expect(result.current.dateFilterState.dateRange.startDate).toBeNull();
    expect(result.current.dateFilterState.dateRange.endDate).toBeNull();
  });
});
