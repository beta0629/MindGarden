/**
 * ScheduleCalendarView — 월간 셀 색.
 * 일요일·공휴일 셀 배경은 칠하지 않는다. 숫자는 보조색.
 * 다른 달 숫자는 비활성색이며 요일·공휴일보다 우선한다.
 */
import fs from 'fs';
import path from 'path';

const CSS_PATH = path.resolve(__dirname, '..', 'ScheduleCalendarView.css');
const CALENDAR_JS = path.resolve(__dirname, '..', 'ScheduleCalendarView.js');
const SCHEDULE_JSON = path.resolve(__dirname, '..', '..', '..', '..', 'locales', 'ko', 'schedule.json');

const readFile = (filePath) => fs.readFileSync(filePath, 'utf8');

describe('월간 셀 날짜 색', () => {
  let css;
  let calendarJs;
  let scheduleJson;

  beforeAll(() => {
    css = readFile(CSS_PATH);
    calendarJs = readFile(CALENDAR_JS);
    scheduleJson = JSON.parse(readFile(SCHEDULE_JSON));
  });

  test('일요일·공휴일 셀에 붉은 배경을 칠하지 않고 숫자는 보조색이다', () => {
    expect(css).not.toMatch(
      /td\.fc-daygrid-day\.mg-v2-ad-calendar-day--kr-public-holiday\s*\{[^}]*background-color:\s*var\(--mg-calendar-holiday-bg\)/
    );
    expect(css).not.toMatch(
      /td\.fc-daygrid-day\.mg-v2-ad-calendar-day--weekend-sun\s*\{[^}]*background-color:\s*var\(--mg-calendar-weekend-sun-bg\)/
    );
    expect(css).toMatch(
      /td\.fc-daygrid-day\.mg-v2-ad-calendar-day--weekend-sun \.fc-daygrid-day-number,[\s\S]*?color:\s*var\(--mg-v2-color-text-secondary\)/
    );
    expect(css).toMatch(
      /mg-v2-ad-calendar-day-holiday-badge__name\s*\{[^}]*font-size:\s*var\(--mg-v2-font-size-caption\)/
    );
    expect(css).toMatch(/text-overflow:\s*ellipsis/);
    expect(calendarJs).toMatch(/nameSpan\.title = safeName/);
  });

  test('다른 달 숫자는 비활성색이 요일·공휴일보다 뒤에 선언된다', () => {
    const sundayColor = css.indexOf('mg-v2-ad-calendar-day--weekend-sun .fc-daygrid-day-number');
    const otherMonth = css.indexOf('td.fc-daygrid-day.fc-day-other .fc-daygrid-day-number');
    expect(sundayColor).toBeGreaterThan(-1);
    expect(otherMonth).toBeGreaterThan(sundayColor);
    const otherBlock = css.slice(otherMonth, otherMonth + 700);
    expect(otherBlock).toMatch(/color:\s*var\(--mg-v2-color-text-disabled\)/);
    expect(otherBlock).toMatch(/fc-day-other\.mg-v2-ad-calendar-day--kr-public-holiday/);
  });

  test('월·주·일 버튼 문구는 locale 키를 쓴다', () => {
    expect(calendarJs).toMatch(/schedule:calendar\.views\.month/);
    expect(calendarJs).toMatch(/schedule:calendar\.views\.week/);
    expect(calendarJs).toMatch(/schedule:calendar\.views\.day/);
    expect(calendarJs).toMatch(/buttonText=\{calendarButtonText\}/);
    expect(scheduleJson.calendar.views).toEqual({ month: '월', week: '주', day: '일' });
  });
});
