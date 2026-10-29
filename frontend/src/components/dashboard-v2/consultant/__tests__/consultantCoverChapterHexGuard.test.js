/**
 * Cover+Chapter CSS/SVG — hex 리터럴 금지 (clinic-os SSOT)
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

const fs = require('fs');
const path = require('path');

const HEX_LITERAL = /#[0-9A-Fa-f]{3,8}\b/;
const CS_SLATE_DIRECT = /--cs-slate-/;

const DIR = path.join(__dirname, '..');
const FILES = [
  'ConsultantCoverChapterHome.css',
  'ConsultantHomeCover.js',
  'ConsultantHomeNextSheet.js',
  'ConsultantCoverChapterHome.js'
];

const COVER_SVG_PATH = path.join(
  __dirname,
  '../../../client/clientDashboard/coverChapter/CoverClinicSvg.js'
);

describe('consultant Cover+Chapter hex SSOT guard', () => {
  test.each(FILES)('%s has no hex color literals', (fileName) => {
    const source = fs.readFileSync(path.join(DIR, fileName), 'utf8');
    const matches = source.match(HEX_LITERAL) || [];
    expect(matches).toEqual([]);
  });

  test('CoverClinicSvg.js has no hex color literals', () => {
    const source = fs.readFileSync(COVER_SVG_PATH, 'utf8');
    expect(source.match(HEX_LITERAL) || []).toEqual([]);
  });

  test('ConsultantCoverChapterHome.css does not reference --cs-slate-* directly', () => {
    const source = fs.readFileSync(
      path.join(DIR, 'ConsultantCoverChapterHome.css'),
      'utf8'
    );
    expect(source).not.toMatch(CS_SLATE_DIRECT);
  });

  test('ConsultantCoverChapterHome.css color aliases resolve via --mg-v2-*', () => {
    const source = fs.readFileSync(
      path.join(DIR, 'ConsultantCoverChapterHome.css'),
      'utf8'
    );
    expect(source).toContain('--cch-ink: var(--mg-v2-color-neutral-900)');
    expect(source).toContain('--cch-line: var(--mg-v2-border-card)');
    expect(source).toContain('--cch-font: var(--mg-v2-font-family-base)');
    expect(source).toContain('-webkit-line-clamp: 2');
    expect(source).toMatch(
      /\.consultant-cover-chapter__chapters\s*\{[^}]*flex-direction:\s*column/s
    );
  });

  test('cover min-height uses mg-v2 spacing tokens (no raw 280px/360px/400px)', () => {
    const source = fs.readFileSync(
      path.join(DIR, 'ConsultantCoverChapterHome.css'),
      'utf8'
    );
    expect(source).toContain('--cch-cover-min-h: calc(var(--mg-v2-space-20) * 3.5)');
    expect(source).toContain('--cch-cover-min-h-tablet: calc(var(--mg-v2-space-20) * 4.5)');
    expect(source).toContain('--cch-cover-min-h-tablet-lg: calc(var(--mg-v2-space-20) * 5)');
    expect(source).toContain('--cch-cover-stack-ratio: 42%');
    expect(source).toContain('--cch-content-max: calc(var(--mg-v2-space-20) * 14)');
    expect(source).not.toMatch(/min-height:\s*280px/);
    expect(source).not.toMatch(/min-height:\s*360px/);
    expect(source).not.toMatch(/min-height:\s*400px/);
  });

  test('layout CSS: stack portrait 1-col; desktop ≥1280 stack 2-col; no hover MQ', () => {
    const source = fs.readFileSync(
      path.join(DIR, 'ConsultantCoverChapterHome.css'),
      'utf8'
    );
    expect(source).toMatch(/data-layout='stack'/);
    expect(source).toMatch(/data-layout='split'/);
    expect(source).toMatch(
      /\.consultant-cover-chapter\[data-layout='stack'\]\s*\{[^}]*flex-direction:\s*column/s
    );
    expect(source).toMatch(
      /\[data-layout='stack'\][^{]*\.consultant-cover-chapter__cover\s*\{[^}]*width:\s*100%/s
    );
    // 768–1279 stack: chapters remain flex column (not 2-col grid)
    expect(source).toMatch(
      /@media\s*\(min-width:\s*768px\)[\s\S]*?\[data-layout='stack'\][^{]*\.consultant-cover-chapter__chapters\s*\{[^}]*flex-direction:\s*column/s
    );
    // 2-col grid only at ≥1280 stack
    expect(source).toMatch(
      /@media\s*\(min-width:\s*1280px\)[\s\S]*?\[data-layout='stack'\][^{]*\.consultant-cover-chapter__chapters\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.25fr\)\s*minmax\(0,\s*0\.85fr\)/s
    );
    // Must not force 2-col under 768 or 1024 alone without 1280 gate
    expect(source).not.toMatch(
      /@media\s*\(min-width:\s*768px\)\s*\{[^}]*\[data-layout='stack'\][^{]*\.consultant-cover-chapter__chapters\s*\{[^}]*grid-template-columns/s
    );
    expect(source).toMatch(
      /\.consultant-cover-chapter__meta\s*\{[^}]*position:\s*relative/s
    );
    expect(source).toMatch(
      /\.consultant-cover-chapter__meta\s*\{[^}]*flex:\s*0\s+0\s+auto/s
    );
    expect(source).toMatch(
      /\.consultant-cover-chapter__meta\s*\{[^}]*padding-top:\s*var\(--mg-v2-space-3\)/s
    );
    expect(source).toMatch(
      /\.consultant-cover-chapter__cover-top\s*\{[^}]*justify-content:\s*flex-end/s
    );
    expect(source).not.toMatch(/consultant-cover-chapter__menu-btn/);
    // hover/pointer 는 JS MQ 전용 — CSS full-span에 쓰지 않음
    expect(source).not.toMatch(
      /@media\s*\([^)]*hover:\s*hover[^)]*pointer:\s*fine/
    );
    expect(source).not.toMatch(
      /@media\s*\([^)]*pointer:\s*fine[^)]*hover:\s*hover/
    );
    // bare 1024 row on root (fake LNB) 금지 — split 게이트만
    expect(source).not.toMatch(
      /@media\s*\(min-width:\s*1024px\)\s*\{\s*\.consultant-cover-chapter\s*\{\s*flex-direction:\s*row/
    );
  });

  test('Cover uses CoverClinicSvg landscape/portrait; no cover hamburger', () => {
    const cover = fs.readFileSync(path.join(DIR, 'ConsultantHomeCover.js'), 'utf8');
    const home = fs.readFileSync(path.join(DIR, 'ConsultantCoverChapterHome.js'), 'utf8');
    const svg = fs.readFileSync(COVER_SVG_PATH, 'utf8');

    expect(cover).toContain('CoverClinicSvg');
    expect(cover).not.toMatch(/menu-btn/);
    expect(cover).not.toMatch(/onMenuClick/);
    expect(cover).not.toMatch(/querySelector/);
    expect(home).not.toMatch(/onMenuClick/);
    expect(home).toContain('COVER_CHAPTER_SVG_VARIANT_LANDSCAPE');
    expect(home).toContain('COVER_CHAPTER_SVG_VARIANT_PORTRAIT');
    expect(svg).toContain('viewBox="0 0 540 800"');
    expect(svg).toContain('viewBox="0 0 820 480"');
    expect(svg).toContain('var(--mg-v2-color-accent-light)');
    expect(svg).toContain('var(--mg-v2-color-neutral-700)');
  });
});
