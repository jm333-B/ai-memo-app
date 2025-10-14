// app/notes/[id]/loading.tsx
// 노트 상세 페이지 로딩 중 표시되는 스켈레톤 UI
// Suspense를 통해 자동으로 표시됨
// 관련 파일: app/notes/[id]/page.tsx

export default function NoteDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* 헤더 스켈레톤 */}
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-3/4 rounded bg-gray-200"></div>
          <div className="flex gap-4">
            <div className="h-5 w-32 rounded bg-gray-200"></div>
            <div className="h-5 w-32 rounded bg-gray-200"></div>
          </div>
        </div>

        {/* 본문 스켈레톤 */}
        <div className="animate-pulse rounded-lg bg-white px-8 py-10 shadow-sm ring-1 ring-gray-900/5">
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-gray-200"></div>
            <div className="h-4 w-full rounded bg-gray-200"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-full rounded bg-gray-200"></div>
            <div className="h-4 w-5/6 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

