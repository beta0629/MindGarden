/**
 * Merchant legal settings Clinic-OS chrome + menu neighbor to PG 설정
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('MerchantLegalSettings Clinic-OS', () => {
  const pageJs = read('src/components/tenant/MerchantLegalSettings.js');
  const pageCss = read('src/components/tenant/MerchantLegalSettings.css');
  const menuJs = read('src/components/dashboard-v2/constants/menuItems.js');
  const appJs = read('src/App.js');

  test('min 7 fields present', () => {
    expect(pageJs).toMatch(/businessRegistrationNumber/);
    expect(pageJs).toMatch(/representativeName/);
    expect(pageJs).toMatch(/businessLandline/);
    expect(pageJs).toMatch(/businessAddress/);
    expect(pageJs).toMatch(/mailOrderReportNumber/);
    expect(pageJs).toMatch(/refundPolicyText/);
    expect(pageJs).toMatch(/productPriceGuideText/);
  });

  test('strip3 + live public preview rail', () => {
    expect(pageJs).toMatch(/merchant-legal-settings-summary/);
    expect(pageJs).toMatch(/merchant-legal-preview-rail/);
    expect(pageJs).toMatch(/공개 미리보기/);
  });

  test('save CTA teal token, no MindGarden hardcode', () => {
    expect(pageCss).toMatch(/--ml-teal:\s*var\(--cs-teal-700\)/);
    expect(pageCss).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(pageJs).not.toMatch(/MindGarden/);
    expect(pageJs).toMatch(/온보딩에서 입력한 값/);
  });

  test('biz-number error UI', () => {
    expect(pageJs).toMatch(/BUSINESS_REGISTRATION_INVALID_MESSAGE/);
    expect(pageJs).toMatch(/merchant-legal-settings__field-error/);
  });

  test('route and LNB neighbor to PG 설정', () => {
    expect(appJs).toMatch(/path="\/tenant\/merchant-legal"/);
    expect(menuJs).toMatch(/사업자·약관/);
    expect(menuJs).toMatch(/\/tenant\/merchant-legal/);
    const settingsBlock = menuJs.slice(
      menuJs.indexOf("label: '시스템·설정'"),
      menuJs.indexOf("label: '시스템·설정'") + 900
    );
    expect(settingsBlock.indexOf('사업자·약관')).toBeLessThan(settingsBlock.indexOf('PG 설정'));
  });
});
