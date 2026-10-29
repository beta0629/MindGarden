/**
 * 상담사 soft-sheet 드로어 CSS 계약
 */
import fs from 'fs';
import path from 'path';

const SRC_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(SRC_ROOT, rel), 'utf8');

describe('MobileLnbDrawer soft-sheet', () => {
  const css = read('components/dashboard-v2/organisms/MobileLnbDrawer.css');
  const js = read('components/dashboard-v2/organisms/MobileLnbDrawer.js');
  const layoutJs = read('components/layout/AdminCommonLayout.js');
  const menu = read('components/dashboard-v2/constants/menuItems.js');

  it('soft-sheet는 stone 토큰 배경·활성 primary-solid만 쓴다(신규 hex 없음)', () => {
    expect(css).toMatch(/\.mg-v2-mobile-lnb-drawer--soft-sheet\s*\{[^}]*surface-stone/);
    expect(css).toMatch(/--mg-v2-color-primary-solid/);
    expect(css).not.toMatch(/\.mg-v2-mobile-lnb-drawer--soft-sheet[^}]*#[0-9a-fA-F]{3,8}/);
  });

  it('Escape 닫기·close 버튼·variant prop이 있다', () => {
    expect(js).toMatch(/Escape/);
    expect(js).toMatch(/mg-v2-mobile-lnb-drawer__close/);
    expect(js).toMatch(/variant === 'soft-sheet'/);
  });

  it('상담사 셸: 전 폭 MobileLayout + soft-sheet (Desktop LNB 게이트 폐기)', () => {
    expect(menu).toMatch(/BREAKPOINT_CONSULTANT_DESKTOP\s*=\s*1280/);
    expect(layoutJs).toMatch(/drawerVariant:\s*'soft-sheet'/);
    expect(layoutJs).toMatch(/isCounselorOnly/);
    expect(layoutJs).toMatch(
      /const isDesktop = isCounselorOnly\s*\?\s*false\s*:\s*\(windowSize\.width >= BREAKPOINT_DESKTOP\)/
    );
    expect(layoutJs).not.toMatch(/BREAKPOINT_CONSULTANT_DESKTOP/);
    expect(layoutJs).not.toMatch(/MEDIA_QUERY_CONSULTANT_DESKTOP_FINE_POINTER/);
  });

  it('soft-sheet 폭은 mg-v2 space 토큰 · ≥1280에서 더 얇음 (다크 드로어 비대상)', () => {
    expect(css).toMatch(
      /\.mg-v2-mobile-lnb-drawer--soft-sheet\s*\{[^}]*width:\s*calc\(var\(--mg-v2-space-20\)\s*\*\s*3\.5\)/s
    );
    expect(css).toMatch(
      /@media\s*\(min-width:\s*1280px\)[\s\S]*?\.mg-v2-mobile-lnb-drawer--soft-sheet\s*\{[^}]*width:\s*calc\(var\(--mg-v2-space-20\)\s*\*\s*3\)/s
    );
    // 기본 다크 드로어 width 규칙은 soft-sheet 블록 밖에서 유지
    expect(css).toMatch(
      /\.mg-v2-mobile-lnb-drawer\s*\{[^}]*width:\s*var\(--mg-layout-sidebar-width-mobile/s
    );
  });

  it('overlay 게이트: drawer/overlay position:fixed · closed translateX(-100%)', () => {
    expect(css).toMatch(/\.mg-v2-mobile-lnb-overlay\s*\{[^}]*position:\s*fixed/);
    expect(css).toMatch(/\.mg-v2-mobile-lnb-drawer\s*\{[^}]*position:\s*fixed/);
    expect(css).toMatch(/transform:\s*translateX\(-100%\)/);
    const mobileLayoutCss = read('components/dashboard-v2/templates/MobileLayout.css');
    expect(mobileLayoutCss).toMatch(
      /\.mg-v2-mobile-layout--soft-sheet[\s\S]*margin-left:\s*0/
    );
    expect(mobileLayoutCss).not.toMatch(/--drawer-open|drawer-open.*width:\s*calc/);
  });
});
