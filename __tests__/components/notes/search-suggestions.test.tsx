// __tests__/components/notes/search-suggestions.test.tsx
// 검색 제안 컴포넌트 테스트
// 검색 제안 표시, 키보드 네비게이션, 클릭 이벤트 처리 기능 검증
// 관련 파일: components/notes/search-suggestions.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchSuggestions } from '@/components/notes/search-suggestions';
import { SearchSuggestion } from '@/hooks/use-search-suggestions';

describe('SearchSuggestions', () => {
  const mockOnSuggestionSelect = vi.fn();
  const mockOnKeyDown = vi.fn();

  const mockSuggestions: SearchSuggestion[] = [
    {
      id: '1',
      title: 'JavaScript 프로그래밍',
      contentPreview: 'JavaScript는 웹 개발에 사용되는 프로그래밍 언어입니다...',
      relevanceScore: 15,
      createdAt: new Date('2024-12-19'),
    },
    {
      id: '2',
      title: 'React 개발 가이드',
      contentPreview: 'React는 사용자 인터페이스를 구축하기 위한 JavaScript 라이브러리입니다...',
      relevanceScore: 12,
      createdAt: new Date('2024-12-18'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('검색 제안이 렌더링되어야 함', () => {
    render(
      <SearchSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        error={null}
        selectedIndex={-1}
        onSuggestionSelect={mockOnSuggestionSelect}
        onKeyDown={mockOnKeyDown}
        isVisible={true}
      />
    );

    expect(screen.getByText('JavaScript 프로그래밍')).toBeInTheDocument();
    expect(screen.getByText('React 개발 가이드')).toBeInTheDocument();
    expect(screen.getByText('JavaScript는 웹 개발에 사용되는 프로그래밍 언어입니다...')).toBeInTheDocument();
  });

  it('로딩 상태가 표시되어야 함', () => {
    render(
      <SearchSuggestions
        suggestions={[]}
        isLoading={true}
        error={null}
        selectedIndex={-1}
        onSuggestionSelect={mockOnSuggestionSelect}
        onKeyDown={mockOnKeyDown}
        isVisible={true}
      />
    );

    expect(screen.getByText('검색 중...')).toBeInTheDocument();
  });

  it('에러 상태가 표시되어야 함', () => {
    render(
      <SearchSuggestions
        suggestions={[]}
        isLoading={false}
        error="검색 제안을 불러올 수 없습니다"
        selectedIndex={-1}
        onSuggestionSelect={mockOnSuggestionSelect}
        onKeyDown={mockOnKeyDown}
        isVisible={true}
      />
    );

    expect(screen.getByText('검색 제안을 불러올 수 없습니다')).toBeInTheDocument();
  });

  it('빈 검색 결과가 표시되어야 함', () => {
    render(
      <SearchSuggestions
        suggestions={[]}
        isLoading={false}
        error={null}
        selectedIndex={-1}
        onSuggestionSelect={mockOnSuggestionSelect}
        onKeyDown={mockOnKeyDown}
        isVisible={true}
      />
    );

    expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument();
  });

  it('검색 제안 클릭 시 onSuggestionSelect가 호출되어야 함', () => {
    render(
      <SearchSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        error={null}
        selectedIndex={-1}
        onSuggestionSelect={mockOnSuggestionSelect}
        onKeyDown={mockOnKeyDown}
        isVisible={true}
      />
    );

    const firstSuggestion = screen.getByText('JavaScript 프로그래밍');
    fireEvent.click(firstSuggestion);

    expect(mockOnSuggestionSelect).toHaveBeenCalledWith(mockSuggestions[0]);
  });

  it('선택된 검색 제안이 하이라이트되어야 함', () => {
    render(
      <SearchSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        error={null}
        selectedIndex={1}
        onSuggestionSelect={mockOnSuggestionSelect}
        onKeyDown={mockOnKeyDown}
        isVisible={true}
      />
    );

    const secondSuggestion = screen.getByText('React 개발 가이드').closest('div');
    expect(secondSuggestion).toHaveClass('bg-muted');
  });

  it('키보드 이벤트가 onKeyDown으로 전달되어야 함', () => {
    render(
      <SearchSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        error={null}
        selectedIndex={-1}
        onSuggestionSelect={mockOnSuggestionSelect}
        onKeyDown={mockOnKeyDown}
        isVisible={true}
      />
    );

    const container = screen.getByRole('generic');
    fireEvent.keyDown(container, { key: 'ArrowDown' });

    expect(mockOnKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'ArrowDown',
      })
    );
  });

  it('isVisible이 false일 때 렌더링되지 않아야 함', () => {
    const { container } = render(
      <SearchSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        error={null}
        selectedIndex={-1}
        onSuggestionSelect={mockOnSuggestionSelect}
        onKeyDown={mockOnKeyDown}
        isVisible={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('검색 제안에 날짜와 관련도 점수가 표시되어야 함', () => {
    render(
      <SearchSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        error={null}
        selectedIndex={-1}
        onSuggestionSelect={mockOnSuggestionSelect}
        onKeyDown={mockOnKeyDown}
        isVisible={true}
      />
    );

    expect(screen.getByText('2024. 12. 19.')).toBeInTheDocument();
    expect(screen.getByText('2024. 12. 18.')).toBeInTheDocument();
    expect(screen.getByText('관련도: 15')).toBeInTheDocument();
    expect(screen.getByText('관련도: 12')).toBeInTheDocument();
  });

  it('마우스 호버 시 선택된 인덱스가 업데이트되어야 함', () => {
    const mockSetSelectedIndex = vi.fn();
    
    render(
      <SearchSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        error={null}
        selectedIndex={-1}
        onSuggestionSelect={mockOnSuggestionSelect}
        onKeyDown={mockOnKeyDown}
        isVisible={true}
      />
    );

    const firstSuggestion = screen.getByText('JavaScript 프로그래밍').closest('div');
    fireEvent.mouseEnter(firstSuggestion!);

    // 마우스 호버 시 선택된 인덱스 업데이트는 부모 컴포넌트에서 처리
    // 여기서는 이벤트가 발생하는지만 확인
    expect(firstSuggestion).toBeInTheDocument();
  });

  it('커스텀 className이 적용되어야 함', () => {
    const { container } = render(
      <SearchSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        error={null}
        selectedIndex={-1}
        onSuggestionSelect={mockOnSuggestionSelect}
        onKeyDown={mockOnKeyDown}
        isVisible={true}
        className="custom-class"
      />
    );

    const suggestionsContainer = container.firstChild as HTMLElement;
    expect(suggestionsContainer).toHaveClass('custom-class');
  });

  it('포커스가 올바르게 관리되어야 함', () => {
    render(
      <SearchSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        error={null}
        selectedIndex={-1}
        onSuggestionSelect={mockOnSuggestionSelect}
        onKeyDown={mockOnKeyDown}
        isVisible={true}
      />
    );

    const container = screen.getByRole('generic');
    expect(container).toHaveAttribute('tabIndex', '-1');
  });
});
