/**
 * weekOverlapFold — 이름 적합·접기 판정
 */

import {
  doAllNamesFitInHarnesses,
  shouldFoldOverlapGroup,
  extractOverlapRowFromHarness,
  WEEK_OVERLAP_MORE_MIN_HEIGHT_PX
} from '../weekOverlapFold';

describe('weekOverlapFold', () => {
  test('WEEK_OVERLAP_MORE_MIN_HEIGHT_PX is 44', () => {
    expect(WEEK_OVERLAP_MORE_MIN_HEIGHT_PX).toBe(44);
  });

  test('shouldFoldOverlapGroup false for <2 harnesses', () => {
    expect(shouldFoldOverlapGroup([])).toBe(false);
    expect(shouldFoldOverlapGroup([document.createElement('div')])).toBe(false);
  });

  test('extractOverlapRowFromHarness reads chip fields', () => {
    const harness = document.createElement('div');
    harness.innerHTML = `
      <div class="mg-v2-ad-calendar-event" aria-label="14:00 · 박서연 · 김상담 · 확정">
        <span class="mg-v2-ad-calendar-event__time-measured">14:00</span>
        <span class="client-name">박서연</span>
        <span class="counselor-name">김상담</span>
        <div class="mg-v2-ad-calendar-event__status">확정</div>
      </div>
    `;
    expect(extractOverlapRowFromHarness(harness)).toEqual({
      time: '14:00',
      name: '박서연',
      counselor: '김상담',
      status: '확정'
    });
  });

  test('doAllNamesFitInHarnesses true when no client-name nodes', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    expect(doAllNamesFitInHarnesses([a, b])).toBe(true);
  });
});
