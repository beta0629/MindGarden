/**
 * 옵션 A 정착 정합 회귀 — 2026-05-23
 *
 * - TC3: caller 3개(ConsultantScheduleRenewal 데스크탑 + ClientSchedule + AdminSchedulesPage)
 *        모두 `integratedMonthEventLayout` + `calendarSkin="integrated"` props 를 UnifiedScheduleComponent 에 전달
 * - TC4: ConsultantScheduleRenewal 가 1024px 분기 매체 쿼리(`(min-width: 1024px)`)로
 *        데스크탑/모바일 분기를 수행
 * - TC5: 구트리 `frontend/src/components/schedule/ScheduleCalendar(.js|.css|/*)` import 0건
 *
 * SSOT: docs/project-management/2026-05-23/CALENDAR_OPTION_A_DESIGN_HANDOFF.md §3-§4
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..', '..', '..');

const readFile = (relativePath) =>
  fs.readFileSync(path.resolve(FRONTEND_SRC, relativePath), 'utf8');

describe('옵션 A 정착 회귀', () => {
  test('TC3-a: ConsultantScheduleRenewal 데스크탑 분기에 integrated props 전파', () => {
    const src = readFile('components/consultant/ConsultantScheduleRenewal.js');
    expect(src).toMatch(/import\s+UnifiedScheduleComponent\s+from\s+['"]\.\.\/schedule\/UnifiedScheduleComponent['"]/);
    expect(src).toMatch(/<UnifiedScheduleComponent[\s\S]*integratedMonthEventLayout[\s\S]*calendarSkin=["']integrated["'][\s\S]*\/>/);
  });

  test('TC3-b: ClientSchedule 가 UnifiedScheduleComponent + integrated props 사용', () => {
    const src = readFile('components/client/ClientSchedule.js');
    expect(src).toMatch(/import\s+UnifiedScheduleComponent\s+from\s+['"]\.\.\/schedule\/UnifiedScheduleComponent['"]/);
    expect(src).toMatch(/<UnifiedScheduleComponent[\s\S]*integratedMonthEventLayout[\s\S]*calendarSkin=["']integrated["'][\s\S]*\/>/);
    // 구트리 ScheduleCalendar 미참조
    expect(src).not.toMatch(/from\s+['"][^'"]*schedule\/ScheduleCalendar['"]/);
  });

  test('TC3-c: AdminSchedulesPage 가 integrated props 전파', () => {
    const src = readFile('components/schedule/AdminSchedulesPage.js');
    expect(src).toMatch(/<UnifiedScheduleComponent[\s\S]*integratedMonthEventLayout[\s\S]*calendarSkin=["']integrated["'][\s\S]*\/>/);
  });

  test('TC3-d: SchedulePage 가 integrated props 전파', () => {
    const src = readFile('components/schedule/SchedulePage.js');
    expect(src).toMatch(/<UnifiedScheduleComponent[\s\S]*integratedMonthEventLayout[\s\S]*calendarSkin=["']integrated["'][\s\S]*\/>/);
  });

  test('TC4: ConsultantScheduleRenewal 1024px 분기 — useMediaQuery 사용 + 모바일 day-bar UX 유지', () => {
    const src = readFile('components/consultant/ConsultantScheduleRenewal.js');
    expect(src).toMatch(/from\s+['"][^'"]*hooks\/useMediaQuery['"]/);
    expect(src).toMatch(/\(min-width:\s*1024px\)/); // 데스크탑 미디어 쿼리
    expect(src).toMatch(/useMediaQuery\(/);
    expect(src).toMatch(/cr-schedule__day-bar/); // 모바일 day-bar UX 보존
    expect(src).toMatch(/cr-schedule--desktop/); // 데스크탑 분기 클래스
  });

  test('TC5: 구트리 ScheduleCalendar 파일 부재', () => {
    const oldPaths = [
      'components/schedule/ScheduleCalendar.js',
      'components/schedule/ScheduleCalendar.css',
      'components/schedule/ScheduleCalendar/ScheduleCalendarCore.js',
      'components/schedule/ScheduleCalendar/ScheduleCalendarHeader.js',
      'components/schedule/ScheduleCalendar/ScheduleCalendarLegend.js',
      'components/schedule/ScheduleCalendar/ScheduleCalendarMobileZoom.js',
      'components/schedule/ScheduleCalendar/ScheduleCalendarUtils.js'
    ];
    oldPaths.forEach((relativePath) => {
      const absolute = path.resolve(FRONTEND_SRC, relativePath);
      expect(fs.existsSync(absolute)).toBe(false);
    });
  });
});
