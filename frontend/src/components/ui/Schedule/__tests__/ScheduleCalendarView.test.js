/**
 * ScheduleCalendarView — 월간 셀 색.
 * 토요일은 파랑, 일요일·공휴일(토요일 공휴일 포함)은 코랄.
 * 다른 달 숫자는 비활성색이며 요일·공휴일보다 우선한다.
 * 오늘과 선택은 색만이 아니라 모양으로 구분한다.
 */
import fs from 'fs';
import path from 'path';

const CSS_PATH = path.resolve(__dirname, '..', 'ScheduleCalendarView.css');
const CALENDAR_JS = path.resolve(__dirname, '..', 'ScheduleCalendarView.js');
const TOKEN_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'styles',
  'tokens',
  'design-v2-tokens.css'
);
const SCHEDULE_JSON = path.resolve(__dirname, '..', '..', '..', '..', 'locales', 'ko', 'schedule.json');

const readFile = (filePath) => fs.readFileSync(filePath, 'utf8');

const sliceBlock = (source, marker, length = 900) => {
  const index = source.indexOf(marker);
  return index < 0 ? '' : source.slice(index, index + length);
};

describe('월간 셀 날짜 색', () => {
  let css;
  let calendarJs;
  let tokens;
  let scheduleJson;

  beforeAll(() => {
    css = readFile(CSS_PATH);
    calendarJs = readFile(CALENDAR_JS);
    tokens = readFile(TOKEN_PATH);
    scheduleJson = JSON.parse(readFile(SCHEDULE_JSON));
  });

  test('일요일·공휴일 셀에 붉은 배경을 칠하지 않는다', () => {
    expect(css).not.toMatch(
      /td\.fc-daygrid-day\.mg-v2-ad-calendar-day--kr-public-holiday\s*\{[^}]*background-color:\s*var\(--mg-calendar-holiday-bg\)/
    );
    expect(css).not.toMatch(
      /td\.fc-daygrid-day\.mg-v2-ad-calendar-day--weekend-sun\s*\{[^}]*background-color:\s*var\(--mg-calendar-weekend-sun-bg\)/
    );
    expect(css).not.toMatch(/--mg-calendar-weekend-sat-bg/);
    expect(css).toMatch(
      /mg-v2-ad-calendar-day-holiday-badge__name\s*\{[^}]*font-size:\s*var\(--mg-v2-font-size-caption\)/
    );
    expect(css).toMatch(/text-overflow:\s*ellipsis/);
    expect(calendarJs).toMatch(/nameSpan\.title = safeName/);
    expect(css).toMatch(/fc-daygrid-day-top:has\(\.mg-v2-ad-calendar-day-holiday-badge\)\s*\{[^}]*align-items:\s*baseline/);
    expect(css).toMatch(/__eve-hint\s*\{[^}]*display:\s*none/);
    expect(calendarJs).not.toMatch(/getKrSubstituteHolidayEveHintForLocalDate/);
    expect(calendarJs).not.toMatch(/substitute-eve-badge/);
  });

  test('토요일 머리글·숫자는 파랑이고 일요일·공휴일 숫자는 코랄이다', () => {
    expect(css).toMatch(
      /fc-col-header-cell\.fc-day-sat[\s\S]*?color:\s*var\(--mg-calendar-saturday-fg\)/
    );
    expect(css).toMatch(
      /td\.fc-daygrid-day\.fc-day-sat \.fc-daygrid-day-number[\s\S]*?color:\s*var\(--mg-calendar-saturday-fg\)/
    );
    expect(css).toMatch(
      /fc-col-header-cell\.fc-day-sun[\s\S]*?color:\s*var\(--mg-calendar-holiday-fg\)/
    );
    const holidayNumbers = sliceBlock(
      css,
      'td.fc-daygrid-day.fc-day-sun .fc-daygrid-day-number'
    );
    expect(holidayNumbers).toMatch(/mg-v2-ad-calendar-day--kr-public-holiday \.fc-daygrid-day-number/);
    expect(holidayNumbers).toMatch(/color:\s*var\(--mg-calendar-holiday-fg\)/);
    expect(css).not.toMatch(/kr-public-holiday:not\(\.fc-day-sat\)/);
    expect(calendarJs).toMatch(/mg-v2-ad-calendar-day--weekend-sat/);
    expect(calendarJs).toMatch(/mg-v2-ad-calendar-day--weekend-sun/);
    expect(calendarJs).toMatch(/mg-v2-ad-calendar-day--kr-public-holiday/);
  });

  test('토요일 공휴일은 공휴일 색이 토요일 색보다 뒤에 선언된다', () => {
    const saturday = css.indexOf('td.fc-daygrid-day.fc-day-sat .fc-daygrid-day-number');
    const holiday = css.indexOf('td.fc-daygrid-day.mg-v2-ad-calendar-day--kr-public-holiday .fc-daygrid-day-number');
    expect(saturday).toBeGreaterThan(-1);
    expect(holiday).toBeGreaterThan(saturday);
    expect(sliceBlock(css, 'td.fc-daygrid-day.fc-day-sat .fc-daygrid-day-number', 400))
      .toMatch(/color:\s*var\(--mg-calendar-saturday-fg\)/);
    expect(sliceBlock(css, 'td.fc-daygrid-day.mg-v2-ad-calendar-day--kr-public-holiday .fc-daygrid-day-number', 250))
      .toMatch(/color:\s*var\(--mg-calendar-holiday-fg\)/);
  });

  test('다른 달 숫자는 비활성 토큰이 요일·공휴일보다 뒤에 선언된다', () => {
    const sundayColor = css.indexOf('mg-v2-ad-calendar-day--weekend-sun .fc-daygrid-day-number');
    const otherMonth = css.indexOf('td.fc-daygrid-day.fc-day-other .fc-daygrid-day-number');
    expect(sundayColor).toBeGreaterThan(-1);
    expect(otherMonth).toBeGreaterThan(sundayColor);
    const otherBlock = css.slice(otherMonth, otherMonth + 900);
    expect(otherBlock).toMatch(/color:\s*var\(--mg-calendar-other-month-fg\)/);
    expect(otherBlock).toMatch(/fc-day-other\.mg-v2-ad-calendar-day--kr-public-holiday/);
    expect(otherBlock).toMatch(/fc-day-other\.fc-day-sat/);
    expect(tokens).toMatch(
      /--mg-calendar-other-month-fg:\s*var\(--mg-v2-color-text-disabled\)/
    );
  });

  test('오늘과 선택은 색만이 아니라 알약과 셀 테두리로 구분된다', () => {
    const today = sliceBlock(css, 'td.fc-daygrid-day.fc-day-today .fc-daygrid-day-number', 280);
    expect(today).toMatch(/color:\s*var\(--mg-calendar-today-fg\)/);
    expect(today).toMatch(/background-color:\s*var\(--mg-calendar-today-bg\)/);
    expect(today).toMatch(/border-radius:\s*var\(--mg-v2-radius-pill\)/);
    const selected = sliceBlock(css, 'mg-v2-ad-calendar-day--selected .fc-daygrid-day-frame', 400);
    expect(selected).toMatch(/background-color:\s*var\(--mg-calendar-selected-bg\)/);
    expect(selected).toMatch(
      /box-shadow:\s*inset 0 0 0 var\(--mg-calendar-selected-border-width\) var\(--mg-calendar-selected-border\)/
    );
    expect(selected).not.toMatch(/--mg-calendar-today-bg/);
    expect(today).not.toMatch(/--mg-calendar-selected-bg/);
    expect(css).toMatch(/td\.fc-daygrid-day\.fc-day-today\s*\{[^}]*background-color:\s*transparent/);
  });

  test('달력 요일 토큰은 라이트·다크·강제 색을 갖고 컴포넌트 CSS 에 색 리터럴이 없다', () => {
    expect(tokens).toMatch(/--mg-calendar-saturday-fg:\s*#1D4ED8/);
    expect(tokens).toMatch(/--mg-calendar-holiday-fg:\s*var\(--mg-error-500\)/);
    expect(tokens).toMatch(/--mg-calendar-holiday-caption-fg:\s*#B5452B/);
    expect(tokens).toMatch(/--mg-calendar-saturday-fg:\s*#93B4F7/);
    expect(tokens).toMatch(/--mg-calendar-holiday-fg:\s*#F4A08C/);
    expect(tokens).toMatch(/--mg-calendar-holiday-caption-fg:\s*#F2A28E/);
    const forced = tokens.slice(tokens.indexOf('forced-colors: active'));
    expect(forced).toMatch(/--mg-calendar-saturday-fg:\s*CanvasText/);
    expect(forced).toMatch(/--mg-calendar-holiday-fg:\s*CanvasText/);
    expect(forced).toMatch(/--mg-calendar-holiday-caption-fg:\s*CanvasText/);
    expect(tokens).not.toMatch(/--mg-calendar-saturday-fg:\s*var\(--mg-v2-color-money-expense\)/);
    expect(css).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
  });

  test('월·주·일 버튼 문구는 toolbar locale 키를 쓴다', () => {
    expect(calendarJs).toMatch(/buildScheduleCalendarTextOptions/);
    expect(calendarJs).toMatch(/\{\.\.\.calendarTextOptions\}/);
    expect(calendarJs).not.toMatch(/calendarButtonText/);
    expect(calendarJs).not.toMatch(/schedule:calendar\.views/);
    expect(scheduleJson.calendar.toolbar).toMatchObject({ month: '월', week: '주', day: '일' });
    expect(scheduleJson.calendar.views).toBeUndefined();
    expect(scheduleJson.calendar.moreLink_other).toBe('+{{count}}건');
  });
});
