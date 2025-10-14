// lib/utils/draft-storage.ts
// 노트 임시 저장을 위한 localStorage 유틸리티 함수
// 작성 중인 노트를 브라우저에 저장하고 불러오는 기능 제공
// 관련 파일: hooks/use-auto-save.ts, app/notes/new/page.tsx

export interface DraftData {
  title: string;
  content: string;
  savedAt: number; // timestamp
}

const DRAFT_PREFIX = 'draft-note';

/**
 * 임시 저장 키 생성
 * @param identifier - 'new' 또는 노트 ID
 */
export function getDraftKey(identifier: string = 'new'): string {
  return `${DRAFT_PREFIX}-${identifier}`;
}

/**
 * 임시 저장 데이터를 localStorage에 저장
 * @param key - 저장 키
 * @param data - 저장할 데이터 (제목, 본문)
 */
export function saveDraft(key: string, data: Omit<DraftData, 'savedAt'>): boolean {
  try {
    const draftData: DraftData = {
      ...data,
      savedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(draftData));
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage 용량 초과');
    } else {
      console.error('임시 저장 실패:', error);
    }
    return false;
  }
}

/**
 * localStorage에서 임시 저장 데이터 불러오기
 * @param key - 불러올 키
 */
export function loadDraft(key: string): DraftData | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return null;
    }
    const data = JSON.parse(stored) as DraftData;
    // 데이터 유효성 검증
    if (!data.title && !data.content) {
      return null;
    }
    return data;
  } catch (error) {
    console.error('임시 저장 불러오기 실패:', error);
    return null;
  }
}

/**
 * localStorage에서 임시 저장 데이터 삭제
 * @param key - 삭제할 키
 */
export function deleteDraft(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('임시 저장 삭제 실패:', error);
    return false;
  }
}

/**
 * 모든 임시 저장 데이터 목록 가져오기 (선택적)
 */
export function getAllDrafts(): { key: string; data: DraftData }[] {
  try {
    const drafts: { key: string; data: DraftData }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_PREFIX)) {
        const data = loadDraft(key);
        if (data) {
          drafts.push({ key, data });
        }
      }
    }
    return drafts;
  } catch (error) {
    console.error('임시 저장 목록 조회 실패:', error);
    return [];
  }
}

/**
 * localStorage 사용 가능 여부 확인
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

