// components/notes/empty-state.tsx
// 노트가 없을 때 표시되는 빈 상태 UI 컴포넌트
// 안내 메시지와 새 노트 작성 버튼 제공
// 관련 파일: app/notes/page.tsx, components/ui/empty-state.tsx

import { FileText } from 'lucide-react';
import { EmptyState as BaseEmptyState } from '@/components/ui/empty-state';

export function EmptyState() {
  return (
    <BaseEmptyState
      icon={<FileText className="h-6 w-6 text-gray-600" />}
      title="아직 노트가 없습니다"
      description="첫 번째 노트를 작성하여 아이디어를 기록해보세요"
      action={{
        label: "새 노트 작성",
        href: "/notes/new",
      }}
    />
  );
}

