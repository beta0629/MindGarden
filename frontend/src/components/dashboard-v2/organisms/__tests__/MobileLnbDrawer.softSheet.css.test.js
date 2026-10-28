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

  it('상담사 셸만 BREAKPOINT_CONSULTANT_DESKTOP(1024) + soft-sheet', () => {
    expect(menu).toMatch(/BREAKPOINT_CONSULTANT_DESKTOP\s*=\s*1024/);
    expect(layoutJs).toMatch(/BREAKPOINT_CONSULTANT_DESKTOP/);
    expect(layoutJs).toMatch(/drawerVariant:\s*'soft-sheet'/);
    expect(layoutJs).toMatch(/isCounselorOnly/);
  });
});
