/**
 * SCT 공개 응답 — visualViewport → CSS 변수 + 키보드 클래스
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { useEffect } from 'react';
import { SCT_DEFAULTS } from '../constants/sctOnline';

/**
 * @param {React.RefObject<HTMLElement|null>} rootRef
 */
export default function useSctVisualViewport(rootRef) {
  useEffect(() => {
    const root = rootRef?.current;
    if (!root || typeof window === 'undefined') {
      return undefined;
    }

    const apply = () => {
      const vv = window.visualViewport;
      const height = vv?.height ?? window.innerHeight;
      const offsetTop = vv?.offsetTop ?? 0;
      root.style.setProperty('--mg-v2-sct-vvh', `${height}px`);
      root.style.setProperty('--mg-v2-sct-vvt', `${offsetTop}px`);
      const delta = window.innerHeight - height;
      if (delta > SCT_DEFAULTS.KEYBOARD_DELTA_PX) {
        root.classList.add('mg-v2-sct-app--kb');
        document.body.classList.add('mg-v2-sct-kb');
      } else {
        root.classList.remove('mg-v2-sct-app--kb');
        document.body.classList.remove('mg-v2-sct-kb');
      }
    };

    apply();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', apply);
    vv?.addEventListener('scroll', apply);
    window.addEventListener('resize', apply);

    return () => {
      vv?.removeEventListener('resize', apply);
      vv?.removeEventListener('scroll', apply);
      window.removeEventListener('resize', apply);
      document.body.classList.remove('mg-v2-sct-kb');
    };
  }, [rootRef]);
}
