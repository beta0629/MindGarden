/**
 * 월간 칩 앞 점과 범례가 상태 색·로컬 팔레트가 아니라 상담사 색 클래스를 쓰는지.
 * 토요일·공휴일 스타일은 이 검사 대상이 아니다.
 */
import fs from 'fs';
import path from 'path';

const read = (...parts) => fs.readFileSync(path.resolve(...parts), 'utf8');

describe('통합 월간 상담사 색·건수 SSOT', () => {
  test('칩 앞 점은 상담사 색 클래스이고 인라인 style 이 없다', () => {
    const calendar = read(__dirname, '..', 'ScheduleCalendarView.js');
    const css = read(
      __dirname,
      '..',
      '..',
      '..',
      'admin',
      'mapping-management',
      'IntegratedMatchingSchedule.css'
    );
    expect(calendar).toMatch(/colorClassFor\(consultantId, consultants\)/);
    expect(calendar).toMatch(/mg-v2-ad-calendar-event__dot--/);
    expect(calendar).not.toMatch(/style=\{\{/);
    expect(css).toMatch(
      /\.mg-v2-ad-calendar-event__dot\s*\{[\s\S]*?background-color:\s*var\(--mg-consultant-color/
    );
    expect(css).toMatch(/border-inline-start:[^;]*var\(--mg-month-event-status-color\)/);
  });

  test('통합 월간 범례 건수는 보이는 일정 집계를 쓴다', () => {
    const unified = read(
      __dirname,
      '..',
      '..',
      '..',
      'schedule',
      'UnifiedScheduleComponent.js'
    );
    expect(unified).toMatch(/countVisibleConsultantScheduleEvents\(\s*filteredEvents/);
    expect(unified).toMatch(/CONSULTANT_COUNT_BASIS_SHOWN/);
  });
});
