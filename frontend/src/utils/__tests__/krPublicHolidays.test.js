import { CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY } from '../../constants/schedule';
import {
  buildKrPublicHolidayFullCalendarEvents,
  getKrPublicHolidayNameForLocalDate,
  getKrSubstituteHolidayEveHintForLocalDate,
  KR_PUBLIC_HOLIDAY_FULLCALENDAR_EVENTS,
  KR_SUBSTITUTE_HOLIDAY_EVE_HINT_PRIMARY
} from '../krPublicHolidays';

describe('krPublicHolidays', () => {
  it('고정 ISO 키에 대해 제목·배경·비편집·extendedProps.type이 일관된다', () => {
    const events = buildKrPublicHolidayFullCalendarEvents();
    const byStart = Object.fromEntries(events.map((e) => [e.start, e]));

    const 신정 = byStart['2026-01-01'];
    expect(신정).toMatchObject({
      id: 'kr-ph-2026-01-01',
      title: '신정',
      allDay: true,
      display: 'background',
      editable: false,
      startEditable: false,
      durationEditable: false,
      overlap: true,
      extendedProps: {
        type: CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY,
        holidayName: '신정'
      }
    });
    expect(신정.classNames).toContain('mg-v2-ad-calendar-event--kr-public-holiday-bg');

    const 근로자의날 = byStart['2026-05-01'];
    expect(근로자의날).toMatchObject({
      id: 'kr-ph-2026-05-01',
      title: '근로자의 날',
      display: 'background',
      extendedProps: {
        type: CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY,
        holidayName: '근로자의 날'
      }
    });
    expect(근로자의날.classNames).toContain('mg-v2-ad-calendar-event--kr-public-holiday-bg');

    const 어린이날 = byStart['2026-05-05'];
    expect(어린이날.title).toBe('어린이날');
    expect(어린이날.extendedProps.type).toBe(CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY);
  });

  it('동일일 병합 라벨(2025-05-05)이 테이블과 일치한다', () => {
    const events = buildKrPublicHolidayFullCalendarEvents();
    const may5 = events.find((e) => e.start === '2025-05-05');
    expect(may5?.title).toBe('어린이날·부처님오신날');
  });

  it('getKrPublicHolidayNameForLocalDate는 로컬 달력 일 기준으로 공휴일명을 반환한다', () => {
    expect(getKrPublicHolidayNameForLocalDate(new Date(2026, 4, 1))).toBe('근로자의 날');
    expect(getKrPublicHolidayNameForLocalDate(new Date(2026, 4, 5))).toBe('어린이날');
    expect(getKrPublicHolidayNameForLocalDate(new Date(2026, 4, 24))).toBe('부처님오신날');
    expect(getKrPublicHolidayNameForLocalDate(new Date(2026, 4, 6))).toBeNull();
  });

  it('모듈 상수는 빌드 결과와 동일 길이·참조 안정성(스케줄 병합용)', () => {
    const a = KR_PUBLIC_HOLIDAY_FULLCALENDAR_EVENTS;
    const b = buildKrPublicHolidayFullCalendarEvents();
    expect(a.length).toBe(b.length);
    expect(a.length).toBeGreaterThan(50);
  });

  it('getKrSubstituteHolidayEveHintForLocalDate: 익일 공휴일명에 「대체」가 있을 때만 전날 힌트', () => {
    const may24 = getKrSubstituteHolidayEveHintForLocalDate(new Date(2026, 4, 24));
    expect(may24).not.toBeNull();
    expect(may24.hintLine).toBe(KR_SUBSTITUTE_HOLIDAY_EVE_HINT_PRIMARY);
    expect(may24.nextHolidayName).toContain('대체');

    const mar1 = getKrSubstituteHolidayEveHintForLocalDate(new Date(2026, 2, 1));
    expect(mar1).not.toBeNull();
    expect(mar1.nextHolidayName).toContain('대체');

    expect(getKrSubstituteHolidayEveHintForLocalDate(new Date(2026, 1, 28))).toBeNull();
    expect(getKrSubstituteHolidayEveHintForLocalDate(new Date(2026, 4, 23))).toBeNull();
    expect(getKrSubstituteHolidayEveHintForLocalDate(new Date(2026, 4, 10))).toBeNull();
  });

  it('getKrSubstituteHolidayEveHintForLocalDate: 무효 날짜는 null', () => {
    expect(getKrSubstituteHolidayEveHintForLocalDate(new Date(Number.NaN))).toBeNull();
  });
});
