// components/notes/tag-filter.tsx
// 태그 필터링 컴포넌트
// 태그 선택, 선택된 태그 표시, 필터 초기화 기능 제공
// 관련 파일: hooks/use-tag-filter.ts, app/actions/notes.ts

'use client';

import { useState, useEffect } from 'react';
import { X, Tag, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useTagFilter } from '@/hooks/use-tag-filter';

interface TagFilterProps {
  onFilterChange?: (selectedTags: string[]) => void;
  className?: string;
}

export function TagFilter({ onFilterChange, className = "" }: TagFilterProps) {
  const { tagFilterState, toggleTag, clearAllTags, loadTags } = useTagFilter();
  const [isExpanded, setIsExpanded] = useState(false);

  // 태그 선택 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(tagFilterState.selectedTags);
    }
  }, [tagFilterState.selectedTags, onFilterChange]);

  // 태그 통계를 태그명으로 매핑
  const getTagCount = (tag: string) => {
    const stat = tagFilterState.tagStats.find(s => s.tag === tag);
    return stat ? stat.count : 0;
  };

  // 선택된 태그가 있는지 확인
  const hasSelectedTags = tagFilterState.selectedTags.length > 0;

  if (tagFilterState.isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">태그 필터</span>
        </div>
        <div className="text-sm text-muted-foreground">태그를 불러오는 중...</div>
      </div>
    );
  }

  if (tagFilterState.error) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">태그 필터</span>
        </div>
        <div className="text-sm text-destructive">{tagFilterState.error}</div>
        <Button variant="outline" size="sm" onClick={loadTags}>
          다시 시도
        </Button>
      </div>
    );
  }

  if (tagFilterState.availableTags.length === 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">태그 필터</span>
        </div>
        <div className="text-sm text-muted-foreground">사용 가능한 태그가 없습니다</div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">태그 필터</span>
          {hasSelectedTags && (
            <Badge variant="secondary" className="text-xs">
              {tagFilterState.selectedTags.length}개 선택
            </Badge>
          )}
        </div>
        
        {hasSelectedTags && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllTags}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            초기화
          </Button>
        )}
      </div>

      {/* 선택된 태그 표시 */}
      {hasSelectedTags && (
        <div className="flex flex-wrap gap-2">
          {tagFilterState.selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="default"
              className="flex items-center gap-1 pr-1"
            >
              {tag}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleTag(tag)}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* 태그 목록 */}
      <div className="space-y-2">
        {!isExpanded && tagFilterState.availableTags.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="w-full text-xs"
          >
            모든 태그 보기 ({tagFilterState.availableTags.length}개)
          </Button>
        )}

        <div className={`space-y-2 ${!isExpanded ? 'max-h-32 overflow-hidden' : ''}`}>
          {(isExpanded ? tagFilterState.availableTags : tagFilterState.availableTags.slice(0, 5)).map((tag) => {
            const isSelected = tagFilterState.selectedTags.includes(tag);
            const count = getTagCount(tag);

            return (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag}`}
                  checked={isSelected}
                  onCheckedChange={() => toggleTag(tag)}
                />
                <label
                  htmlFor={`tag-${tag}`}
                  className="flex-1 text-sm cursor-pointer flex items-center justify-between"
                >
                  <span className={isSelected ? 'font-medium' : ''}>{tag}</span>
                  <span className="text-xs text-muted-foreground">({count})</span>
                </label>
              </div>
            );
          })}
        </div>

        {isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="w-full text-xs"
          >
            접기
          </Button>
        )}
      </div>
    </div>
  );
}
