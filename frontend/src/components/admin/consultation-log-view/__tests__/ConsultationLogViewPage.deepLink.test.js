/**
 * ConsultationLogViewPage — Deep link 쿼리 파라미터 동기화 회귀 가드.
 *
 * 단위 테스트 매트릭스:
 *  - computeRangeFromQuery / parseNumericQueryParam
 *  - findRecordIdByScheduleDeepLink (scheduleId → 모달 자동 오픈)
 *
 * 사용처: 스케줄 상세 모달 → 상담일지 보기/수정 deep link
 *  (scheduleId/date/clientId 자동 필터링 + 모달 1회 오픈).
 *
 * @author MindGarden
 * @since 2026-06-04
 */

import {
  computeRangeFromQuery,
  parseNumericQueryParam,
  findRecordIdByScheduleDeepLink
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

describe('findRecordIdByScheduleDeepLink (scheduleId → 모달 record id)', () => {
  const records = [
    { id: 10, consultationId: 501, clientId: 1 },
    { id: 11, scheduleId: 502, clientId: 2 },
    { id: 12, consultationId: '503', clientId: 3 }
  ];

  test('consultationId 매칭 → record.id', () => {
    expect(findRecordIdByScheduleDeepLink(records, 501)).toBe(10);
  });

  test('scheduleId 매칭 → record.id', () => {
    expect(findRecordIdByScheduleDeepLink(records, 502)).toBe(11);
  });

  test('문자열 consultationId 도 매칭', () => {
    expect(findRecordIdByScheduleDeepLink(records, 503)).toBe(12);
  });

  test('매칭 없음 → null', () => {
    expect(findRecordIdByScheduleDeepLink(records, 999)).toBeNull();
  });

  test('빈 목록·무효 scheduleId → null', () => {
    expect(findRecordIdByScheduleDeepLink([], 501)).toBeNull();
    expect(findRecordIdByScheduleDeepLink(null, 501)).toBeNull();
    expect(findRecordIdByScheduleDeepLink(records, null)).toBeNull();
    expect(findRecordIdByScheduleDeepLink(records, 0)).toBeNull();
    expect(findRecordIdByScheduleDeepLink(records, -1)).toBeNull();
  });
});
