/**
 * MyPage 이중역할(운영 · 상담) 크롬 — 공통 레이아웃 구성 잠금
 * 내 계정 카드 → 역할 지도(행 링크) → 목차, 버튼 h32 (--mg-v2-component-height-sm)
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

const fs = require('fs');
const path = require('path');

const read = (rel) =>
  fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

describe('MyPage dual-role chrome (MypageLayout)', () => {
  const myPageJs = read('src/components/mypage/MyPage.js');
  const layoutCss = read('src/components/mypage/layout/MypageLayout.css');
  const buttonCss = read('src/components/common/MGButton.css');
  const actionButtonJsx = read('src/components/mypage/layout/MypageActionButton.jsx');

  test('composition: QuietHeader(headerSlot) + AccountCard → RoleLinks → SectionIndex', () => {
    const account = myPageJs.indexOf('<MypageAccountCard');
    const links = myPageJs.indexOf('<MypageRoleLinks');
    const index = myPageJs.indexOf('<MypageSectionIndex');
    expect(myPageJs).toMatch(/headerSlot=\{<MypageQuietHeader \/>\}/);
    expect(account).toBeGreaterThan(-1);
    expect(links).toBeGreaterThan(account);
    expect(index).toBeGreaterThan(links);
  });

  test('역할 분기는 설정 객체(resolveMypageRoleLayout) 하나 — 역할별 JSX 분기 없음', () => {
    expect(myPageJs).toMatch(/resolveMypageRoleLayout\(displayUser\)/);
    expect(myPageJs).not.toMatch(/isOperatorCounselingDualRole\(displayUser\)\s*\?/);
    expect(myPageJs).not.toMatch(/<MypageIdentityBand|<MypageRoleMap|<MypageSummaryStrip|<SegmentedTabs/);
  });

  test('버튼은 MGButton size sm → h32 (--mg-v2-component-height-sm) · r8', () => {
    expect(actionButtonJsx).toMatch(/size="small"/);
    expect(buttonCss).toMatch(
      /\.mg-button\.mg-v2-button\.mg-button--small\s*\{[\s\S]*?height:\s*var\(--button-height-sm\)\s*!important/
    );
    expect(layoutCss).toMatch(/--mg-button-radius:\s*var\(--mg-v2-radius-lg\)/);
    expect(layoutCss).not.toMatch(/component-height-row|2\.25rem|36px/);
  });

  test('no v1 comparison-card approach introduced', () => {
    expect(myPageJs).not.toMatch(/role-compare-card|RoleCompareCard|비교 카드/);
    expect(layoutCss).not.toMatch(/role-map-card|role-compare/);
  });
});
