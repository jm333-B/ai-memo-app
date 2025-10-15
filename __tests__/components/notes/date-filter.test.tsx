// __tests__/components/notes/date-filter.test.tsx
// 날짜 필터 컴포넌트 테스트
// 날짜 선택, 미리 정의된 범위, 통계 표시 기능 검증
// 관련 파일: components/notes/date-filter.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DateFilter } from '@/components/notes/date-filter';
import { getDateRangeStats } from '@/app/actions/notes';

// Mock server actions
vi.mock('@/app/actions/notes', () => ({
  getDateRangeStats: vi.fn(),
}));

const mockGetDateRangeStats = vi.mocked(getDateRangeStats);

describe('DateFilter', () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-12-19T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기 렌더링이 올바르게 되어야 함', () => {
    render(<DateFilter onFilterChange={mockOnFilterChange} />);

    expect(screen.getByText('날짜 범위')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('날짜 범위를 선택하세요')).toBeInTheDocument();
    expect(screen.getByText('미리 정의된 범위를 선택하거나 사용자 정의 날짜를 입력하세요')).toBeInTheDocument();
  });

  it('미리 정의된 범위 선택이 작동해야 함', async () => {
    render(<DateFilter onFilterChange={mockOnFilterChange} />);

    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);

    // "오늘" 옵션 선택
    const todayOption = screen.getByText('오늘');
    fireEvent.click(todayOption);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.any(Date), // startDate
        expect.any(Date), // endDate
        true // isActive
      );
    });

    // 선택된 범위 표시 확인
    expect(screen.getByText('오늘')).toBeInTheDocument();
  });

  it('모든 미리 정의된 범위 옵션이 표시되어야 함', () => {
    render(<DateFilter onFilterChange={mockOnFilterChange} />);

    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);

    expect(screen.getByText('사용자 정의')).toBeInTheDocument();
    expect(screen.getByText('오늘')).toBeInTheDocument();
    expect(screen.getByText('이번 주')).toBeInTheDocument();
    expect(screen.getByText('이번 달')).toBeInTheDocument();
    expect(screen.getByText('최근 30일')).toBeInTheDocument();
  });

  it('날짜 범위 통계가 표시되어야 함', async () => {
    const mockStats = {
      totalCount: 5,
      startDate: '2024-12-19T00:00:00.000Z',
      endDate: '2024-12-19T23:59:59.999Z',
      dailyStats: [
        { date: '2024-12-19', count: 5 }
      ]
    };

    mockGetDateRangeStats.mockResolvedValue({ stats: mockStats });

    render(<DateFilter onFilterChange={mockOnFilterChange} />);

    // "오늘" 범위 선택
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    const todayOption = screen.getByText('오늘');
    fireEvent.click(todayOption);

    await waitFor(() => {
      expect(mockGetDateRangeStats).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('5개의 노트')).toBeInTheDocument();
    });
  });

  it('날짜 필터 초기화가 작동해야 함', async () => {
    render(<DateFilter onFilterChange={mockOnFilterChange} />);

    // 먼저 날짜 범위 선택
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    const todayOption = screen.getByText('오늘');
    fireEvent.click(todayOption);

    await waitFor(() => {
      expect(screen.getByText('초기화')).toBeInTheDocument();
    });

    // 초기화 버튼 클릭
    const clearButton = screen.getByText('초기화');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        null, // startDate
        null, // endDate
        false // isActive
      );
    });
  });

  it('사용자 정의 범위 선택이 작동해야 함', async () => {
    render(<DateFilter onFilterChange={mockOnFilterChange} />);

    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    const customOption = screen.getByText('사용자 정의');
    fireEvent.click(customOption);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        null, // startDate
        null, // endDate
        false // isActive
      );
    });
  });

  it('통계 로딩 상태가 표시되어야 함', async () => {
    // 통계 API를 지연시켜 로딩 상태 테스트
    mockGetDateRangeStats.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ stats: null }), 100))
    );

    render(<DateFilter onFilterChange={mockOnFilterChange} />);

    // "오늘" 범위 선택
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    const todayOption = screen.getByText('오늘');
    fireEvent.click(todayOption);

    // 로딩 상태 확인
    await waitFor(() => {
      expect(screen.getByText('(로딩 중...)')).toBeInTheDocument();
    });
  });

  it('통계 API 오류 처리가 올바르게 되어야 함', async () => {
    mockGetDateRangeStats.mockRejectedValue(new Error('API Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<DateFilter onFilterChange={mockOnFilterChange} />);

    // "오늘" 범위 선택
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    const todayOption = screen.getByText('오늘');
    fireEvent.click(todayOption);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        '날짜 범위 통계 조회 실패:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('날짜 범위가 비활성화되면 통계가 표시되지 않아야 함', async () => {
    render(<DateFilter onFilterChange={mockOnFilterChange} />);

    // 초기에는 통계 API가 호출되지 않아야 함
    expect(mockGetDateRangeStats).not.toHaveBeenCalled();

    // "오늘" 범위 선택
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    const todayOption = screen.getByText('오늘');
    fireEvent.click(todayOption);

    // 통계 API 호출 확인
    await waitFor(() => {
      expect(mockGetDateRangeStats).toHaveBeenCalled();
    });

    // "사용자 정의"로 변경 (비활성화)
    fireEvent.click(selectTrigger);
    const customOption = screen.getByText('사용자 정의');
    fireEvent.click(customOption);

    // 통계가 표시되지 않아야 함
    expect(screen.queryByText(/개의 노트/)).not.toBeInTheDocument();
  });
});
