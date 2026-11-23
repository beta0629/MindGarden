/**
 * 주/일 timeGrid 겹침 칩 — 이름 적합 측정 후 가로 분할 유지 또는 「외 n」 접기.
 * 폭 미디어쿼리 분기 금지. resourceTimeGrid 금지.
 *
 * @author CoreSolution
 * @since 2026-11-23
 */

/** 「외 n」 버튼 최소 터치 높이(px) — --mg-v2-touch-target-min(2.75rem≈44) */
export const WEEK_OVERLAP_MORE_MIN_HEIGHT_PX = 44;

/**
 * 텍스트가 박스 안에 전부 보이는지 (최대 maxLines 줄).
 *
 * @param {Element|null|undefined} el
 * @param {number} [maxLines=2]
 * @returns {boolean}
 */
export function isTextFullyVisible(el, maxLines = 2) {
  if (!el || !el.offsetParent) {
    return true;
  }
  if (typeof document === 'undefined' || typeof document.createRange !== 'function') {
    return true;
  }
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = range.getClientRects();
  if (!rects.length) {
    return true;
  }
  if (maxLines && rects.length > maxLines) {
    return false;
  }
  const box = el.getBoundingClientRect();
  for (let i = 0; i < rects.length; i += 1) {
    if (rects[i].right > box.right + 1.5 || rects[i].bottom > box.bottom + 1.5) {
      return false;
    }
    if (rects[i].left < box.left - 1.5) {
      return false;
    }
  }
  if (el.scrollWidth > el.clientWidth + 1) {
    return false;
  }
  if (el.scrollHeight > el.clientHeight + 1) {
    return false;
  }
  return true;
}

/**
 * 두 harness 가 같은 일 컬럼에서 세로로 겹치는지.
 *
 * @param {DOMRect} a
 * @param {DOMRect} b
 * @returns {boolean}
 */
export function doHarnessRectsOverlap(a, b) {
  if (!a || !b) {
    return false;
  }
  const horizontalNear = Math.abs(a.left - b.left) < Math.max(a.width, b.width) * 0.85
    || (a.left < b.right && b.left < a.right);
  const verticalOverlap = a.top < b.bottom - 1 && b.top < a.bottom - 1;
  return horizontalNear && verticalOverlap;
}

/**
 * timegrid harness 목록을 겹침 그룹으로 묶는다.
 *
 * @param {Element[]} harnesses
 * @returns {Element[][]}
 */
export function groupOverlappingHarnesses(harnesses) {
  const list = Array.isArray(harnesses) ? harnesses.filter(Boolean) : [];
  if (list.length === 0) {
    return [];
  }
  const rects = list.map((el) => el.getBoundingClientRect());
  const parentOf = list.map((el) => el.closest('.fc-timegrid-col-events') || el.parentElement);
  const assigned = new Array(list.length).fill(false);
  const groups = [];

  for (let i = 0; i < list.length; i += 1) {
    if (assigned[i]) continue;
    const groupIdx = [i];
    assigned[i] = true;
    for (let j = i + 1; j < list.length; j += 1) {
      if (assigned[j]) continue;
      if (parentOf[j] !== parentOf[i]) continue;
      if (doHarnessRectsOverlap(rects[i], rects[j])) {
        groupIdx.push(j);
        assigned[j] = true;
      }
    }
    if (groupIdx.length > 1) {
      groups.push(groupIdx.map((idx) => list[idx]));
    }
  }
  return groups;
}

/**
 * 그룹 내 모든 칩 이름이 2줄 안으로 전부 보이는가.
 *
 * @param {Element[]} harnesses
 * @returns {boolean}
 */
export function doAllNamesFitInHarnesses(harnesses) {
  return (harnesses || []).every((harness) => {
    const nameEl = harness.querySelector('.client-name');
    if (!nameEl) {
      return true;
    }
    return isTextFullyVisible(nameEl, 2);
  });
}

/**
 * 가로 분할 칩이 시간 칸(부모) 높이를 넘기는가.
 *
 * @param {Element[]} harnesses
 * @returns {boolean}
 */
export function doesSplitExceedSlotHeight(harnesses) {
  if (!harnesses || harnesses.length === 0) {
    return false;
  }
  const slot = harnesses[0].closest('.fc-timegrid-slot-lane')
    || harnesses[0].closest('.fc-timegrid-col')
    || harnesses[0].parentElement;
  if (!slot) {
    return false;
  }
  const slotBox = slot.getBoundingClientRect();
  return harnesses.some((h) => {
    const box = h.getBoundingClientRect();
    return box.bottom > slotBox.bottom + 1.5 || box.height > slotBox.height + 1.5;
  });
}

/**
 * 그룹을 접어야 하는가 — 이름 미적합 또는 높이 초과.
 *
 * @param {Element[]} harnesses
 * @returns {boolean}
 */
export function shouldFoldOverlapGroup(harnesses) {
  if (!harnesses || harnesses.length < 2) {
    return false;
  }
  if (!doAllNamesFitInHarnesses(harnesses)) {
    return true;
  }
  if (doesSplitExceedSlotHeight(harnesses)) {
    return true;
  }
  return false;
}

/**
 * harness 에서 시트 행 데이터 추출.
 *
 * @param {Element} harness
 * @returns {{ time: string, name: string, counselor: string, status: string }}
 */
export function extractOverlapRowFromHarness(harness) {
  const chip = harness?.querySelector('.mg-v2-ad-calendar-event');
  const aria = chip?.getAttribute('aria-label') || chip?.getAttribute('title') || '';
  const parts = aria.split('·').map((s) => s.trim()).filter(Boolean);
  const name = harness?.querySelector('.client-name')?.textContent?.trim()
    || parts[1]
    || '';
  const counselor = harness?.querySelector('.counselor-name')?.textContent?.trim()
    || parts[2]
    || '';
  const status = harness?.querySelector('.mg-v2-ad-calendar-event__status')?.textContent?.trim()
    || parts[3]
    || '';
  const time = harness?.querySelector('.mg-v2-ad-calendar-event__time-measured')?.textContent?.trim()
    || parts[0]
    || '';
  return { time, name, counselor, status };
}

export default {
  WEEK_OVERLAP_MORE_MIN_HEIGHT_PX,
  isTextFullyVisible,
  doHarnessRectsOverlap,
  groupOverlappingHarnesses,
  doAllNamesFitInHarnesses,
  doesSplitExceedSlotHeight,
  shouldFoldOverlapGroup,
  extractOverlapRowFromHarness
};
