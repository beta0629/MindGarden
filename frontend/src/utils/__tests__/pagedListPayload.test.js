/**
 * normalizePagedListPayload / hasMorePagedItems 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import { hasMorePagedItems, normalizePagedListPayload } from '../pagedListPayload';

describe('normalizePagedListPayload', () => {
  test('배열 응답 → 총계 없음', () => {
    expect(normalizePagedListPayload([1, 2])).toEqual({ items: [1, 2], totalElements: null, totalPages: null });
  });

  test('알림 응답 { notifications, totalElements, totalPages }', () => {
    const result = normalizePagedListPayload({
      notifications: [{ id: 1 }, { id: 2 }],
      totalElements: 6,
      totalPages: 2
    });
    expect(result.items).toHaveLength(2);
    expect(result.totalElements).toBe(6);
    expect(result.totalPages).toBe(2);
  });

  test('언랩 전 { success, data: { messages, totalElements } }', () => {
    const result = normalizePagedListPayload({
      success: true,
      data: { messages: [{ id: 'a' }, null], totalElements: '23' }
    });
    expect(result.items).toEqual([{ id: 'a' }]);
    expect(result.totalElements).toBe(23);
  });

  test('엔벨로프 { success, data:[...], totalElements } — 외곽 총계 보존', () => {
    const result = normalizePagedListPayload({
      success: true,
      data: [{ id: 1 }, { id: 2 }],
      totalElements: 25,
      totalPages: 2
    });
    expect(result.items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.totalElements).toBe(25);
    expect(result.totalPages).toBe(2);
  });

  test('배열만 오면 totalElements 는 null (언랩 후 경로)', () => {
    expect(normalizePagedListPayload([{ id: 1 }, { id: 2 }])).toEqual({
      items: [{ id: 1 }, { id: 2 }],
      totalElements: null,
      totalPages: null
    });
  });

  test('Spring Page content', () => {
    expect(normalizePagedListPayload({ content: [1], totalElements: 1, totalPages: 1 }).items).toEqual([1]);
  });

  test('null·문자열·음수 총계 → 빈 목록 / null 총계', () => {
    expect(normalizePagedListPayload(null)).toEqual({ items: [], totalElements: null, totalPages: null });
    expect(normalizePagedListPayload('x').items).toEqual([]);
    expect(normalizePagedListPayload({ items: [], totalElements: -1 }).totalElements).toBeNull();
  });

  test('itemKeys 지정', () => {
    expect(normalizePagedListPayload({ rows: [1], list: [2] }, { itemKeys: ['rows'] }).items).toEqual([1]);
  });
});

describe('hasMorePagedItems', () => {
  const base = { loadedCount: 5, lastPage: 0, lastPageCount: 5, pageSize: 5, totalElements: null, totalPages: null };

  test('totalElements 우선 — 6건 중 5건 → 더 있음 / 6건 → 없음', () => {
    expect(hasMorePagedItems({ ...base, totalElements: 6 })).toBe(true);
    expect(hasMorePagedItems({ ...base, loadedCount: 6, totalElements: 6 })).toBe(false);
  });

  test('totalPages 만 있을 때', () => {
    expect(hasMorePagedItems({ ...base, totalPages: 2 })).toBe(true);
    expect(hasMorePagedItems({ ...base, lastPage: 1, totalPages: 2 })).toBe(false);
  });

  test('총계 없음 → 마지막 페이지가 꽉 찼는지', () => {
    expect(hasMorePagedItems(base)).toBe(true);
    expect(hasMorePagedItems({ ...base, lastPageCount: 3 })).toBe(false);
  });
});
