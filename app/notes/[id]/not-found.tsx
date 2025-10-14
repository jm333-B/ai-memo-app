// app/notes/[id]/not-found.tsx
// 노트를 찾을 수 없을 때 표시되는 404 페이지
// 존재하지 않는 노트 ID 또는 권한 없는 노트 접근 시 표시
// 관련 파일: app/notes/[id]/page.tsx

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NoteNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-700">
            노트를 찾을 수 없습니다
          </h2>
          <p className="mt-2 text-gray-600">
            요청하신 노트가 존재하지 않거나 접근 권한이 없습니다.
          </p>
        </div>
        <Link href="/notes">
          <Button>노트 목록으로 돌아가기</Button>
        </Link>
      </div>
    </div>
  );
}

