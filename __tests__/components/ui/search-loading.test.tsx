// __tests__/components/ui/search-loading.test.tsx
// 검색 로딩 UI 컴포넌트 테스트
// 로딩 스피너, 스켈레톤 UI, 에러 상태 표시 기능 검증
// 관련 파일: components/ui/search-loading.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  SearchLoadingSpinner, 
  SearchSkeleton, 
  SearchError, 
  SearchLoadingOverlay 
} from '@/components/ui/search-loading';
import { SearchActionType, ErrorType } from '@/hooks/use-search-loading';

describe('SearchLoadingSpinner', () => {
  it('검색 액션 타입별 로딩 텍스트가 표시되어야 함', () => {
    const actionTypes: SearchActionType[] = ['search', 'filter', 'pagination', 'suggestion'];

    actionTypes.forEach(actionType => {
      const { unmount } = render(
        <SearchLoadingSpinner actionType={actionType} />
      );

      expect(screen.getByText(/로딩 중/)).toBeInTheDocument();
      unmount();
    });
  });

  it('검색 액션에 맞는 텍스트가 표시되어야 함', () => {
    render(<SearchLoadingSpinner actionType="search" />);
    expect(screen.getByText('검색 중...')).toBeInTheDocument();

    render(<SearchLoadingSpinner actionType="filter" />);
    expect(screen.getByText('필터 적용 중...')).toBeInTheDocument();

    render(<SearchLoadingSpinner actionType="pagination" />);
    expect(screen.getByText('페이지 로딩 중...')).toBeInTheDocument();

    render(<SearchLoadingSpinner actionType="suggestion" />);
    expect(screen.getByText('제안 로딩 중...')).toBeInTheDocument();
  });

  it('커스텀 className이 적용되어야 함', () => {
    const { container } = render(
      <SearchLoadingSpinner actionType="search" className="custom-class" />
    );

    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toHaveClass('custom-class');
  });

  it('로딩 스피너 아이콘이 표시되어야 함', () => {
    render(<SearchLoadingSpinner actionType="search" />);
    
    const spinner = screen.getByRole('generic').querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

describe('SearchSkeleton', () => {
  it('list 타입 스켈레톤이 렌더링되어야 함', () => {
    render(<SearchSkeleton type="list" count={2} />);
    
    const skeletonItems = screen.getAllByRole('generic');
    expect(skeletonItems).toHaveLength(2);
  });

  it('card 타입 스켈레톤이 렌더링되어야 함', () => {
    render(<SearchSkeleton type="card" count={3} />);
    
    const skeletonItems = screen.getAllByRole('generic');
    expect(skeletonItems).toHaveLength(3);
  });

  it('inline 타입 스켈레톤이 렌더링되어야 함', () => {
    render(<SearchSkeleton type="inline" count={1} />);
    
    const skeletonItems = screen.getAllByRole('generic');
    expect(skeletonItems).toHaveLength(1);
  });

  it('기본 개수(3개)로 렌더링되어야 함', () => {
    render(<SearchSkeleton type="list" />);
    
    const skeletonItems = screen.getAllByRole('generic');
    expect(skeletonItems).toHaveLength(3);
  });

  it('커스텀 className이 적용되어야 함', () => {
    const { container } = render(
      <SearchSkeleton type="list" className="custom-class" />
    );

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('custom-class');
  });

  it('애니메이션 클래스가 적용되어야 함', () => {
    render(<SearchSkeleton type="list" />);
    
    const animatedElements = screen.getAllByRole('generic');
    animatedElements.forEach(element => {
      expect(element).toHaveClass('animate-pulse');
    });
  });
});

describe('SearchError', () => {
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('에러 타입별 제목이 표시되어야 함', () => {
    const errorTypes: ErrorType[] = ['network', 'server', 'timeout', 'unknown'];

    errorTypes.forEach(errorType => {
      const { unmount } = render(
        <SearchError
          errorType={errorType}
          message="테스트 오류"
          retryCount={0}
          maxRetries={3}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText(/오류/)).toBeInTheDocument();
      unmount();
    });
  });

  it('네트워크 오류 시 올바른 제목이 표시되어야 함', () => {
    render(
      <SearchError
        errorType="network"
        message="네트워크 연결 실패"
        retryCount={0}
        maxRetries={3}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
    expect(screen.getByText('네트워크 연결 실패')).toBeInTheDocument();
  });

  it('서버 오류 시 올바른 제목이 표시되어야 함', () => {
    render(
      <SearchError
        errorType="server"
        message="서버 내부 오류"
        retryCount={0}
        maxRetries={3}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('서버 오류')).toBeInTheDocument();
    expect(screen.getByText('서버 내부 오류')).toBeInTheDocument();
  });

  it('재시도 가능할 때 재시도 버튼이 표시되어야 함', () => {
    render(
      <SearchError
        errorType="network"
        message="네트워크 오류"
        retryCount={1}
        maxRetries={3}
        onRetry={mockOnRetry}
      />
    );

    const retryButton = screen.getByText('재시도 (2/3)');
    expect(retryButton).toBeInTheDocument();
  });

  it('재시도 버튼 클릭 시 onRetry가 호출되어야 함', () => {
    render(
      <SearchError
        errorType="network"
        message="네트워크 오류"
        retryCount={0}
        maxRetries={3}
        onRetry={mockOnRetry}
      />
    );

    const retryButton = screen.getByText('재시도 (1/3)');
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('최대 재시도 횟수 초과 시 재시도 버튼이 표시되지 않아야 함', () => {
    render(
      <SearchError
        errorType="network"
        message="네트워크 오류"
        retryCount={3}
        maxRetries={3}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.queryByText(/재시도/)).not.toBeInTheDocument();
    expect(screen.getByText('최대 재시도 횟수에 도달했습니다. 잠시 후 다시 시도해주세요.')).toBeInTheDocument();
  });

  it('onRetry가 없을 때 재시도 버튼이 표시되지 않아야 함', () => {
    render(
      <SearchError
        errorType="network"
        message="네트워크 오류"
        retryCount={0}
        maxRetries={3}
      />
    );

    expect(screen.queryByText(/재시도/)).not.toBeInTheDocument();
  });

  it('커스텀 className이 적용되어야 함', () => {
    const { container } = render(
      <SearchError
        errorType="network"
        message="네트워크 오류"
        retryCount={0}
        maxRetries={3}
        onRetry={mockOnRetry}
        className="custom-class"
      />
    );

    const errorComponent = container.firstChild as HTMLElement;
    expect(errorComponent).toHaveClass('custom-class');
  });
});

describe('SearchLoadingOverlay', () => {
  it('로딩 중일 때 오버레이가 표시되어야 함', () => {
    render(
      <SearchLoadingOverlay isLoading={true} actionType="search">
        <div>Content</div>
      </SearchLoadingOverlay>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('검색 중...')).toBeInTheDocument();
  });

  it('로딩 중이 아닐 때 오버레이가 표시되지 않아야 함', () => {
    render(
      <SearchLoadingOverlay isLoading={false} actionType={null}>
        <div>Content</div>
      </SearchLoadingOverlay>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByText('검색 중...')).not.toBeInTheDocument();
  });

  it('actionType이 null일 때 오버레이가 표시되지 않아야 함', () => {
    render(
      <SearchLoadingOverlay isLoading={true} actionType={null}>
        <div>Content</div>
      </SearchLoadingOverlay>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByText('검색 중...')).not.toBeInTheDocument();
  });

  it('다양한 액션 타입에 대해 올바른 로딩 텍스트가 표시되어야 함', () => {
    const actionTypes: SearchActionType[] = ['search', 'filter', 'pagination', 'suggestion'];

    actionTypes.forEach(actionType => {
      const { unmount } = render(
        <SearchLoadingOverlay isLoading={true} actionType={actionType}>
          <div>Content</div>
        </SearchLoadingOverlay>
      );

      expect(screen.getByText(/로딩 중/)).toBeInTheDocument();
      unmount();
    });
  });

  it('커스텀 className이 적용되어야 함', () => {
    const { container } = render(
      <SearchLoadingOverlay 
        isLoading={true} 
        actionType="search"
        className="custom-class"
      >
        <div>Content</div>
      </SearchLoadingOverlay>
    );

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass('custom-class');
  });
});
