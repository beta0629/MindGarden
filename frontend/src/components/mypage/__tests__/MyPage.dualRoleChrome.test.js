/**
 * MyPage Clinic-OS dual-role chrome — TO-BE v2 composition locks
 * Spec cite: clinic-os-mypage-dual.md / CLINIC_OS_MYPAGE_DUAL_TOBE_V2_HANDOFF.md
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

const fs = require('fs');
const path = require('path');

const read = (rel) =>
  fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

describe('MyPage Clinic-OS dual-role TO-BE v2 chrome', () => {
  const myPageJs = read('src/components/mypage/MyPage.js');
  const css = read('src/components/mypage/MyPageClinicOs.css');

  test('composition order: QuietHeader → IdentityBand → SummaryStrip → RoleMap', () => {
    const quiet = myPageJs.indexOf('<MypageQuietHeader');
    const identity = myPageJs.indexOf('<MypageIdentityBand');
    const strip = myPageJs.indexOf('<MypageSummaryStrip');
    const roleMap = myPageJs.indexOf('<MypageRoleMap');
    expect(quiet).toBeGreaterThan(-1);
    expect(identity).toBeGreaterThan(quiet);
    expect(strip).toBeGreaterThan(identity);
    expect(roleMap).toBeGreaterThan(strip);
  });

  test('identity band and role map gated by isOperatorCounselingDualRole', () => {
    expect(myPageJs).toMatch(
      /isOperatorCounselingDualRole\(displayUser\)\s*\?\s*\(\s*<MypageIdentityBand/
    );
    expect(myPageJs).toMatch(
      /isOperatorCounselingDualRole\(displayUser\)\s*\?\s*<MypageRoleMap/
    );
  });

  test('CTA row height token locked to 36px (2.25rem)', () => {
    expect(css).toMatch(/--mg-v2-component-height-row:\s*2\.25rem/);
    expect(css).toMatch(
      /\.mg-mypage-clinic-os__role-map-cta[\s\S]*height:\s*var\(--mg-v2-component-height-row/
    );
  });

  test('no v1 comparison-card approach introduced', () => {
    expect(myPageJs).not.toMatch(/role-compare-card|RoleCompareCard|비교 카드/);
    expect(css).not.toMatch(/role-map-card|role-compare/);
  });
});
