// components/notes/pagination.tsx
// 노트 목록의 페이지네이션 UI 컴포넌트
// 이전/다음 버튼과 페이지 번호를 표시하고 페이지 전환 기능 제공
// 관련 파일: app/notes/page.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();

  const createPageURL = (pageNumber: number) => {
    return `${pathname}?page=${pageNumber}`;
  };

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-center gap-2 pt-8">
      <Link href={createPageURL(currentPage - 1)}>
        <Button variant="outline" disabled={!hasPrevious} size="sm">
          이전
        </Button>
      </Link>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          // 현재 페이지 근처만 표시
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <Link key={page} href={createPageURL(page)}>
                <Button
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  className="min-w-[40px]"
                >
                  {page}
                </Button>
              </Link>
            );
          }

          // 생략 표시 (...)
          if (page === currentPage - 2 || page === currentPage + 2) {
            return (
              <span key={page} className="px-2 text-gray-500">
                ...
              </span>
            );
          }

          return null;
        })}
      </div>

      <Link href={createPageURL(currentPage + 1)}>
        <Button variant="outline" disabled={!hasNext} size="sm">
          다음
        </Button>
      </Link>
    </div>
  );
}

