/**
 * 통합스케줄 월간·주간 상태 라벨 공유, 월간 컴팩트 배지 셀 안 맞춤.
 * 주간/일 풀 카드는 기관연계 배지를 __time 안 인라인으로 둔다.
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

/** 주간/일 return 블록(월간 compact 분기 이후)만 추출 */
const extractWeekDayRenderBlock = (source) => {
  const marker = '주간/일간 뷰: 풀 카드 유지';
  const start = source.indexOf(marker);
  if (start < 0) {
    return '';
  }
  const end = source.indexOf('};', start);
  return end < 0 ? source.slice(start) : source.slice(start, end);
};

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

  test('주간/일 렌더는 WeekDayScheduleEventChip(measure fit) 로 위임한다', () => {
    const source = fs.readFileSync(CALENDAR_JS, 'utf8');
    expect(source).toMatch(/import WeekDayScheduleEventChip from ['"]\.\/WeekDayScheduleEventChip['"]/);
    const weekDay = extractWeekDayRenderBlock(source);
    expect(weekDay.length).toBeGreaterThan(0);
    expect(weekDay).toMatch(/<WeekDayScheduleEventChip/);
    expect(weekDay).toMatch(/showInstitutionMark=\{showInstitutionMark\}/);
    expect(weekDay).toMatch(/statusModifier=\{statusModifier\}/);
    expect(weekDay).not.toMatch(/isWeekView\s*&&\s*isMobileViewport/);
    expect(weekDay).not.toMatch(/showEngagementBadgeOnChip/);
  });

  test('주/일 chip fit 은 뷰포트 배지 생략이 아니라 measure stage 를 쓴다', () => {
    const source = fs.readFileSync(CALENDAR_JS, 'utf8');
    expect(source).not.toMatch(/MEDIA_QUERIES\.MOBILE_ONLY/);
    expect(source).not.toMatch(/useMediaQuery\(\s*MEDIA_QUERIES\.MOBILE_ONLY\s*\)/);
    expect(source).not.toMatch(/isWeekView\s*&&\s*isMobileViewport/);
    const chipSrc = fs.readFileSync(
      path.resolve(__dirname, '..', 'WeekDayScheduleEventChip.js'),
      'utf8'
    );
    expect(chipSrc).toMatch(/useWeekDayChipFit/);
    expect(chipSrc).toMatch(/mg-v2-ad-calendar-event__engagement/);
    expect(chipSrc).toMatch(/EngagementTypeBadge/);
  });

  test('좁은 칩 wrap CSS 에 break-all / anywhere 가 없고 keep-all 이다', () => {
    const marksCss = fs.readFileSync(
      path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'admin',
        'mapping-management',
        'integrated-schedule',
        'molecules',
        'ScheduleEventMarks.css'
      ),
      'utf8'
    );
    expect(marksCss).not.toMatch(/word-break:\s*break-all/);
    expect(marksCss).not.toMatch(/overflow-wrap:\s*anywhere/);
    expect(marksCss).toMatch(/word-break:\s*keep-all/);
    expect(marksCss).not.toMatch(
      /:has\(>\s*\.mg-v2-ad-calendar-event__engagement\)\s*\{[^}]*padding-inline:\s*var\(--mg-v2-space-0-5\)/
    );
    // 주/일 직계 블록 wrap·음수 margin 금지
    expect(marksCss).not.toMatch(
      /\.mg-v2-ad-calendar-event:not\(\.mg-v2-ad-calendar-event--compact\)\s*>\s*\.mg-v2-ad-calendar-event__engagement\s*\{/
    );
    expect(marksCss).not.toMatch(/margin-inline:\s*calc\(/);
  });

  test('주/일 __time 인라인 배지·measure fit CSS 가 있다 (ellipsis·109px 토글 금지)', () => {
    const css = fs.readFileSync(CALENDAR_CSS, 'utf8');
    expect(css).toMatch(
      /\.mg-v2-ad-calendar-event:not\(\.mg-v2-ad-calendar-event--compact\)\s*>\s*\.mg-v2-ad-calendar-event__time\s*\{[^}]*display:\s*flex/
    );
    expect(css).toContain('mg-v2-ad-calendar-event--week-day-fit');
    expect(css).toMatch(/--week-day-fit[\s\S]*?text-overflow:\s*clip/);
    expect(css).not.toContain('@container mg-week-event (width < 109px)');
    expect(css).not.toContain('container: mg-week-event / inline-size');
    const marksCss = fs.readFileSync(
      path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'admin',
        'mapping-management',
        'integrated-schedule',
        'molecules',
        'ScheduleEventMarks.css'
      ),
      'utf8'
    );
    const inlineBadge = marksCss.match(
      /\.mg-v2-ad-calendar-event__time\s*>\s*\.mg-v2-ad-calendar-event__engagement[\s\S]*?\{[^}]*\}/
    );
    expect(inlineBadge).toBeTruthy();
    expect(inlineBadge[0]).toMatch(/flex-shrink:\s*0|flex:\s*none/);
    expect(inlineBadge[0]).toMatch(/white-space:\s*nowrap/);
    expect(inlineBadge[0]).toMatch(/font-size:\s*var\(--mg-font-size-2xs\)/);
    expect(inlineBadge[0]).toMatch(/overflow:\s*visible/);
    expect(inlineBadge[0]).not.toMatch(/height:\s*auto/);
    expect(inlineBadge[0]).not.toMatch(/margin-inline:\s*calc/);
  });
});
