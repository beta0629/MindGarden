/**
 * 상담사 Cover+Chapter — 메뉴 진입점 1개 (커버 햄버거 없음 · GNB만)
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..');
const LAYOUT_JS = path.join(__dirname, '../../../layout/AdminCommonLayout.js');

describe('consultant Cover+Chapter menu entry SSOT', () => {
  test('ConsultantHomeCover: menu-btn / ☰ / onMenuClick / GNB click 폴백 없음', () => {
    const source = fs.readFileSync(path.join(DIR, 'ConsultantHomeCover.js'), 'utf8');
    expect(source).not.toMatch(/menu-btn/);
    expect(source).not.toMatch(/☰/);
    expect(source).not.toMatch(/onMenuClick/);
    expect(source).not.toMatch(/mg-v2-mobile-gnb__menu/);
    expect(source).not.toMatch(/querySelector/);
  });

  test('ConsultantCoverChapterHome: onMenuClick prop 없음', () => {
    const source = fs.readFileSync(path.join(DIR, 'ConsultantCoverChapterHome.js'), 'utf8');
    expect(source).not.toMatch(/onMenuClick/);
    expect(source).not.toMatch(/menu-btn/);
  });

  test('AdminCommonLayout: 상담사는 항상 MobileLayout(isDesktop false), soft-sheet', () => {
    const source = fs.readFileSync(LAYOUT_JS, 'utf8');
    expect(source).toMatch(/drawerVariant:\s*'soft-sheet'/);
    expect(source).toMatch(/isCounselorOnly/);
    expect(source).toMatch(
      /const isDesktop = isCounselorOnly\s*\?\s*false\s*:\s*\(windowSize\.width >= BREAKPOINT_DESKTOP\)/
    );
    expect(source).not.toMatch(/BREAKPOINT_CONSULTANT_DESKTOP/);
    expect(source).not.toMatch(/MEDIA_QUERY_CONSULTANT_DESKTOP_FINE_POINTER/);
    expect(source).not.toMatch(/useMediaQuery/);
  });

  test('ConsultantCoverChapterHome.css: cover menu-btn 없음 · content-max · stage-max 금지', () => {
    const css = fs.readFileSync(path.join(DIR, 'ConsultantCoverChapterHome.css'), 'utf8');
    expect(css).not.toMatch(/consultant-cover-chapter__menu-btn/);
    expect(css).toContain('--cch-content-max: min(100%, calc(var(--mg-v2-space-20) * 16))');
    expect(css).not.toContain('--cch-stage-max');
    expect(css).toMatch(
      /\.mg-v2-mobile-layout--soft-sheet:has\(\.consultant-cover-chapter\)[^{]*\.mg-v2-mobile-layout__stage\s*\{[^}]*max-width:\s*none/s
    );
  });

  test('ConsultantHomeCover: 커버 brand 칩 렌더 없음', () => {
    const cover = fs.readFileSync(path.join(DIR, 'ConsultantHomeCover.js'), 'utf8');
    expect(cover).not.toMatch(/consultant-cover-chapter__brand/);
  });
});
