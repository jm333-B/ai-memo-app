// lib/utils/markdown.ts
// 마크다운 문법을 감지하고 처리하는 유틸리티 함수들
// 마크다운 문법이 포함된 텍스트인지 확인하고 적절한 렌더링 방식 결정
// 관련 파일: components/ui/markdown-renderer.tsx, app/notes/[id]/page.tsx

/**
 * 텍스트에 마크다운 문법이 포함되어 있는지 확인
 * @param text 확인할 텍스트
 * @returns 마크다운 문법이 포함되어 있으면 true
 */
export function hasMarkdownSyntax(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // 마크다운 문법 패턴들
  const markdownPatterns = [
    // 헤딩 (# ## ###)
    /^#{1,6}\s+/m,
    // 볼드 (**text** 또는 __text__)
    /\*\*.*?\*\*|__.*?__/,
    // 이탤릭 (*text* 또는 _text_)
    /\*[^*]+\*|_[^_]+_/,
    // 코드 블록 (```code```)
    /```[\s\S]*?```/,
    // 인라인 코드 (`code`)
    /`[^`]+`/,
    // 링크 ([text](url))
    /\[.*?\]\(.*?\)/,
    // 이미지 (![alt](url))
    /!\[.*?\]\(.*?\)/,
    // 리스트 (- item 또는 * item 또는 1. item)
    /^[\s]*[-*+]\s+|^[\s]*\d+\.\s+/m,
    // 인용문 (> text)
    /^>\s+/m,
    // 구분선 (--- 또는 ***)
    /^[\s]*[-*_]{3,}[\s]*$/m,
    // 테이블 (| col1 | col2 |)
    /^\|.*\|.*$/m,
    // 취소선 (~~text~~)
    /~~.*?~~/,
    // 체크박스 (- [ ] 또는 - [x])
    /^[\s]*[-*+]\s+\[[\sx]\]/m,
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
}

/**
 * 마크다운 텍스트에서 HTML 태그를 제거하고 순수 텍스트만 추출
 * @param text 마크다운 텍스트
 * @returns HTML 태그가 제거된 순수 텍스트
 */
export function stripMarkdown(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // 코드 블록 제거
    .replace(/```[\s\S]*?```/g, '')
    // 인라인 코드 제거
    .replace(/`[^`]+`/g, '')
    // 링크 텍스트만 추출 ([text](url) -> text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 이미지 제거
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // 볼드/이탤릭 제거
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // 취소선 제거
    .replace(/~~([^~]+)~~/g, '$1')
    // 헤딩 제거
    .replace(/^#{1,6}\s+/gm, '')
    // 리스트 마커 제거
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // 인용문 마커 제거
    .replace(/^>\s+/gm, '')
    // 구분선 제거
    .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '')
    // 체크박스 제거
    .replace(/^[\s]*[-*+]\s+\[[\sx]\]\s*/gm, '')
    // 테이블 구분선 제거
    .replace(/^\|[\s\-\|]*\|$/gm, '')
    // 테이블 셀 구분자 제거
    .replace(/\|/g, ' ')
    // 연속된 공백 정리
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 텍스트를 미리보기용으로 자르기 (마크다운 문법 고려)
 * @param text 원본 텍스트
 * @param maxLength 최대 길이
 * @returns 잘린 텍스트
 */
export function truncateMarkdown(text: string, maxLength: number = 150): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // 마크다운 문법이 있으면 순수 텍스트로 변환 후 자르기
  if (hasMarkdownSyntax(text)) {
    const plainText = stripMarkdown(text);
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  }

  // 일반 텍스트는 그대로 자르기
  return text.length > maxLength 
    ? text.substring(0, maxLength) + '...'
    : text;
}
