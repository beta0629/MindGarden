/**
 * ScheduleCalendarView — nowIndicator CSS 토큰 계약
 */

import fs from 'fs';
import path from 'path';

const CSS_PATH = path.resolve(__dirname, '..', 'ScheduleCalendarView.css');
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

describe('ScheduleCalendarView nowIndicator tokens', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  const tokens = fs.readFileSync(TOKEN_PATH, 'utf8');

  test('지금선·오늘 열 토큰이 design-v2에 정의된다', () => {
    expect(tokens).toMatch(/--mg-v2-now-line-color:/);
    expect(tokens).toMatch(/--mg-v2-now-line-width:/);
    expect(tokens).toMatch(/--mg-v2-now-line-dot-size:/);
    expect(tokens).toMatch(/--mg-v2-today-col-bg:/);
    expect(tokens).toMatch(/--mg-v2-z-now-line:/);
  });

  test('CSS가 토큰만 쓰고 지금선에 teal hex가 없다', () => {
    expect(css).toMatch(/fc-timegrid-now-indicator-line/);
    expect(css).toMatch(/border-top:\s*var\(--mg-v2-now-line-width\)\s+solid\s+var\(--mg-v2-now-line-color\)/);
    expect(css).toMatch(/pointer-events:\s*none/);
    expect(css).toMatch(/fc-timegrid-now-indicator-arrow[^{]*\{[^}]*display:\s*none/s);
    expect(css).toMatch(/\.fc-day-today\s*\{[^}]*background-color:\s*var\(--mg-v2-today-col-bg\)/s);
    expect(css).not.toMatch(/#0[Ee]5[Ff]5[Aa]/);
    expect(css).not.toMatch(/#14[Bb]8[Aa]6/);
  });
});
