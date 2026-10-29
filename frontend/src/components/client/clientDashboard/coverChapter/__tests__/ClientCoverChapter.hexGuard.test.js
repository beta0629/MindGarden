/**
 * 내담자 Cover+Chapter — hex SSOT · 세로 1열 · stage max · 메뉴 1개
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
  'ClientCoverChapter.css',
  'ClientCoverChapterHome.js',
  'CoverPanel.js',
  'CoverClinicSvg.js',
  'NextSheet.js',
  'CoverMenuDrawer.js'
];

describe('client Cover+Chapter hex / layout SSOT guard', () => {
  test.each(FILES)('%s has no hex color literals', (fileName) => {
    const source = fs.readFileSync(path.join(DIR, fileName), 'utf8');
    expect(source.match(HEX_LITERAL) || []).toEqual([]);
  });

  test('ClientCoverChapter.css does not reference --cs-slate-*', () => {
    const css = fs.readFileSync(path.join(DIR, 'ClientCoverChapter.css'), 'utf8');
    expect(css).not.toMatch(CS_SLATE_DIRECT);
  });

  test('content/stage max tokens · portrait 1-col · split≥64rem 2-col at 80rem', () => {
    const css = fs.readFileSync(path.join(DIR, 'ClientCoverChapter.css'), 'utf8');
    expect(css).toContain('--client-cover-content-max: calc(var(--mg-v2-space-20) * 14)');
    expect(css).toContain('--client-cover-stage-max: calc(var(--mg-v2-space-20) * 17.5)');
    expect(css).toMatch(
      /@media\s*\(min-width:\s*64rem\)[\s\S]*?max-width:\s*var\(--client-cover-stage-max\)/s
    );
    // portrait tablet: 1-col flex (not 2-col grid)
    expect(css).toMatch(
      /@media\s*\(min-width:\s*48rem\)\s*and\s*\(max-width:\s*63\.9375rem\)\s*and\s*\(orientation:\s*portrait\)[\s\S]*?\.client-cover__chapters\s*\{[^}]*flex-direction:\s*column/s
    );
    expect(css).not.toMatch(
      /@media\s*\(min-width:\s*48rem\)\s*and\s*\(orientation:\s*portrait\)[\s\S]*?\.client-cover__chapters\s*\{[^}]*grid-template-columns:\s*1\.25fr/s
    );
    // wide desktop 2-col
    expect(css).toMatch(
      /@media\s*\(min-width:\s*80rem\)[\s\S]*?\.client-cover__chapters\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.25fr\)\s*minmax\(0,\s*0\.85fr\)/s
    );
  });

  test('CoverPanel passes CoverClinicSvg variant; cover menu-btn is sole entry', () => {
    const panel = fs.readFileSync(path.join(DIR, 'CoverPanel.js'), 'utf8');
    const home = fs.readFileSync(path.join(DIR, 'ClientCoverChapterHome.js'), 'utf8');
    expect(panel).toContain('CoverClinicSvg');
    expect(panel).toContain('variant={svgVariant}');
    expect(panel).toContain('client-cover__menu-btn');
    expect(home).toContain('COVER_CLINIC_SVG_VARIANT_PORTRAIT');
    expect(home).toContain('COVER_CLINIC_SVG_VARIANT_LANDSCAPE');
    expect(home).toContain("CLIENT_COVER_SPLIT_MQ = '(min-width: 64rem)'");
    expect(home).toContain("data-layout={isSplitLayout ? 'split' : 'stack'}");
  });
});
