/**
 * 상담사 태블릿 stone soft-sheet 드로어 CSS 계약
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

  it('상담사 셸만 BREAKPOINT_CONSULTANT_DESKTOP(1280) + fine-pointer MQ + soft-sheet', () => {
    expect(menu).toMatch(/BREAKPOINT_CONSULTANT_DESKTOP\s*=\s*1280/);
    expect(menu).toMatch(
      /MEDIA_QUERY_CONSULTANT_DESKTOP_FINE_POINTER\s*=\s*'\(hover: hover\) and \(pointer: fine\)'/
    );
    expect(layoutJs).toMatch(/BREAKPOINT_CONSULTANT_DESKTOP/);
    expect(layoutJs).toMatch(/MEDIA_QUERY_CONSULTANT_DESKTOP_FINE_POINTER/);
    expect(layoutJs).toMatch(/useMediaQuery/);
    expect(layoutJs).toMatch(/drawerVariant:\s*'soft-sheet'/);
    expect(layoutJs).toMatch(/isCounselorOnly/);
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
