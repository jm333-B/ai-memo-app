// __tests__/components/notes/empty-search-results.test.tsx
// 빈 검색 결과 컴포넌트 테스트
// 검색어 표시, 검색어 수정 제안, 추천 콘텐츠 기능 검증
// 관련 파일: components/notes/empty-search-results.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmptySearchResults } from '@/components/notes/empty-search-results';
import { getPopularTags, getSearchQuerySuggestions } from '@/app/actions/notes';

// Mock server actions
vi.mock('@/app/actions/notes', () => ({
  getPopularTags: vi.fn(),
  getSearchQuerySuggestions: vi.fn(),
}));

const mockGetPopularTags = vi.mocked(getPopularTags);
const mockGetSearchQuerySuggestions = vi.mocked(getSearchQuerySuggestions);

describe('EmptySearchResults', () => {
  const mockOnSearchQueryChange = vi.fn();
  const mockOnClearFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('검색어가 올바르게 표시되어야 함', () => {
    render(
      <EmptySearchResults
        searchQuery="test query"
        onSearchQueryChange={mockOnSearchQueryChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument();
    expect(screen.getByText('"test query"')).toBeInTheDocument();
    expect(screen.getByText('에 대한 검색 결과를 찾을 수 없습니다.')).toBeInTheDocument();
  });

  it('검색어 수정 제안이 표시되어야 함', async () => {
    mockGetSearchQuerySuggestions.mockResolvedValue({
      suggestions: ['javascript', 'react', 'nodejs'],
    });

    mockGetPopularTags.mockResolvedValue({
      tags: ['programming', 'web'],
    });

    render(
      <EmptySearchResults
        searchQuery="java"
        onSearchQueryChange={mockOnSearchQueryChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('다음 검색어를 시도해보세요:')).toBeInTheDocument();
    });

    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('nodejs')).toBeInTheDocument();
  });

  it('인기 태그가 표시되어야 함', async () => {
    mockGetSearchQuerySuggestions.mockResolvedValue({
      suggestions: [],
    });

    mockGetPopularTags.mockResolvedValue({
      tags: ['javascript', 'react', 'nodejs', 'typescript', 'vue'],
    });

    render(
      <EmptySearchResults
        searchQuery="test"
        onSearchQueryChange={mockOnSearchQueryChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('인기 태그:')).toBeInTheDocument();
    });

    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('nodejs')).toBeInTheDocument();
  });

  it('검색어 제안 클릭 시 onSearchQueryChange가 호출되어야 함', async () => {
    mockGetSearchQuerySuggestions.mockResolvedValue({
      suggestions: ['javascript', 'react'],
    });

    mockGetPopularTags.mockResolvedValue({
      tags: [],
    });

    render(
      <EmptySearchResults
        searchQuery="java"
        onSearchQueryChange={mockOnSearchQueryChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('javascript')).toBeInTheDocument();
    });

    const suggestionButton = screen.getByText('javascript');
    fireEvent.click(suggestionButton);

    expect(mockOnSearchQueryChange).toHaveBeenCalledWith('javascript');
  });

  it('인기 태그 클릭 시 onSearchQueryChange가 호출되어야 함', async () => {
    mockGetSearchQuerySuggestions.mockResolvedValue({
      suggestions: [],
    });

    mockGetPopularTags.mockResolvedValue({
      tags: ['javascript', 'react'],
    });

    render(
      <EmptySearchResults
        searchQuery="test"
        onSearchQueryChange={mockOnSearchQueryChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('javascript')).toBeInTheDocument();
    });

    const tagBadge = screen.getByText('javascript');
    fireEvent.click(tagBadge);

    expect(mockOnSearchQueryChange).toHaveBeenCalledWith('javascript');
  });

  it('필터 초기화 버튼 클릭 시 onClearFilters가 호출되어야 함', () => {
    mockGetSearchQuerySuggestions.mockResolvedValue({
      suggestions: [],
    });

    mockGetPopularTags.mockResolvedValue({
      tags: [],
    });

    render(
      <EmptySearchResults
        searchQuery="test"
        onSearchQueryChange={mockOnSearchQueryChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    const clearButton = screen.getByText('필터 초기화');
    fireEvent.click(clearButton);

    expect(mockOnClearFilters).toHaveBeenCalled();
  });

  it('로딩 상태가 표시되어야 함', () => {
    // Promise를 resolve하지 않아서 로딩 상태 유지
    mockGetSearchQuerySuggestions.mockReturnValue(new Promise(() => {}));
    mockGetPopularTags.mockReturnValue(new Promise(() => {}));

    render(
      <EmptySearchResults
        searchQuery="test"
        onSearchQueryChange={mockOnSearchQueryChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // 로딩 스켈레톤이 표시되어야 함
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('API 에러 시에도 기본 UI가 표시되어야 함', async () => {
    mockGetSearchQuerySuggestions.mockResolvedValue({
      suggestions: [],
      error: 'API 에러',
    });

    mockGetPopularTags.mockResolvedValue({
      tags: [],
      error: 'API 에러',
    });

    render(
      <EmptySearchResults
        searchQuery="test"
        onSearchQueryChange={mockOnSearchQueryChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // 기본 UI는 여전히 표시되어야 함
    expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument();
    expect(screen.getByText('"test"')).toBeInTheDocument();
  });

  it('검색어가 없을 때 제안이 표시되지 않아야 함', async () => {
    mockGetSearchQuerySuggestions.mockResolvedValue({
      suggestions: [],
    });

    mockGetPopularTags.mockResolvedValue({
      tags: [],
    });

    render(
      <EmptySearchResults
        searchQuery=""
        onSearchQueryChange={mockOnSearchQueryChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('다음 검색어를 시도해보세요:')).not.toBeInTheDocument();
    });
  });

  it('커스텀 className이 적용되어야 함', () => {
    const { container } = render(
      <EmptySearchResults
        searchQuery="test"
        onSearchQueryChange={mockOnSearchQueryChange}
        onClearFilters={mockOnClearFilters}
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('검색어가 긴 경우에도 올바르게 표시되어야 함', () => {
    const longQuery = 'very long search query that might cause layout issues';
    
    render(
      <EmptySearchResults
        searchQuery={longQuery}
        onSearchQueryChange={mockOnSearchQueryChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    expect(screen.getByText(`"${longQuery}"`)).toBeInTheDocument();
  });
});
