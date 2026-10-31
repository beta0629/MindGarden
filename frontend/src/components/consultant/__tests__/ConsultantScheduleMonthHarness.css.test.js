/**
 * #1797 회귀 가드 — 월뷰 view-harness/scroller 높이·position 재정의 금지(셀 0 높이 붕괴)
 */
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'ConsultantScheduleSuite.css'), 'utf8');

describe('consultant month view harness', () => {
  it('fc-view-harness·fc-scroller 높이 강제 auto 없음', () => {
    expect(css).not.toMatch(/fc-view-harness[^{]*\{[^}]*height:\s*auto/);
    expect(css).not.toMatch(/fc-scroller[^{]*\{[^}]*height:\s*auto/);
    expect(css).not.toMatch(/fc-dayGridMonth-view\s*\{[^}]*position:\s*relative/);
  });
});

describe('consultant month view — 모든 주 표시 (2026-10-31 아래 주 잘림)', () => {
  const view = fs.readFileSync(path.join(__dirname, '..', '..', 'ui', 'Schedule', 'ScheduleCalendarView.js'), 'utf8');
  it('상담사 월뷰는 FullCalendar height auto (고정 100% 내부 스크롤러에 주를 가두지 않음)', () => {
    expect(view).toMatch(/consultantMonthAutoHeight\s*=\s*tabletV2Active\s*&&\s*activeViewType\s*===\s*CALENDAR_VIEW_MONTH/);
    expect(view).toMatch(/height=\{consultantMonthAutoHeight \? 'auto' : '100%'\}/);
  });
  it('월뷰 주 행 표 최소 높이는 토큰만 사용', () => {
    expect(css).toMatch(/fc-dayGridMonth-view \.fc-daygrid-body > table \{\s*height: var\(--mg-v2-consultant-calendar-month-body-min-height\);/);
  });
});
