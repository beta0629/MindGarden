/**
 * 통합스케줄 월간·주간 상태 라벨 공유, 월간 컴팩트 배지 셀 안 맞춤.
 */
import fs from 'fs';
import path from 'path';

const CALENDAR_JS = path.resolve(__dirname, '..', 'ScheduleCalendarView.js');
const CALENDAR_CSS = path.resolve(__dirname, '..', 'ScheduleCalendarView.css');
const COMPACT_ROW_CSS = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'admin',
  'mapping-management',
  'integrated-schedule',
  'molecules',
  'MatchingScheduleCompactRow.css'
);

describe('통합스케줄 월간·주간 상태와 컴팩트 배지', () => {
  test('월간 툴팁과 주간 상태 칸이 같은 statusLabel 을 쓴다', () => {
    const source = fs.readFileSync(CALENDAR_JS, 'utf8');
    expect(source.match(/resolveScheduleStatusDisplayLabel\(/g)).toHaveLength(1);
    expect(source).toContain('· ${statusLabel}');
    expect(source).toContain('{statusLabel}');
    expect(source).not.toMatch(/status\s*===\s*'COMPLETED'/);
  });

  test('월간 컴팩트 배지는 패딩만 남기지 않고 줄어들지 않는다', () => {
    const css = fs.readFileSync(CALENDAR_CSS, 'utf8');
    const compact = css.match(/\.mg-v2-ad-calendar-event--compact\s*\{[^}]*width:\s*100%;[^}]*\}/);
    expect(compact).toBeTruthy();
    expect(compact[0]).toContain('min-width: 0');
    expect(compact[0]).toContain('overflow: hidden');
    const badge = css.match(
      /\.mg-v2-ad-calendar-event--compact \.mg-v2-ad-calendar-event__engagement\s*\{[^}]+\}/
    );
    expect(badge).toBeTruthy();
    expect(badge[0]).toContain('flex: none');
    expect(badge[0]).not.toContain('min-width: 0');
    expect(badge[0]).not.toContain('text-overflow: ellipsis');
    expect(css).not.toMatch(/translateY\(-1px\)/);
  });

  test('사이드바 컴팩트 행의 기관연계 배지는 줄어들지 않는다', () => {
    const css = fs.readFileSync(COMPACT_ROW_CSS, 'utf8');
    expect(css).toContain('container: mg-compact-row / inline-size');
    const badge = css.match(
      /\.integrated-schedule__compact-row-secondary \.mg-engagement-type-badge[\s\S]*?\{[^}]+\}/
    );
    expect(badge).toBeTruthy();
    expect(badge[0]).toContain('flex: none');
    expect(badge[0]).not.toContain('min-width: 0');
    expect(badge[0]).not.toContain('text-overflow: ellipsis');
  });
});
