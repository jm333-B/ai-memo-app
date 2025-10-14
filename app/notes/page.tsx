// app/notes/page.tsx
// 노트 목록 조회 페이지 - 사용자의 모든 노트를 페이지네이션, 정렬과 함께 표시
// 빈 상태 UI, 검색 쿼리 파라미터 기반 페이지네이션 및 정렬 포함
// 관련 파일: app/actions/notes.ts, components/notes/empty-state.tsx, components/notes/sort-dropdown.tsx

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getNotes } from '@/app/actions/notes';
import { NoteCard } from '@/components/notes/note-card';
import { EmptyState } from '@/components/notes/empty-state';
import { Pagination } from '@/components/notes/pagination';
import { LogoutButton } from '@/components/logout-button';
import { SortDropdown, type SortOption } from '@/components/notes/sort-dropdown';

interface NotesPageProps {
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const sortBy = (params.sort as SortOption) || 'latest';

  if (page < 1) {
    redirect('/notes?page=1');
  }

  const { notes, totalPages, error } = await getNotes(page, sortBy);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link href="/">
            <Button variant="outline" className="mt-4">
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              내 노트
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {notes.length > 0 ? `총 ${notes.length}개의 노트` : '노트가 없습니다'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/notes/trash">
              <Button variant="outline">휴지통</Button>
            </Link>
            <Link href="/notes/new">
              <Button>새 노트 작성</Button>
            </Link>
            <LogoutButton />
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="space-y-4">
            <SortDropdown disabled={true} />
            <EmptyState />
          </div>
        ) : (
          <>
            <SortDropdown />
            
            <div className="grid gap-4">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

