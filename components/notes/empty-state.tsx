// components/notes/empty-state.tsx
// 노트가 없을 때 표시되는 빈 상태 UI 컴포넌트
// 안내 메시지와 새 노트 작성 버튼 제공
// 관련 파일: app/notes/page.tsx

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function EmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="h-6 w-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        아직 노트가 없습니다
      </h3>
      <p className="mt-2 text-sm text-gray-600">
        첫 번째 노트를 작성하여 아이디어를 기록해보세요
      </p>
      <Link href="/notes/new" className="mt-6">
        <Button>새 노트 작성</Button>
      </Link>
    </div>
  );
}

