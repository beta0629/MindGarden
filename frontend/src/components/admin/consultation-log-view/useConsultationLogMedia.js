/**
 * 상담일지 조회 중단점. CSS 와 같이 768px · 1280px 만 쓴다.
 *
 * @author CoreSolution
 * @since 2026-10-10
 */

import { useEffect, useState } from 'react';

export const CONSULTATION_LOG_MEDIA_TABLET_UP = '(min-width: 768px)';
export const CONSULTATION_LOG_MEDIA_DESKTOP_UP = '(min-width: 1280px)';

/**
 * @param {string} query
 * @returns {boolean}
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => (
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false
  ));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};
