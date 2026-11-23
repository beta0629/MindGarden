/**
 * timeGrid 겹침 칩 DOM 후처리 — 이름 적합 시 분할 유지, 아니면 「외 n」+시트.
 *
 * @author CoreSolution
 * @since 2026-11-23
 */

import { useCallback, useEffect, useState } from 'react';
import {
  WEEK_OVERLAP_MORE_MIN_HEIGHT_PX,
  extractOverlapRowFromHarness,
  groupOverlappingHarnesses,
  shouldFoldOverlapGroup
} from '../utils/weekOverlapFold';

const MORE_BTN_CLASS = 'mg-v2-week-overlap-more';
const FOLDED_CLASS = 'mg-v2-week-overlap-harness--folded';
const REST_CLASS = 'mg-v2-week-overlap-harness--rest';

/**
 * @param {{
 *   containerRef: { current: Element|null },
 *   enabled?: boolean,
 *   deps?: unknown[]
 * }} options
 * @returns {{
 *   sheetOpen: boolean,
 *   sheetTitle: string,
 *   sheetRows: Array<{ time: string, name: string, counselor: string, status: string }>,
 *   closeSheet: () => void
 * }}
 */
export default function useWeekOverlapFold(options = {}) {
  const { containerRef, enabled = true, deps = [] } = options;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTitle, setSheetTitle] = useState('겹치는 일정');
  const [sheetRows, setSheetRows] = useState([]);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setSheetRows([]);
  }, []);

  const openSheet = useCallback((harnesses, title) => {
    setSheetTitle(title || '겹치는 일정');
    setSheetRows(harnesses.map(extractOverlapRowFromHarness));
    setSheetOpen(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const root = containerRef?.current;
    if (!root) {
      return undefined;
    }

    const clearFolds = () => {
      root.querySelectorAll(`.${MORE_BTN_CLASS}`).forEach((btn) => btn.remove());
      root.querySelectorAll(`.${FOLDED_CLASS}, .${REST_CLASS}`).forEach((el) => {
        el.classList.remove(FOLDED_CLASS, REST_CLASS);
        el.style.removeProperty('display');
        el.style.removeProperty('width');
        el.style.removeProperty('left');
        el.style.removeProperty('right');
      });
    };

    const layout = () => {
      clearFolds();
      const harnesses = Array.from(root.querySelectorAll('.fc-timegrid-event-harness'));
      const groups = groupOverlappingHarnesses(harnesses);
      groups.forEach((group) => {
        if (!shouldFoldOverlapGroup(group)) {
          return;
        }
        const first = group[0];
        const rest = group.slice(1);
        first.classList.add(FOLDED_CLASS);
        first.style.width = '100%';
        first.style.left = '0';
        first.style.right = '0';
        rest.forEach((h) => {
          h.classList.add(REST_CLASS);
          h.style.display = 'none';
        });
        const n = rest.length;
        if (n <= 0) {
          return;
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = MORE_BTN_CLASS;
        btn.textContent = `외 ${n}`;
        btn.style.minHeight = `${WEEK_OVERLAP_MORE_MIN_HEIGHT_PX}px`;
        const slotLabel = first.querySelector('.mg-v2-ad-calendar-event')?.getAttribute('aria-label')
          || '겹치는 일정';
        btn.setAttribute('aria-label', `${slotLabel} 외 ${n}건 보기`);
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openSheet(group, '겹치는 일정');
        });
        const host = first.parentElement || first;
        host.appendChild(btn);
      });
    };

    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(layout);
    });

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        layout();
      });
      ro.observe(root);
    }

    const onWindowResize = () => layout();
    window.addEventListener('resize', onWindowResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onWindowResize);
      if (ro) ro.disconnect();
      clearFolds();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps 는 호출측 캘린더 갱신 키
  }, [containerRef, enabled, openSheet, ...deps]);

  return {
    sheetOpen,
    sheetTitle,
    sheetRows,
    closeSheet
  };
}
