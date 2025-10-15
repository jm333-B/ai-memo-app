// app/notes/page.tsx
// 노트 목록 조회 페이지 - 사용자의 모든 노트를 페이지네이션, 정렬과 함께 표시
// 통합 검색 기능과 빈 상태 UI, 검색 쿼리 파라미터 기반 페이지네이션 및 정렬 포함
// 관련 파일: app/actions/notes.ts, components/notes/empty-state.tsx, components/notes/sort-dropdown.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getNotes, searchNotes } from '@/app/actions/notes';
import { EmptyState } from '@/components/notes/empty-state';
import { EmptySearchResults } from '@/components/notes/empty-search-results';
import { Pagination } from '@/components/notes/pagination';
import { LogoutButton } from '@/components/logout-button';
import { SortDropdown, type SortOption } from '@/components/notes/sort-dropdown';
import { NotesList } from '@/components/notes/notes-list';
import { IntegratedSearch } from '@/components/notes/integrated-search';
import { SearchSkeleton, SearchError } from '@/components/ui/search-loading';
import { Note } from '@/drizzle/schema';

interface NotesPageState {
  notes: Note[];
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error?: string;
  isSearchMode: boolean;
}

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [state, setState] = useState<NotesPageState>({
    notes: [],
    totalPages: 0,
    currentPage: 1,
    isLoading: true,
    isSearchMode: false,
  });

  // URL 파라미터에서 값 추출
  const page = Number(searchParams.get('page')) || 1;
  const sortBy = (searchParams.get('sort') as SortOption) || 'latest';
  const searchQuery = searchParams.get('search') || '';

  // 노트 목록 로드 함수
  const loadNotes = async (pageNum: number, sort: SortOption) => {
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      const result = await getNotes(pageNum, sort);
      
      if (result.error) {
        setState(prev => ({ ...prev, error: result.error, isLoading: false }));
      } else {
        setState(prev => ({
          ...prev,
          notes: result.notes,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          isLoading: false,
          isSearchMode: false,
        }));
      }
    } catch (error) {
      console.error('노트 목록 로드 실패:', error);
      setState(prev => ({
        ...prev,
        error: '노트 목록을 불러올 수 없습니다',
        isLoading: false,
      }));
    }
  };

  // 검색 실행 함수
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      // 검색어가 없으면 일반 목록으로 복원
      setState(prev => ({ ...prev, isSearchMode: false }));
      loadNotes(page, sortBy);
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: undefined, isSearchMode: true }));
    
    try {
      const result = await searchNotes(query.trim());
      
      if (result.error) {
        setState(prev => ({ ...prev, error: result.error, isLoading: false }));
      } else {
        setState(prev => ({
          ...prev,
          notes: result.notes,
          totalPages: 1, // 검색 결과는 페이지네이션 없음
          currentPage: 1,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('검색 실패:', error);
      setState(prev => ({
        ...prev,
        error: '검색 중 오류가 발생했습니다',
        isLoading: false,
      }));
    }
  };

  // 초기 로드 및 URL 파라미터 변경 감지
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      loadNotes(page, sortBy);
    }
  }, [page, sortBy, searchQuery]);

  // 정렬 변경 핸들러
  const handleSortChange = (newSort: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    params.delete('page'); // 정렬 변경 시 첫 페이지로
    router.push(`?${params.toString()}`);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  if (state.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-600">{state.error}</p>
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
              {state.isSearchMode 
                ? `검색 결과 ${state.notes.length}개`
                : state.notes.length > 0 
                  ? `총 ${state.notes.length}개의 노트` 
                  : '노트가 없습니다'
              }
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

        {/* 통합 검색 컴포넌트 */}
        <IntegratedSearch 
          onSearchQueryChange={handleSearch}
          onClearFilters={() => {
            setState(prev => ({ ...prev, isSearchMode: false }));
            loadNotes(page, sortBy);
          }}
        />

        {state.isLoading ? (
          <div className="space-y-4">
            {state.isSearchMode ? (
              <SearchSkeleton type="list" count={5} />
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">노트를 불러오는 중...</p>
              </div>
            )}
          </div>
        ) : state.notes.length === 0 ? (
          <div className="space-y-4">
            {state.isSearchMode ? (
              <EmptySearchResults
                searchQuery={searchQuery}
                onSearchQueryChange={handleSearch}
                onClearFilters={() => {
                  setState(prev => ({ ...prev, isSearchMode: false }));
                  loadNotes(page, sortBy);
                }}
              />
            ) : (
              <>
                <SortDropdown disabled={true} />
                <EmptyState />
              </>
            )}
          </div>
        ) : (
          <>
            {!state.isSearchMode && <SortDropdown onSortChange={handleSortChange} />}
            
            <NotesList 
              notes={state.notes} 
              highlightQuery={state.isSearchMode ? searchQuery : undefined}
            />

            {!state.isSearchMode && state.totalPages > 1 && (
              <Pagination 
                currentPage={state.currentPage} 
                totalPages={state.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}