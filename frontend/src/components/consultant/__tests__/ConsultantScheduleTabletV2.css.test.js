/**
 * 상담사 태블릿 일정 v2 — CSS/옵트인 게이트
 * portrait 아젠다 · 주 리스트 · landscape 2줄 · hex 금지 · 셸/일지 커밋 비침습
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../../..');
const read = (rel) => fs.readFileSync(path.resolve(root, rel), 'utf8');

describe('ConsultantSchedule tablet v2 CSS/behavior contracts', () => {
  const suiteCss = read('components/consultant/ConsultantScheduleSuite.css');
  const agendaCss = read('components/ui/Schedule/ConsultantTabletAgendaList.css');
  const calendarCss = read('components/ui/Schedule/ScheduleCalendarView.css');
  const calendarJs = read('components/ui/Schedule/ScheduleCalendarView.js');
  const scheduleJs = read('components/consultant/ConsultantSchedule.js');
  const unifiedJs = read('components/schedule/UnifiedScheduleComponent.js');

  it('ConsultantSchedule passes consultantTabletScheduleV2 opt-in only', () => {
    expect(scheduleJs).toMatch(/consultantTabletScheduleV2/);
    expect(scheduleJs).toMatch(/data-tablet-schedule-v2="true"/);
    expect(unifiedJs).toMatch(/consultantTabletScheduleV2=\{consultantTabletScheduleV2\}/);
    expect(calendarJs).toMatch(/consultantTabletScheduleV2\s*=\s*false/);
  });

  it('portrait agenda: min-height≥72 token · name 2-line clamp · no new hex', () => {
    expect(agendaCss).toMatch(/-webkit-line-clamp:\s*2/);
    expect(agendaCss).toMatch(/min-height:\s*var\(--mg-v2-consultant-row-min-height\)/);
    expect(suiteCss).toMatch(
      /data-tablet-schedule-v2="true"[\s\S]*min-height:\s*max\(var\(--mg-v2-consultant-row-min-height\)/
    );
    expect(agendaCss).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(suiteCss.match(/#[0-9a-fA-F]{3,8}/) || []).toHaveLength(0);
  });

  it('portrait hides FC timegrid harness; landscape enables 2-line client-name', () => {
    expect(calendarCss).toMatch(
      /\.mg-v2-schedule-calendar-view--tablet-agenda-active \.fc \.fc-view-harness\s*\{[^}]*display:\s*none/s
    );
    expect(calendarCss).toMatch(
      /tablet-landscape[\s\S]*client-name[\s\S]*-webkit-line-clamp:\s*2/s
    );
    expect(calendarJs).toMatch(/CONSULTANT_SCHEDULE_TABLET_PORTRAIT_MQ/);
    expect(calendarJs).toMatch(/CONSULTANT_SCHEDULE_TABLET_LANDSCAPE_MQ/);
    expect(calendarJs).toMatch(/useTabletAgendaList/);
    expect(calendarJs).toMatch(/ConsultantTabletAgendaList/);
    expect(calendarJs).toMatch(/nowIndicator=\{true\}/);
  });

  it('landscape default week + portrait day; tablet MQ bounds preserve desktop month', () => {
    const tabletConst = read('constants/consultantScheduleTablet.js');
    expect(tabletConst).toMatch(
      /CONSULTANT_SCHEDULE_TABLET_PORTRAIT_MQ\s*=\s*\n?\s*'\(max-width: 1279px\) and \(orientation: portrait\)'/
    );
    expect(tabletConst).toMatch(/orientation: landscape/);
    expect(tabletConst).toMatch(/max-width: 1279px/);
    expect(tabletConst).toMatch(/hover: none/);
    expect(tabletConst).toMatch(/pointer: coarse/);
    expect(calendarJs).toMatch(/changeView\(CALENDAR_VIEW_DAY\)/);
    expect(calendarJs).toMatch(/changeView\(CALENDAR_VIEW_WEEK\)/);
    expect(calendarJs).toMatch(/tabletLandscapeDefaultAppliedRef/);
    expect(calendarJs).toMatch(/tabletPortraitDefaultAppliedRef/);
  });

  it('does not reintroduce old 1-line density P0 schedule block', () => {
    expect(suiteCss).not.toMatch(/consultant-schedule__density/);
    expect(suiteCss).not.toMatch(/line-clamp:\s*1/);
    expect(suiteCss).toMatch(/태블릿 일정 v2/);
  });

  it('hover is fine-pointer only on agenda rows', () => {
    expect(agendaCss).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*consultant-schedule-tablet-agenda__item:hover/s
    );
  });
});
