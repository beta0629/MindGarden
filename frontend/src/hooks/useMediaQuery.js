/**
 * useMediaQuery — CSS media query 매칭 여부를 React state 로 노출하는 훅.
 *
 * - SSR 대응: window 부재 시 fallback(default false) 반환
 * - 디자인 토큰 (`--mg-breakpoint-lg` = 1024px) 같이 px 기반 미디어 쿼리에 사용
 *
 * @example
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 *
 * @author MindGarden
 * @since 2026-05-23
 */
import { useEffect, useState } from 'react';

const getInitialMatch = (query) => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia(query).matches;
};

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => getInitialMatch(query));

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }
    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event) => {
      setMatches(event.matches);
    };
    setMatches(mediaQueryList.matches);
    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleChange);
      return () => mediaQueryList.removeEventListener('change', handleChange);
    }
    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, [query]);

  return matches;
};

export default useMediaQuery;
