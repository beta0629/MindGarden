/**
 * ConsultationLogViewPage — Deep link 쿼리 파라미터 동기화 회귀 가드.
 *
 * 단위 테스트 매트릭스:
 *  - computeRangeFromQuery:
 *    · `?date=2026-06-04` → startDate=endDate=2026-06-04
 *    · `?date=` 없음/잘못된 값 → null
 *    · 단일 자릿수 월/일도 정규화
 *  - parseNumericQueryParam:
 *    · 정상 정수 → number
 *    · 빈값/문자열/0/음수 → null
 *
 * 사용처: 스케줄 상세 모달 → 상담일지 보기/수정 deep link
 *  (scheduleId/date/clientId 자동 필터링).
 *
 * @author MindGarden
 * @since 2026-06-04
 */

import {
  computeRangeFromQuery,
  parseNumericQueryParam
} from '../ConsultationLogViewPage';

describe('computeRangeFromQuery', () => {
  test('?date=2026-06-04 → startDate=endDate 동일 일자', () => {
    const params = new URLSearchParams('date=2026-06-04');
    expect(computeRangeFromQuery(params)).toEqual({
      startDate: '2026-06-04',
      endDate: '2026-06-04'
    });
  });

  test('단일 자릿수 월/일도 정규화', () => {
    const params = new URLSearchParams('date=2026-6-4');
    expect(computeRangeFromQuery(params)).toEqual({
      startDate: '2026-06-04',
      endDate: '2026-06-04'
    });
  });

  test('date 파라미터 없음 → null', () => {
    expect(computeRangeFromQuery(new URLSearchParams(''))).toBeNull();
  });

  test('잘못된 형식 (yyyymmdd 등) → null', () => {
    expect(computeRangeFromQuery(new URLSearchParams('date=20260604'))).toBeNull();
    expect(computeRangeFromQuery(new URLSearchParams('date=invalid'))).toBeNull();
  });

  test('searchParams null/undefined → null (방어적)', () => {
    expect(computeRangeFromQuery(null)).toBeNull();
    expect(computeRangeFromQuery(undefined)).toBeNull();
    expect(computeRangeFromQuery({})).toBeNull();
  });
});

describe('parseNumericQueryParam', () => {
  test('정상 정수 → number', () => {
    const params = new URLSearchParams('clientId=42&consultantId=99');
    expect(parseNumericQueryParam(params, 'clientId')).toBe(42);
    expect(parseNumericQueryParam(params, 'consultantId')).toBe(99);
  });

  test('빈값/문자열/소수/0/음수 → null', () => {
    const params = new URLSearchParams('a=&b=abc&c=1.5&d=0&e=-1');
    expect(parseNumericQueryParam(params, 'a')).toBeNull();
    expect(parseNumericQueryParam(params, 'b')).toBeNull();
    expect(parseNumericQueryParam(params, 'c')).toBeNull();
    expect(parseNumericQueryParam(params, 'd')).toBeNull();
    expect(parseNumericQueryParam(params, 'e')).toBeNull();
  });

  test('파라미터 미존재 → null', () => {
    expect(parseNumericQueryParam(new URLSearchParams(''), 'clientId')).toBeNull();
  });

  test('searchParams null/undefined → null', () => {
    expect(parseNumericQueryParam(null, 'clientId')).toBeNull();
    expect(parseNumericQueryParam(undefined, 'clientId')).toBeNull();
  });
});
