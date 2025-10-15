// lib/ai/prompts.ts
// AI 프롬프트 생성 함수들
// 요약, 태그 생성 등 다양한 AI 작업을 위한 프롬프트 템플릿 제공
// 관련 파일: lib/ai/gemini-api.ts, app/actions/ai.ts

/**
 * 노트 내용을 요약하기 위한 프롬프트를 생성합니다.
 * 
 * @param content - 요약할 노트 내용
 * @returns Gemini API에 전달할 프롬프트 문자열
 */
export function generateSummaryPrompt(content: string): string {
  return `다음 노트 내용을 3-6개의 불릿 포인트로 요약해주세요.

요구사항:
- 각 불릿 포인트는 핵심 내용을 담아야 합니다
- 간결하고 명확하게 작성해주세요
- 반드시 한글로 작성해주세요
- 불릿 포인트는 "-" 기호로 시작해주세요
- 다른 설명 없이 요약 내용만 반환해주세요

노트 내용:
${content}

요약:`;
}

/**
 * 노트 내용에서 태그를 추출하기 위한 프롬프트를 생성합니다.
 * 
 * @param content - 태그를 추출할 노트 내용
 * @returns Gemini API에 전달할 프롬프트 문자열
 */
export function generateTagsPrompt(content: string): string {
  return `다음 노트 내용에 가장 관련성 높은 태그를 최대 6개까지 생성해주세요.

요구사항:
- 각 태그는 한 단어 또는 짧은 구문이어야 합니다
- 태그는 쉼표로 구분해주세요
- 반드시 한글로 작성해주세요
- 핵심 주제나 키워드를 중심으로 생성해주세요
- 너무 일반적인 태그는 피해주세요

노트 내용:
${content}

태그 (쉼표로 구분):`;
}

/**
 * 태그를 정규화합니다.
 * 
 * @param tag - 정규화할 태그
 * @returns 정규화된 태그
 */
export function normalizeTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/[^\w가-힣-]/g, ''); // 특수문자 제거
}

/**
 * 태그 문자열을 파싱하여 배열로 변환합니다.
 * 
 * @param tagsString - 쉼표로 구분된 태그 문자열
 * @returns 정규화된 태그 배열 (최대 6개)
 */
export function parseTags(tagsString: string): string[] {
  return tagsString
    .split(',')
    .map(tag => normalizeTag(tag))
    .filter(tag => tag.length > 0 && tag.length <= 20)
    .slice(0, 6); // 최대 6개
}

