/**
 * sameDayPendingEventDecorator 단위 테스트.
 *
 * 옵션 B (예약 우선 매칭) — 캘린더 이벤트 시각 구분 분기 검증.
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md.
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
  test('TENTATIVE_PENDING_PAYMENT + 매핑 paymentTiming=SAME_DAY_CARD → true', () => {
    const lookup = new Map([['100', SAME_DAY_TIMING]]);
    expect(isSameDayPendingEvent(tentativeEvent(100), lookup)).toBe(true);
  });

  test('TENTATIVE_PENDING_PAYMENT + 매핑 paymentTiming=ADVANCE → false', () => {
    const lookup = new Map([['100', ADVANCE_TIMING]]);
    expect(isSameDayPendingEvent(tentativeEvent(100), lookup)).toBe(false);
  });

  test('TENTATIVE_PENDING_PAYMENT + 매핑 룩업 미존재 → false (레거시 ADVANCE 동등)', () => {
    expect(isSameDayPendingEvent(tentativeEvent(100), new Map())).toBe(false);
  });

  test('status=BOOKED (결제 완료 후) → SAME_DAY_CARD 라도 false', () => {
    const lookup = new Map([['100', SAME_DAY_TIMING]]);
    const event = { ...tentativeEvent(100), extendedProps: { mappingId: 100, status: 'BOOKED' } };
    expect(isSameDayPendingEvent(event, lookup)).toBe(false);
  });

  test('status=CONFIRMED → false', () => {
    const lookup = new Map([['100', SAME_DAY_TIMING]]);
    const event = { ...tentativeEvent(100), extendedProps: { mappingId: 100, status: 'CONFIRMED' } };
    expect(isSameDayPendingEvent(event, lookup)).toBe(false);
  });

  test('mappingId 누락 → false', () => {
    const lookup = new Map([['100', SAME_DAY_TIMING]]);
    const event = { ...tentativeEvent(100), extendedProps: { status: 'TENTATIVE_PENDING_PAYMENT' } };
    expect(isSameDayPendingEvent(event, lookup)).toBe(false);
  });

  test('lookup null/undefined → false (안전)', () => {
    expect(isSameDayPendingEvent(tentativeEvent(100), null)).toBe(false);
    expect(isSameDayPendingEvent(tentativeEvent(100), undefined)).toBe(false);
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

  test('ADVANCE 매핑은 변경 없음 (원본 events 그대로)', () => {
    const lookup = new Map([['100', ADVANCE_TIMING]]);
    const events = [tentativeEvent(100, '홍길동')];
    const result = decorateScheduleEventsForSameDayPending(events, lookup);
    expect(result[0]).toBe(events[0]);
    expect(result[0].title).toBe('홍길동');
    expect(result[0].className).toBe('schedule-event status-tentative_pending_payment');
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

  test('lookup 비어있으면 events 원본 그대로 반환 (성능 가드)', () => {
    const events = [tentativeEvent(100)];
    const result = decorateScheduleEventsForSameDayPending(events, new Map());
    expect(result).toBe(events);
  });

  test('혼합 이벤트: SAME_DAY_CARD + ADVANCE + 미연결 매핑 → SAME_DAY 만 데코', () => {
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
    expect(result[2].title).toBe('미연결');
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
