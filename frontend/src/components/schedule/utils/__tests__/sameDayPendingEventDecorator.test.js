/**
 * sameDayPendingEventDecorator 단위 테스트.
 *
 * 옵션 B (예약 우선 매칭) — 캘린더 이벤트 시각 구분 분기 검증.
 *
 * v2.0 (결함 B fix 보강, 2026-05-28):
 * - status === TENTATIVE_PENDING_PAYMENT 단독으로 점선 분기 적용 (mapping_id NULL 도 분기 동작)
 * - lookup 이 명시적으로 ADVANCE 를 반환하는 경우만 데이터 이상 안전 가드로 차단
 *
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN_V2.md §5,
 *        docs/project-management/2026-05-28/OPTION_B_V2_TEST_MATRIX.md §8 (케이스 53~56).
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import {
  decorateScheduleEventsForSameDayPending,
  isSameDayPendingEvent,
  buildMappingPaymentTimingLookup,
  SAME_DAY_PENDING_EVENT_CLASS,
  SAME_DAY_PENDING_TITLE_PREFIX
} from '../sameDayPendingEventDecorator';

const SAME_DAY_TIMING = 'SAME_DAY_CARD';
const ADVANCE_TIMING = 'ADVANCE';

const tentativeEvent = (mappingId, title = '내담자') => ({
  id: 1,
  title,
  className: 'schedule-event status-tentative_pending_payment',
  extendedProps: {
    mappingId,
    status: 'TENTATIVE_PENDING_PAYMENT'
  }
});

describe('isSameDayPendingEvent', () => {
  // ===== 매트릭스 §8 케이스 53: TENTATIVE_PENDING_PAYMENT + lookup SAME_DAY_CARD → true =====
  test('[53] TENTATIVE_PENDING_PAYMENT + 매핑 paymentTiming=SAME_DAY_CARD → true', () => {
    const lookup = new Map([['100', SAME_DAY_TIMING]]);
    expect(isSameDayPendingEvent(tentativeEvent(100), lookup)).toBe(true);
  });

  test('TENTATIVE_PENDING_PAYMENT + 매핑 paymentTiming=ADVANCE → false (데이터 이상 안전 가드)', () => {
    const lookup = new Map([['100', ADVANCE_TIMING]]);
    expect(isSameDayPendingEvent(tentativeEvent(100), lookup)).toBe(false);
  });

  // ===== 매트릭스 §8 케이스 54: mapping_id NULL 일 때도 status 단독 분기 동작 (B 결함 fix 보강) =====
  test('[54a] TENTATIVE_PENDING_PAYMENT + 매핑 룩업 비어있음 → true (v2.0 status 단독 분기)', () => {
    expect(isSameDayPendingEvent(tentativeEvent(100), new Map())).toBe(true);
  });

  test('[54b] TENTATIVE_PENDING_PAYMENT + mappingId 누락 → true (v2.0 status 단독 분기)', () => {
    const lookup = new Map([['100', SAME_DAY_TIMING]]);
    const event = { ...tentativeEvent(100), extendedProps: { status: 'TENTATIVE_PENDING_PAYMENT' } };
    expect(isSameDayPendingEvent(event, lookup)).toBe(true);
  });

  test('[54c] TENTATIVE_PENDING_PAYMENT + lookup null/undefined → true (v2.0 status 단독 분기)', () => {
    expect(isSameDayPendingEvent(tentativeEvent(100), null)).toBe(true);
    expect(isSameDayPendingEvent(tentativeEvent(100), undefined)).toBe(true);
  });

  test('[54d] TENTATIVE_PENDING_PAYMENT + lookup 에 mappingId 미등록 → true (v2.0 status 단독 분기)', () => {
    const lookup = new Map([['999', SAME_DAY_TIMING]]);
    expect(isSameDayPendingEvent(tentativeEvent(100), lookup)).toBe(true);
  });

  // ===== 매트릭스 §8 케이스 55: CONFIRMED → 점선 클래스 미부여 =====
  test('[55a] status=BOOKED (결제 완료 후) → SAME_DAY_CARD 라도 false', () => {
    const lookup = new Map([['100', SAME_DAY_TIMING]]);
    const event = { ...tentativeEvent(100), extendedProps: { mappingId: 100, status: 'BOOKED' } };
    expect(isSameDayPendingEvent(event, lookup)).toBe(false);
  });

  test('[55b] status=CONFIRMED → false', () => {
    const lookup = new Map([['100', SAME_DAY_TIMING]]);
    const event = { ...tentativeEvent(100), extendedProps: { mappingId: 100, status: 'CONFIRMED' } };
    expect(isSameDayPendingEvent(event, lookup)).toBe(false);
  });

  test('객체 타입 lookup 도 지원 (key 자동 stringify)', () => {
    expect(isSameDayPendingEvent(tentativeEvent(100), { 100: SAME_DAY_TIMING })).toBe(true);
    expect(isSameDayPendingEvent(tentativeEvent(100), { '100': SAME_DAY_TIMING })).toBe(true);
  });
});

describe('decorateScheduleEventsForSameDayPending', () => {
  test('SAME_DAY_CARD pending 이벤트에 클래스 추가 + title prefix prepend', () => {
    const lookup = new Map([['100', SAME_DAY_TIMING]]);
    const events = [tentativeEvent(100, '홍길동')];
    const result = decorateScheduleEventsForSameDayPending(events, lookup);
    expect(result).toHaveLength(1);
    expect(result[0].className).toEqual([
      'schedule-event',
      'status-tentative_pending_payment',
      SAME_DAY_PENDING_EVENT_CLASS
    ]);
    expect(result[0].title).toBe(`${SAME_DAY_PENDING_TITLE_PREFIX}홍길동`);
    expect(result[0].extendedProps.mappingPaymentTiming).toBe(SAME_DAY_TIMING);
    expect(result[0].extendedProps.isSameDayPending).toBe(true);
  });

  test('ADVANCE 매핑은 변경 없음 (원본 events 그대로 — 데이터 이상 안전 가드)', () => {
    const lookup = new Map([['100', ADVANCE_TIMING]]);
    const events = [tentativeEvent(100, '홍길동')];
    const result = decorateScheduleEventsForSameDayPending(events, lookup);
    expect(result[0]).toBe(events[0]);
    expect(result[0].title).toBe('홍길동');
    expect(result[0].className).toBe('schedule-event status-tentative_pending_payment');
  });

  // ===== 매트릭스 §8 케이스 54 보강: lookup 비어있어도 TENTATIVE_PENDING_PAYMENT 데코 =====
  test('[54-decorate] lookup 비어있어도 TENTATIVE_PENDING_PAYMENT 이벤트는 데코 (v2.0 status 단독)', () => {
    const events = [tentativeEvent(100, '홍길동')];
    const result = decorateScheduleEventsForSameDayPending(events, new Map());
    expect(result[0].title).toBe(`${SAME_DAY_PENDING_TITLE_PREFIX}홍길동`);
    expect(result[0].className).toContain(SAME_DAY_PENDING_EVENT_CLASS);
    expect(result[0].extendedProps.isSameDayPending).toBe(true);
  });

  test('[54-decorate] mappingId 누락 이벤트도 status 단독으로 데코', () => {
    const noMappingEvent = {
      id: 1,
      title: '미연결',
      className: 'schedule-event',
      extendedProps: { status: 'TENTATIVE_PENDING_PAYMENT' }
    };
    const result = decorateScheduleEventsForSameDayPending([noMappingEvent], new Map());
    expect(result[0].title).toBe(`${SAME_DAY_PENDING_TITLE_PREFIX}미연결`);
    expect(result[0].className).toContain(SAME_DAY_PENDING_EVENT_CLASS);
  });

  test('이미 prefix 적용된 title 은 중복 prepend 안 함', () => {
    const lookup = new Map([['100', SAME_DAY_TIMING]]);
    const events = [tentativeEvent(100, `${SAME_DAY_PENDING_TITLE_PREFIX}이재학`)];
    const result = decorateScheduleEventsForSameDayPending(events, lookup);
    expect(result[0].title).toBe(`${SAME_DAY_PENDING_TITLE_PREFIX}이재학`);
  });

  test('className 이 배열인 경우도 정상 병합 + 중복 제거', () => {
    const lookup = new Map([['100', SAME_DAY_TIMING]]);
    const event = {
      ...tentativeEvent(100),
      className: ['schedule-event', 'status-tentative_pending_payment']
    };
    const result = decorateScheduleEventsForSameDayPending([event], lookup);
    expect(result[0].className).toEqual([
      'schedule-event',
      'status-tentative_pending_payment',
      SAME_DAY_PENDING_EVENT_CLASS
    ]);
  });

  test('이미 same-day-pending 클래스가 있어도 중복 추가 안 함 (멱등)', () => {
    const lookup = new Map([['100', SAME_DAY_TIMING]]);
    const event = {
      ...tentativeEvent(100),
      className: ['schedule-event', SAME_DAY_PENDING_EVENT_CLASS]
    };
    const result = decorateScheduleEventsForSameDayPending([event], lookup);
    expect(result[0].className.filter((c) => c === SAME_DAY_PENDING_EVENT_CLASS)).toHaveLength(1);
  });

  test('빈 events / 비배열 안전', () => {
    expect(decorateScheduleEventsForSameDayPending([], new Map([['100', SAME_DAY_TIMING]]))).toEqual([]);
    expect(decorateScheduleEventsForSameDayPending(null, new Map())).toEqual([]);
    expect(decorateScheduleEventsForSameDayPending(undefined, new Map())).toEqual([]);
  });

  // ===== v2.0: 일반 이벤트만 있는 경우 데코 미적용 (status 가드로 동등 효과) =====
  test('일반 이벤트(non-TENTATIVE)만 있는 경우 데코 미적용', () => {
    const normalEvent = {
      id: 1,
      title: '확정 일정',
      className: 'schedule-event status-booked',
      extendedProps: { status: 'BOOKED', mappingId: 100 }
    };
    const result = decorateScheduleEventsForSameDayPending([normalEvent], new Map());
    expect(result[0]).toBe(normalEvent);
  });

  test('혼합 이벤트: SAME_DAY_CARD + ADVANCE + 미연결 매핑 (v2.0: 미연결도 데코)', () => {
    const lookup = new Map([
      ['100', SAME_DAY_TIMING],
      ['200', ADVANCE_TIMING]
    ]);
    const events = [
      tentativeEvent(100, '홍길동'),
      tentativeEvent(200, '이재학'),
      tentativeEvent(300, '미연결')
    ];
    const result = decorateScheduleEventsForSameDayPending(events, lookup);
    expect(result[0].title.startsWith(SAME_DAY_PENDING_TITLE_PREFIX)).toBe(true);
    expect(result[1].title).toBe('이재학');
    expect(result[2].title.startsWith(SAME_DAY_PENDING_TITLE_PREFIX)).toBe(true);
  });

  test('결제 완료 후 BOOKED 로 전환된 이벤트 → 데코 미적용 (자동 복귀)', () => {
    const lookup = new Map([['100', SAME_DAY_TIMING]]);
    const events = [{
      ...tentativeEvent(100),
      extendedProps: { mappingId: 100, status: 'BOOKED' }
    }];
    const result = decorateScheduleEventsForSameDayPending(events, lookup);
    expect(result[0].title).toBe('내담자');
    expect(result[0].className).toBe('schedule-event status-tentative_pending_payment');
  });
});

// ===== 매트릭스 §8 케이스 56: 다크 모드 cascade 토큰 — 상수 SSOT 검증 =====
describe('[56] 다크 모드 cascade 토큰 SSOT', () => {
  test('SAME_DAY_PENDING_EVENT_CLASS 상수는 CSS 셀렉터와 정확히 일치 (cascade 토큰 의존)', () => {
    // 이 클래스명을 CSS .integrated-schedule__event--same-day-pending (그리고 v2.0 cascade
    // 보강 후 inner .mg-v2-ad-calendar-event 까지) 가 var(--mg-color-warning-bg/dark) 토큰으로
    // 스타일링한다. 토큰은 :root[data-theme="dark"] 에 분기가 정의되어 cascade 되므로
    // 클래스명 SSOT 만 유지하면 다크 모드 정합 보장.
    expect(SAME_DAY_PENDING_EVENT_CLASS).toBe('integrated-schedule__event--same-day-pending');
    expect(SAME_DAY_PENDING_TITLE_PREFIX).toBe('[당일결제] ');
  });
});

describe('buildMappingPaymentTimingLookup', () => {
  test('paymentTiming 이 있는 매핑만 등록 + key stringify', () => {
    const lookup = buildMappingPaymentTimingLookup([
      { id: 100, paymentTiming: SAME_DAY_TIMING },
      { id: 200, paymentTiming: ADVANCE_TIMING },
      { id: 300, paymentTiming: null },
      { id: 400 },
      null,
      { paymentTiming: SAME_DAY_TIMING /* id 누락 */ }
    ]);
    expect(lookup.get('100')).toBe(SAME_DAY_TIMING);
    expect(lookup.get('200')).toBe(ADVANCE_TIMING);
    expect(lookup.has('300')).toBe(false);
    expect(lookup.has('400')).toBe(false);
    expect(lookup.size).toBe(2);
  });

  test('비배열 입력 → 빈 Map', () => {
    expect(buildMappingPaymentTimingLookup(null).size).toBe(0);
    expect(buildMappingPaymentTimingLookup(undefined).size).toBe(0);
    expect(buildMappingPaymentTimingLookup('not-array').size).toBe(0);
  });
});
