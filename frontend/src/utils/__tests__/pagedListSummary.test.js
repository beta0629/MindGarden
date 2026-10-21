/**
 * 페이징 안내 문구
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

import { buildPagedListSummaryLabel, resolvePagedListRange } from '../pagedListSummary';

describe('resolvePagedListRange', () => {
  test('1페이지 6건 / 전체 34', () => {
    expect(resolvePagedListRange({ total: 34, page: 1, pageSize: 6 })).toEqual({
      total: 34,
      start: 1,
      end: 6,
      page: 1,
      totalPages: 6
    });
  });
});

describe('buildPagedListSummaryLabel', () => {
  test('i18n 키로 요약을 만든다', () => {
    const t = (key, vars) => (
      `${key}:${vars.total}/${vars.start}-${vars.end}/${vars.page}/${vars.totalPages}`
    );
    expect(buildPagedListSummaryLabel({
      t,
      total: 9,
      page: 2,
      pageSize: 6,
      totalPages: 2
    })).toBe('common:pagination.rangeSummary:9/7-9/2/2');
  });

  test('t 없이 건수·페이지 변수 구조 폴백을 쓴다', () => {
    expect(buildPagedListSummaryLabel({
      total: 34,
      page: 1,
      pageSize: 6
    })).toBe('전체 34건 중 1–6건 · 1페이지 / 총 6페이지');
  });
});
