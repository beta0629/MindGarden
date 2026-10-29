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

const FILES = [
  'ConsultantCoverChapterHome.css',
  'ConsultantHomeCover.js'
];

describe('consultant Cover+Chapter hex SSOT guard', () => {
  test.each(FILES)('%s has no hex color literals', (fileName) => {
    const source = fs.readFileSync(path.join(__dirname, '..', fileName), 'utf8');
    const matches = source.match(HEX_LITERAL) || [];
    expect(matches).toEqual([]);
  });

  test('ConsultantCoverChapterHome.css does not reference --cs-slate-* directly', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'ConsultantCoverChapterHome.css'),
      'utf8'
    );
    expect(source).not.toMatch(CS_SLATE_DIRECT);
  });

  test('ConsultantCoverChapterHome.css color aliases resolve via --mg-v2-*', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'ConsultantCoverChapterHome.css'),
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
      path.join(__dirname, '..', 'ConsultantCoverChapterHome.css'),
      'utf8'
    );
    expect(source).toContain('--cch-cover-min-h: calc(var(--mg-v2-space-20) * 3.5)');
    expect(source).toContain('--cch-cover-min-h-tablet: calc(var(--mg-v2-space-20) * 4.5)');
    expect(source).toContain('--cch-cover-min-h-tablet-lg: calc(var(--mg-v2-space-20) * 5)');
    expect(source).not.toMatch(/min-height:\s*280px/);
    expect(source).not.toMatch(/min-height:\s*360px/);
    expect(source).not.toMatch(/min-height:\s*400px/);
  });

  test('desktop fine-pointer forces full-span stack; split only via data-layout', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'ConsultantCoverChapterHome.css'),
      'utf8'
    );
    expect(source).toMatch(/data-layout='split'/);
    expect(source).toMatch(
      /@media\s*\(min-width:\s*1280px\)\s*and\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/
    );
    expect(source).toMatch(
      /\.consultant-cover-chapter__meta\s*\{[^}]*position:\s*relative/s
    );
    // bare 1024 row on root (fake LNB) 금지 — split 게이트만
    expect(source).not.toMatch(
      /@media\s*\(min-width:\s*1024px\)\s*\{\s*\.consultant-cover-chapter\s*\{\s*flex-direction:\s*row/
    );
  });
});
