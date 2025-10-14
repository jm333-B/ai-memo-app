// lib/utils/date.ts
// 날짜를 사용자 친화적인 형식으로 포맷팅하는 유틸리티 함수
// "방금 전", "3분 전", "어제", "2024.10.14" 등의 형식으로 변환
// 관련 파일: app/notes/page.tsx, components/notes/note-card.tsx

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  // 방금 전 (1분 미만)
  if (diffInSeconds < 60) {
    return '방금 전';
  }

  // n분 전 (1시간 미만)
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  // n시간 전 (24시간 미만)
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  // 어제
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    targetDate.getDate() === yesterday.getDate() &&
    targetDate.getMonth() === yesterday.getMonth() &&
    targetDate.getFullYear() === yesterday.getFullYear()
  ) {
    return '어제';
  }

  // 일주일 이내
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }

  // 그 외 - YYYY.MM.DD 형식
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

