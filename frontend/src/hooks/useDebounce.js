/**
 * Debounce Hook
 * 
 * 입력값의 변경을 지연시켜 불필요한 API 호출을 방지
 * 
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-12-09
 */

import { useState, useEffect } from 'react';

/**
 * Debounce Hook
 * 
 * @param {any} value - 디바운스할 값
 * @param {number} delay - 지연 시간 (ms)
 * @returns {any} 디바운스된 값
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;

