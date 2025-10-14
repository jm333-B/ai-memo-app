// hooks/use-debounce.ts
// 디바운스 훅 - 입력 값의 변경을 일정 시간 지연시켜 처리
// 자동 저장 등 빈번한 업데이트를 제한하는 데 사용
// 관련 파일: hooks/use-auto-save.ts

import { useEffect, useState } from 'react';

/**
 * 값의 변경을 지연시키는 디바운스 훅
 * @param value - 디바운스할 값
 * @param delay - 지연 시간 (밀리초)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

