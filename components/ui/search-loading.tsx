// components/ui/search-loading.tsx
// 검색 로딩 상태를 위한 UI 컴포넌트
// 로딩 스피너, 스켈레톤 UI, 에러 상태 표시 기능 제공
// 관련 파일: hooks/use-search-loading.ts, components/notes/integrated-search.tsx

'use client';

import { memo } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { SearchActionType, ErrorType } from '@/hooks/use-search-loading';

interface SearchLoadingSpinnerProps {
  actionType: SearchActionType;
  className?: string;
}

export const SearchLoadingSpinner = memo(function SearchLoadingSpinner({
  actionType,
  className = '',
}: SearchLoadingSpinnerProps) {
  const getLoadingText = (actionType: SearchActionType) => {
    switch (actionType) {
      case 'search':
        return '검색 중...';
      case 'filter':
        return '필터 적용 중...';
      case 'pagination':
        return '페이지 로딩 중...';
      case 'suggestion':
        return '제안 로딩 중...';
      default:
        return '로딩 중...';
    }
  };

  return (
    <div className={cn('flex items-center justify-center gap-2 py-4', className)}>
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">
        {getLoadingText(actionType)}
      </span>
    </div>
  );
});

interface SearchSkeletonProps {
  type: 'list' | 'card' | 'inline';
  count?: number;
  className?: string;
}

export const SearchSkeleton = memo(function SearchSkeleton({
  type,
  count = 3,
  className = '',
}: SearchSkeletonProps) {
  const renderSkeletonItem = () => {
    switch (type) {
      case 'list':
        return (
          <div className="animate-pulse space-y-3 p-4 border rounded-lg">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-3 w-full rounded bg-gray-200"></div>
            <div className="h-3 w-2/3 rounded bg-gray-200"></div>
            <div className="flex gap-2 mt-2">
              <div className="h-5 w-16 rounded bg-gray-200"></div>
              <div className="h-5 w-20 rounded bg-gray-200"></div>
            </div>
          </div>
        );
      
      case 'card':
        return (
          <div className="animate-pulse space-y-3 p-6 border rounded-lg">
            <div className="h-5 w-1/2 rounded bg-gray-200"></div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-gray-200"></div>
              <div className="h-3 w-4/5 rounded bg-gray-200"></div>
              <div className="h-3 w-3/5 rounded bg-gray-200"></div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="h-4 w-24 rounded bg-gray-200"></div>
              <div className="h-6 w-16 rounded bg-gray-200"></div>
            </div>
          </div>
        );
      
      case 'inline':
        return (
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-gray-200"></div>
            <div className="h-4 w-20 rounded bg-gray-200"></div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          {renderSkeletonItem()}
        </div>
      ))}
    </div>
  );
});

interface SearchErrorProps {
  errorType: ErrorType;
  message: string;
  retryCount: number;
  maxRetries: number;
  onRetry?: () => void;
  className?: string;
}

export const SearchError = memo(function SearchError({
  errorType,
  message,
  retryCount,
  maxRetries,
  onRetry,
  className = '',
}: SearchErrorProps) {
  const getErrorTitle = (errorType: ErrorType) => {
    switch (errorType) {
      case 'network':
        return '네트워크 오류';
      case 'server':
        return '서버 오류';
      case 'timeout':
        return '요청 시간 초과';
      case 'unknown':
      default:
        return '오류 발생';
    }
  };

  const canRetry = retryCount < maxRetries && !!onRetry;

  return (
    <Alert variant="destructive" className={cn('my-4', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <div>
            <strong>{getErrorTitle(errorType)}</strong>
            <p className="text-sm mt-1">{message}</p>
          </div>
          
          {canRetry && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                재시도 ({retryCount + 1}/{maxRetries})
              </Button>
            </div>
          )}
          
          {!canRetry && retryCount >= maxRetries && (
            <p className="text-xs text-muted-foreground">
              최대 재시도 횟수에 도달했습니다. 잠시 후 다시 시도해주세요.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
});

interface SearchLoadingOverlayProps {
  isLoading: boolean;
  actionType: SearchActionType | null;
  children: React.ReactNode;
  className?: string;
}

export const SearchLoadingOverlay = memo(function SearchLoadingOverlay({
  isLoading,
  actionType,
  children,
  className = '',
}: SearchLoadingOverlayProps) {
  if (!isLoading || !actionType) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
        <SearchLoadingSpinner actionType={actionType} />
      </div>
    </div>
  );
});
