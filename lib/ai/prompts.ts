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
  return `다음 노트 내용에 가장 관련성 높은 태그를 최대 5개까지 생성해주세요.

요구사항:
- 태그는 쉼표로 구분해주세요
- 한글로 작성해주세요
- 태그만 반환하고 다른 설명은 하지 마세요
- 각 태그는 2-8자 사이여야 합니다

노트 내용:
${content}

태그:`;
}

