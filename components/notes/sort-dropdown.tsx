// components/notes/sort-dropdown.tsx
// 노트 목록 정렬 드롭다운 컴포넌트
// 최신순, 오래된순, 제목순, 제목 역순으로 정렬 가능
// 관련 파일: app/notes/page.tsx, app/actions/notes.ts

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export type SortOption = "latest" | "oldest" | "title-asc" | "title-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "title-asc", label: "제목순" },
  { value: "title-desc", label: "제목역순" },
];

interface SortDropdownProps {
  disabled?: boolean;
  onSortChange?: (sort: SortOption) => void;
}

export function SortDropdown({ disabled = false, onSortChange }: SortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = (searchParams.get("sort") as SortOption) || "latest";

  function handleSortChange(value: string) {
    const sortValue = value as SortOption;
    
    if (onSortChange) {
      onSortChange(sortValue);
    } else {
      // 기본 동작: URL 업데이트
      const params = new URLSearchParams(searchParams);
      params.set("sort", value);
      // 정렬 변경 시 페이지를 1로 리셋
      params.set("page", "1");
      router.push(`/notes?${params.toString()}`);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-gray-500" />
      <Select value={currentSort} onValueChange={handleSortChange} disabled={disabled}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="정렬 기준" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

