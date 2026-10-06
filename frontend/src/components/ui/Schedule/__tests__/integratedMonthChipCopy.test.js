/**
 * 통합 월간 컴팩트 칩 문구·표식·인라인 스타일 부재.
 */
import fs from 'fs';
import path from 'path';
import {
  INTEGRATED_MONTH_CHIP_I18N,
  buildIntegratedMonthChipCopy
} from '../integratedMonthChipCopy';
import { resolveCompactScheduleStatusModifier } from '../../../../constants/schedule';

const CALENDAR_JS = path.resolve(__dirname, '..', 'ScheduleCalendarView.js');
const SCHEDULE_JSON = path.resolve(__dirname, '..', '..', '..', '..', 'locales', 'ko', 'schedule.json');
const MARKS_CSS = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'admin',
  'mapping-management',
  'integrated-schedule',
  'molecules',
  'ScheduleEventMarks.css'
);
const IMS_CSS = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'admin',
  'mapping-management',
  'IntegratedMatchingSchedule.css'
);

const translate = (key, options = {}) => {
  const table = {
    [INTEGRATED_MONTH_CHIP_I18N.cancelledBadge]: '취소',
    [INTEGRATED_MONTH_CHIP_I18N.sameDayPrefix]: '당일',
    [INTEGRATED_MONTH_CHIP_I18N.sameDayAria]: '당일 결제 대기',
    [INTEGRATED_MONTH_CHIP_I18N.clientNameFallback]: '이름 없음',
    [INTEGRATED_MONTH_CHIP_I18N.unresolvedBoth]:
      `이 일정 미해소 ${options.schedule}건 · 내담자 전체 ${options.client}건`,
    [INTEGRATED_MONTH_CHIP_I18N.unresolvedScheduleOnly]: `미해소 ${options.count}건`,
    [INTEGRATED_MONTH_CHIP_I18N.unresolvedClientOnly]: `내담자 미해소 ${options.count}건`,
    [INTEGRATED_MONTH_CHIP_I18N.reminderSmsAria.SENT]: '문자 발송됨',
    [INTEGRATED_MONTH_CHIP_I18N.reminderSmsAria.PENDING]: '문자 발송 예정',
    [INTEGRATED_MONTH_CHIP_I18N.reminderSmsAria.FAILED]: '문자 발송 실패',
    [INTEGRATED_MONTH_CHIP_I18N.institutionLink]: '기관연계'
  };
  return table[key] || key;
};

describe('buildIntegratedMonthChipCopy', () => {
  test('기관연계·문자·당일·회기를 aria-label 에 남긴다', () => {
    const copy = buildIntegratedMonthChipCopy({
      translate,
      timeText: '오후 12시',
      clientName: '이서준',
      sessionAriaLabel: '이 일정 6회기',
      statusLabel: '예약됨',
      isSameDayPending: false,
      institutionLabel: '기관연계',
      reminderSmsStatus: 'SENT',
      scheduleUnresolvedCount: 0,
      clientWideUnresolvedCount: 0
    });
    expect(copy.ariaLabel).toBe('오후 12시 · 이서준 이 일정 6회기 · 예약됨 · 기관연계 · 문자 발송됨');
  });

  test('당일 가예약과 문자 실패를 전체 라벨로 남긴다', () => {
    const copy = buildIntegratedMonthChipCopy({
      translate,
      timeText: '오전 10:30',
      clientName: '정민호',
      statusLabel: '가예약',
      isSameDayPending: true,
      institutionLabel: '기관연계',
      reminderSmsStatus: 'FAILED'
    });
    expect(copy.ariaLabel).toBe('당일 결제 대기 · 오전 10:30 · 정민호 · 가예약 · 기관연계 · 문자 발송 실패');
    expect(copy.sameDayPrefix).toBe('당일');
  });

  test('미해소 세 문구는 i18n 키 보간을 쓴다', () => {
    expect(buildIntegratedMonthChipCopy({
      translate,
      timeText: '오후 4시',
      clientName: '박지우',
      statusLabel: '예약됨',
      scheduleUnresolvedCount: 1,
      clientWideUnresolvedCount: 2
    }).unresolvedText).toBe('이 일정 미해소 1건 · 내담자 전체 2건');

    expect(buildIntegratedMonthChipCopy({
      translate,
      clientName: '김',
      scheduleUnresolvedCount: 3,
      clientWideUnresolvedCount: 0
    }).unresolvedText).toBe('미해소 3건');

    expect(buildIntegratedMonthChipCopy({
      translate,
      clientName: '김',
      scheduleUnresolvedCount: 0,
      clientWideUnresolvedCount: 4
    }).unresolvedText).toBe('내담자 미해소 4건');
  });

  test('취소 배지 문구는 i18n 키이고 빈 표식은 라벨에 넣지 않는다', () => {
    const copy = buildIntegratedMonthChipCopy({
      translate,
      timeText: '오전 9시',
      clientName: '최유나',
      statusLabel: '취소됨'
    });
    expect(copy.cancelledBadge).toBe('취소');
    expect(copy.ariaLabel).toBe('오전 9시 · 최유나 · 취소됨');
    expect(copy.ariaLabel).not.toContain('문자');
    expect(copy.ariaLabel).not.toContain('기관연계');
  });
});

describe('resolveCompactScheduleStatusModifier', () => {
  test('기존 STATUS 코드만 modifier 로 바꾸고 색 맵은 만들지 않는다', () => {
    expect(resolveCompactScheduleStatusModifier('BOOKED')).toBe('booked');
    expect(resolveCompactScheduleStatusModifier('CONFIRMED')).toBe('confirmed');
    expect(resolveCompactScheduleStatusModifier('COMPLETED')).toBe('completed');
    expect(resolveCompactScheduleStatusModifier('CANCELLED')).toBe('cancelled');
    expect(resolveCompactScheduleStatusModifier('TENTATIVE_PENDING_PAYMENT')).toBe('tentative');
    expect(resolveCompactScheduleStatusModifier('VACATION')).toBe('');
    expect(resolveCompactScheduleStatusModifier(null)).toBe('');
  });
});

describe('월간 컴팩트 칩 소스 계약', () => {
  const source = fs.readFileSync(CALENDAR_JS, 'utf8');
  const scheduleJson = JSON.parse(fs.readFileSync(SCHEDULE_JSON, 'utf8'));
  const marksCss = fs.readFileSync(MARKS_CSS, 'utf8');
  const imsCss = fs.readFileSync(IMS_CSS, 'utf8');

  test('점 색·레일 색 인라인 style 이 없다', () => {
    expect(source).not.toMatch(/backgroundColor:\s*borderColor/);
    expect(source).not.toMatch(/borderLeftColor/);
    expect(source).not.toMatch(/style=\{\{/);
    expect(source).toMatch(/mg-v2-ad-calendar-event__dot--/);
    expect(source).toMatch(/mg-v2-ad-calendar-event--status-/);
  });

  test('표식 묶음은 aria-hidden 이고 끝 패딩 컨테이너 쿼리를 쓴다', () => {
    const marksJs = fs.readFileSync(
      path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'admin',
        'mapping-management',
        'integrated-schedule',
        'molecules',
        'ScheduleEventMarks.js'
      ),
      'utf8'
    );
    expect(source).toMatch(/ScheduleEventMarks/);
    expect(marksJs).toContain('aria-hidden="true"');
    expect(marksCss).toContain('@container mg-month-event (width < 224px)');
    expect(marksCss).toContain('@container mg-compact-row (width < 224px)');
    expect(marksCss).toContain('var(--mg-v2-space-0-5)');
    expect(marksCss).not.toMatch(/transform\s*:/);
    expect(marksCss).not.toMatch(/scale\s*\(/);
  });

  test('폭 단계와 지난 칩 투명도 제거가 통합 스킨에 있다', () => {
    expect(imsCss).toContain('container: mg-month-event / inline-size');
    expect(imsCss).toContain('@container mg-month-event (width < 191px)');
    expect(imsCss).toContain('@container mg-month-event (width < 166px)');
    expect(imsCss).toContain('@container mg-month-event (width < 146px)');
    expect(imsCss).toContain('@container mg-month-event (width < 109px)');
    expect(imsCss).toContain('opacity: 1');
    expect(imsCss).not.toMatch(/content:\s*"당일"/);
    expect(imsCss).not.toMatch(/grayscale/);
  });

  test('추가한 i18n 키가 schedule.json 에 있다', () => {
    expect(scheduleJson.calendar.compact.cancelledBadge).toBe('취소');
    expect(scheduleJson.calendar.compact.sameDayPrefix).toBe('당일');
    expect(scheduleJson.calendar.compact.sameDayAria).toBe('당일 결제 대기');
    expect(scheduleJson.calendar.compact.clientNameFallback).toBe('이름 없음');
    expect(scheduleJson.calendar.unresolved.both).toContain('{{schedule}}');
    expect(scheduleJson.calendar.unresolved.scheduleOnly).toContain('{{count}}');
    expect(scheduleJson.calendar.unresolved.clientOnly).toContain('{{count}}');
    expect(scheduleJson.calendar.reminderSms.aria.SENT).toBe('문자 발송됨');
    expect(scheduleJson.calendar.reminderSms.aria.PENDING).toBe('문자 발송 예정');
    expect(scheduleJson.calendar.reminderSms.aria.FAILED).toBe('문자 발송 실패');
    expect(scheduleJson.calendar.legend.status).toBe('상태');
    expect(scheduleJson.calendar.legend.sms).toBe('문자 발송');
    expect(scheduleJson.calendar.legend.unresolved).toBe('미해소');
    expect(scheduleJson.calendar.legend.hint).toContain('마우스');
  });
});
