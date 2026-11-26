/**
 * 배정 변경 회기 칸 레이아웃 헬퍼.
 *
 * 규칙: ≤10 한줄, 11–20 10칸 격자, >20 10칸 창+앞뒤 요약.
 * N(total) 상한은 하드코딩하지 않는다 — 데이터 total 을 그대로 사용.
 *
 * @author MindGarden
 * @since 2026-11-26
 */

import {
  SESSION_CELL_GRID_COLUMNS,
  SESSION_CELL_STATE,
  SESSION_CELL_WINDOW_SIZE
} from '../../../constants/scheduleReassignMapping';

/**
 * @param {unknown} value
 * @returns {number|null}
 */
export function toPositiveSessionTotal(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) {
    return null;
  }
  return Math.floor(n);
}

/**
 * 회기 칸 레이아웃 산출.
 *
 * @param {number|null|undefined} total 데이터 totalSessions
 * @param {object} [options]
 * @param {number} [options.usedCount] 사용(점유) 칸 수 — 1..used 는 used
 * @param {number|null} [options.highlightIndex] 1-based 강조 회차
 * @param {string} [options.highlightState] SESSION_CELL_STATE.*
 * @returns {{
 *   layout: 'empty'|'row'|'grid'|'window',
 *   cells: Array<{ index: number, state: string }>,
 *   prefixCount: number,
 *   suffixCount: number,
 *   windowStart: number,
 *   windowEnd: number,
 *   total: number
 * }}
 */
export function buildSessionCellLayout(total, options = {}) {
  const n = toPositiveSessionTotal(total);
  if (n == null) {
    return {
      layout: 'empty',
      cells: [],
      prefixCount: 0,
      suffixCount: 0,
      windowStart: 0,
      windowEnd: 0,
      total: 0
    };
  }

  const usedRaw = Number(options.usedCount);
  const usedCount = Number.isFinite(usedRaw) && usedRaw > 0 ? Math.floor(usedRaw) : 0;
  const highlightRaw = options.highlightIndex != null ? Number(options.highlightIndex) : null;
  const highlightIndex =
    highlightRaw != null && Number.isFinite(highlightRaw) && highlightRaw >= 1
      ? Math.floor(highlightRaw)
      : null;
  const highlightState = options.highlightState || SESSION_CELL_STATE.PLANNED;

  let layout = 'row';
  if (n > SESSION_CELL_WINDOW_SIZE * 2) {
    layout = 'window';
  } else if (n > SESSION_CELL_GRID_COLUMNS) {
    layout = 'grid';
  }

  let windowStart = 1;
  let windowEnd = n;
  if (layout === 'window') {
    const focus =
      highlightIndex != null
        ? highlightIndex
        : Math.min(Math.max(usedCount + 1, 1), n);
    windowStart = Math.max(1, Math.min(focus - 4, n - SESSION_CELL_WINDOW_SIZE + 1));
    windowEnd = Math.min(n, windowStart + SESSION_CELL_WINDOW_SIZE - 1);
    windowStart = Math.max(1, windowEnd - SESSION_CELL_WINDOW_SIZE + 1);
  }

  const cells = [];
  for (let index = windowStart; index <= windowEnd; index += 1) {
    let state = index <= usedCount ? SESSION_CELL_STATE.USED : SESSION_CELL_STATE.REMAINING;
    if (highlightIndex === index) {
      state = highlightState;
    }
    cells.push({ index, state });
  }

  return {
    layout,
    cells,
    prefixCount: Math.max(0, windowStart - 1),
    suffixCount: Math.max(0, n - windowEnd),
    windowStart,
    windowEnd,
    total: n
  };
}

/**
 * 테스트·검증용: 레이아웃이 표현하는 논리 칸 수(= total).
 * window 모드에서도 total 은 데이터 N 과 같고, 렌더 칸 수만 창 크기.
 *
 * @param {{ total: number, cells: Array<unknown> }} layout
 * @returns {{ logicalTotal: number, renderedCount: number }}
 */
export function summarizeSessionCellCounts(layout) {
  return {
    logicalTotal: layout?.total ?? 0,
    renderedCount: Array.isArray(layout?.cells) ? layout.cells.length : 0
  };
}
