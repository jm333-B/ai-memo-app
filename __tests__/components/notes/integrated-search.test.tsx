// __tests__/components/notes/integrated-search.test.tsx
// 통합 검색 컴포넌트 테스트
// 검색 입력, 상태 관리, URL 동기화 기능 검증
// 관련 파일: components/notes/integrated-search.tsx, hooks/use-integrated-search.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IntegratedSearch } from '@/components/notes/integrated-search';

// Next.js 훅 모킹
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// 통합 검색 훅 모킹
vi.mock('@/hooks/use-integrated-search', () => ({
  useIntegratedSearch: vi.fn(),
}));

describe('IntegratedSearch', () => {
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

  it('검색 입력 필드가 렌더링되어야 함', () => {
    const { useIntegratedSearch } = require('@/hooks/use-integrated-search');
    
    useIntegratedSearch.mockReturnValue({
      searchState: {
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
      },
      handleSearch: vi.fn(),
      clearSearch: vi.fn(),
      updateURL: vi.fn(),
      setSelectedTags: vi.fn(),
      setDateRange: vi.fn(),
    });

    render(<IntegratedSearch />);
    
    expect(screen.getByPlaceholderText('노트 검색...')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('검색어 입력 시 handleSearch가 호출되어야 함', async () => {
    const mockHandleSearch = vi.fn();
    const { useIntegratedSearch } = require('@/hooks/use-integrated-search');
    
    useIntegratedSearch.mockReturnValue({
      searchState: {
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
      },
      handleSearch: mockHandleSearch,
      clearSearch: vi.fn(),
      updateURL: vi.fn(),
      setSelectedTags: vi.fn(),
      setDateRange: vi.fn(),
    });

    render(<IntegratedSearch />);
    
    const input = screen.getByPlaceholderText('노트 검색...');
    fireEvent.change(input, { target: { value: 'test query' } });
    
    await waitFor(() => {
      expect(mockHandleSearch).toHaveBeenCalledWith('test query');
    });
  });

  it('검색어가 있을 때 X 버튼이 표시되어야 함', () => {
    const mockClearSearch = vi.fn();
    const { useIntegratedSearch } = require('@/hooks/use-integrated-search');
    
    useIntegratedSearch.mockReturnValue({
      searchState: {
        query: 'test query',
        results: [],
        isLoading: false,
        hasSearched: false,
      },
      handleSearch: vi.fn(),
      clearSearch: mockClearSearch,
      updateURL: vi.fn(),
    });

    render(<IntegratedSearch />);
    
    const clearButton = screen.getByRole('button', { name: '' });
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    expect(mockClearSearch).toHaveBeenCalled();
  });

  it('검색 중일 때 로딩 상태가 표시되어야 함', () => {
    const { useIntegratedSearch } = require('@/hooks/use-integrated-search');
    
    useIntegratedSearch.mockReturnValue({
      searchState: {
        query: 'test query',
        results: [],
        isLoading: true,
        hasSearched: true,
      },
      handleSearch: vi.fn(),
      clearSearch: vi.fn(),
      updateURL: vi.fn(),
    });

    render(<IntegratedSearch />);
    
    expect(screen.getByText('검색 중...')).toBeInTheDocument();
  });

  it('검색 에러가 있을 때 에러 메시지가 표시되어야 함', () => {
    const { useIntegratedSearch } = require('@/hooks/use-integrated-search');
    
    useIntegratedSearch.mockReturnValue({
      searchState: {
        query: 'test query',
        results: [],
        isLoading: false,
        hasSearched: true,
        error: '검색 중 오류가 발생했습니다',
      },
      handleSearch: vi.fn(),
      clearSearch: vi.fn(),
      updateURL: vi.fn(),
    });

    render(<IntegratedSearch />);
    
    expect(screen.getByText('검색 중 오류가 발생했습니다')).toBeInTheDocument();
  });

  it('검색 결과가 있을 때 결과 개수가 표시되어야 함', () => {
    const { useIntegratedSearch } = require('@/hooks/use-integrated-search');
    
    useIntegratedSearch.mockReturnValue({
      searchState: {
        query: 'test query',
        results: [
          { id: '1', title: 'Test Note 1', content: 'Content 1' },
          { id: '2', title: 'Test Note 2', content: 'Content 2' },
        ],
        isLoading: false,
        hasSearched: true,
      },
      handleSearch: vi.fn(),
      clearSearch: vi.fn(),
      updateURL: vi.fn(),
    });

    render(<IntegratedSearch />);
    
    expect(screen.getByText('"test query"에 대한 검색 결과 2개')).toBeInTheDocument();
  });

  it('Enter 키 입력 시 기본 동작이 방지되어야 함', () => {
    const { useIntegratedSearch } = require('@/hooks/use-integrated-search');
    
    useIntegratedSearch.mockReturnValue({
      searchState: {
        query: '',
        results: [],
        isLoading: false,
        hasSearched: false,
      },
      handleSearch: vi.fn(),
      clearSearch: vi.fn(),
      updateURL: vi.fn(),
    });

    render(<IntegratedSearch />);
    
    const input = screen.getByPlaceholderText('노트 검색...');
    const preventDefault = vi.fn();
    
    fireEvent.keyPress(input, { key: 'Enter', preventDefault });
    
    expect(preventDefault).toHaveBeenCalled();
  });

  it('날짜 범위 필터링이 활성화되면 날짜 필터 상태가 표시되어야 함', () => {
    const { useIntegratedSearch } = require('@/hooks/use-integrated-search');
    
    useIntegratedSearch.mockReturnValue({
      searchState: {
        query: '',
        results: [
          { id: '1', title: 'Date Filtered Note', content: 'Content 1' },
        ],
        isLoading: false,
        hasSearched: true,
        selectedTags: [],
        dateRange: {
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31'),
          isActive: true,
        },
      },
      handleSearch: vi.fn(),
      clearSearch: vi.fn(),
      updateURL: vi.fn(),
      setSelectedTags: vi.fn(),
      setDateRange: vi.fn(),
    });

    render(<IntegratedSearch />);
    
    expect(screen.getByText('날짜 범위 필터에 대한 검색 결과 1개')).toBeInTheDocument();
  });

  it('태그와 날짜 범위가 모두 활성화되면 날짜 범위가 우선 표시되어야 함', () => {
    const { useIntegratedSearch } = require('@/hooks/use-integrated-search');
    
    useIntegratedSearch.mockReturnValue({
      searchState: {
        query: 'test',
        results: [
          { id: '1', title: 'Filtered Note', content: 'Content 1' },
        ],
        isLoading: false,
        hasSearched: true,
        selectedTags: ['개발'],
        dateRange: {
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31'),
          isActive: true,
        },
      },
      handleSearch: vi.fn(),
      clearSearch: vi.fn(),
      updateURL: vi.fn(),
      setSelectedTags: vi.fn(),
      setDateRange: vi.fn(),
    });

    render(<IntegratedSearch />);
    
    expect(screen.getByText('날짜 범위 필터에 대한 검색 결과 1개')).toBeInTheDocument();
  });

  it('태그 필터와 날짜 필터 컴포넌트가 렌더링되어야 함', () => {
    const { useIntegratedSearch } = require('@/hooks/use-integrated-search');
    
    useIntegratedSearch.mockReturnValue({
      searchState: {
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
      },
      handleSearch: vi.fn(),
      clearSearch: vi.fn(),
      updateURL: vi.fn(),
      setSelectedTags: vi.fn(),
      setDateRange: vi.fn(),
    });

    render(<IntegratedSearch />);
    
    // 태그 필터와 날짜 필터가 렌더링되는지 확인
    expect(screen.getByText('태그')).toBeInTheDocument();
    expect(screen.getByText('날짜 범위')).toBeInTheDocument();
  });
});
