// lib/utils/highlight.ts
// 텍스트 하이라이팅 유틸리티 함수
// 검색어와 일치하는 텍스트를 하이라이트 처리
// 관련 파일: components/notes/note-card.tsx, components/notes/search-results.tsx

/**
 * 텍스트에서 검색어를 하이라이트 처리하는 함수
 * @param text - 하이라이트할 텍스트
 * @param query - 검색어
 * @returns 하이라이트된 HTML 문자열
 */
export function highlightText(text: string, query: string): string {
  if (!query || !text) {
    return escapeHtml(text);
  }

  // HTML 이스케이핑으로 XSS 방지
  const escapedText = escapeHtml(text);
  const escapedQuery = escapeHtml(query);

  // 대소문자 구분 없는 정규식 생성
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  // 검색어를 하이라이트 태그로 감싸기
  return escapedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
}

/**
 * HTML 특수문자를 이스케이핑하는 함수
 * @param text - 이스케이핑할 텍스트
 * @returns 이스케이핑된 텍스트
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 텍스트를 안전하게 HTML로 렌더링하는 함수
 * @param htmlString - HTML 문자열
 * @returns 안전한 HTML 요소
 */
export function createHighlightedHTML(htmlString: string) {
  return { __html: htmlString };
}
