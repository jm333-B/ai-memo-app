// components/notes/date-filter.tsx
// 날짜 범위 필터링을 위한 UI 컴포넌트
// 날짜 선택, 미리 정의된 범위 옵션, 선택된 범위 표시 기능 제공
// 관련 파일: hooks/use-date-filter.ts, app/actions/notes.ts

'use client';

import { useState, useEffect } from 'react';
import { Calendar, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDateFilter, PRESET_DATE_RANGES, type PresetRangeKey } from '@/hooks/use-date-filter';
import { getDateRangeStats } from '@/app/actions/notes';

interface DateFilterProps {
  onFilterChange: (startDate: Date | null, endDate: Date | null, isActive: boolean) => void;
  className?: string;
}

interface DateRangeStats {
  totalCount: number;
  startDate: string;
  endDate: string;
  dailyStats: Array<{ date: string; count: number }>;
}

export function DateFilter({ onFilterChange, className = '' }: DateFilterProps) {
  const {
    dateFilterState,
    setPresetRange,
    clearDateFilter,
    applyDateFilter,
    isDateRangeValid,
  } = useDateFilter();

  const [stats, setStats] = useState<DateRangeStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // 날짜 필터 상태가 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    const { startDate, endDate, isActive } = dateFilterState;
    onFilterChange(startDate, endDate, isActive);
  }, [dateFilterState, onFilterChange]);

  // 날짜 범위 통계 조회
  const fetchDateRangeStats = async (startDate: Date, endDate: Date) => {
    if (!isDateRangeValid) return;

    setIsLoadingStats(true);
    try {
      const result = await getDateRangeStats(startDate, endDate);
      if (result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('날짜 범위 통계 조회 실패:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // 날짜 필터가 활성화되면 통계 조회
  useEffect(() => {
    if (dateFilterState.isActive && dateFilterState.dateRange.startDate && dateFilterState.dateRange.endDate) {
      fetchDateRangeStats(dateFilterState.dateRange.startDate, dateFilterState.dateRange.endDate);
    } else {
      setStats(null);
    }
  }, [dateFilterState.isActive, dateFilterState.dateRange.startDate, dateFilterState.dateRange.endDate, isDateRangeValid]);

  // 미리 정의된 범위 선택 핸들러
  const handlePresetRangeChange = (preset: string) => {
    if (preset === 'custom') {
      clearDateFilter();
    } else {
      setPresetRange(preset as PresetRangeKey);
    }
  };

  // 날짜 범위 표시 포맷
  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = startDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const end = endDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (start === end) {
      return start;
    }
    return `${start} - ${end}`;
  };

  // 현재 선택된 프리셋 범위 표시
  const getCurrentPresetLabel = () => {
    if (dateFilterState.presetRange && dateFilterState.presetRange in PRESET_DATE_RANGES) {
      return PRESET_DATE_RANGES[dateFilterState.presetRange as PresetRangeKey].label;
    }
    return '사용자 정의';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 날짜 필터 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">날짜 범위</span>
        </div>
        {dateFilterState.isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDateFilter}
            className="h-6 px-2 text-xs self-start sm:self-auto"
          >
            <X className="h-3 w-3 mr-1" />
            초기화
          </Button>
        )}
      </div>

      {/* 미리 정의된 날짜 범위 선택 */}
      <div className="space-y-2">
        <Select
          value={dateFilterState.presetRange || 'custom'}
          onValueChange={handlePresetRangeChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="날짜 범위를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">사용자 정의</SelectItem>
            {Object.entries(PRESET_DATE_RANGES).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 선택된 날짜 범위 표시 */}
      {dateFilterState.isActive && dateFilterState.dateRange.startDate && dateFilterState.dateRange.endDate && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {getCurrentPresetLabel()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDateRange(dateFilterState.dateRange.startDate, dateFilterState.dateRange.endDate)}
            </span>
          </div>

          {/* 날짜 범위 통계 */}
          {stats && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">{stats.totalCount}개</span>의 노트
              {isLoadingStats && <span className="ml-1">(로딩 중...)</span>}
            </div>
          )}
        </div>
      )}

      {/* 사용자 정의 날짜 선택 안내 */}
      {!dateFilterState.isActive && (
        <div className="text-xs text-muted-foreground text-center py-2">
          미리 정의된 범위를 선택하거나 사용자 정의 날짜를 입력하세요
        </div>
      )}
    </div>
  );
}
