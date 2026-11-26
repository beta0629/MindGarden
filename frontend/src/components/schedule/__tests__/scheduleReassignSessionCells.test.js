/**
 * 배정 변경 회기 칸 레이아웃 — N=total, 창 규칙은 표시용.
 *
 * @author MindGarden
 * @since 2026-11-26
 */

import {
  buildSessionCellLayout,
  summarizeSessionCellCounts
} from '../utils/scheduleReassignSessionCells';
import { SESSION_CELL_STATE } from '../../../constants/scheduleReassignMapping';

describe('buildSessionCellLayout', () => {
  test.each([
    [1, 'row', 1],
    [10, 'row', 10],
    [20, 'grid', 20],
    [30, 'window', 10]
  ])('total=%i → layout=%s, rendered=%i, logicalTotal=total', (total, layout, rendered) => {
    const result = buildSessionCellLayout(total, {
      usedCount: 2,
      highlightIndex: layout === 'window' ? 15 : null
    });
    expect(result.layout).toBe(layout);
    expect(result.total).toBe(total);
    const counts = summarizeSessionCellCounts(result);
    expect(counts.logicalTotal).toBe(total);
    expect(counts.renderedCount).toBe(rendered);
    if (layout === 'window') {
      expect(result.prefixCount + result.cells.length + result.suffixCount).toBe(total);
      expect(result.prefixCount).toBeGreaterThan(0);
      expect(result.suffixCount).toBeGreaterThan(0);
    }
  });

  test('highlightIndex 에 planned 상태 적용', () => {
    const result = buildSessionCellLayout(10, {
      usedCount: 3,
      highlightIndex: 4,
      highlightState: SESSION_CELL_STATE.PLANNED
    });
    expect(result.cells.find((c) => c.index === 4)?.state).toBe(SESSION_CELL_STATE.PLANNED);
    expect(result.cells.find((c) => c.index === 3)?.state).toBe(SESSION_CELL_STATE.USED);
    expect(result.cells.find((c) => c.index === 5)?.state).toBe(SESSION_CELL_STATE.REMAINING);
  });

  test('total 무효 시 empty', () => {
    expect(buildSessionCellLayout(0).layout).toBe('empty');
    expect(buildSessionCellLayout(null).layout).toBe('empty');
  });
});
