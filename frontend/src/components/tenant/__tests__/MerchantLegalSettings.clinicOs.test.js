/**
 * Merchant legal settings Clinic-OS chrome + menu neighbor to 결제 연결
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
    expect(pageJs).toMatch(/BUSINESS_REGISTRATION_SAVE_BLOCKED_MESSAGE/);
    expect(pageJs).toMatch(/merchant-legal-settings__field-error/);
    expect(pageJs).toMatch(/focusBizNumberField/);
    expect(pageJs).toMatch(/scrollIntoView/);
    expect(pageJs).toMatch(/aria-describedby/);
    expect(pageJs).toMatch(/resolveBizSaveErrorMessage/);
  });

  test('route and LNB neighbor to 결제 연결', () => {
    expect(appJs).toMatch(/path="\/tenant\/merchant-legal"/);
    expect(menuJs).toMatch(/사업자·약관/);
    expect(menuJs).toMatch(/\/tenant\/merchant-legal/);
    const settingsBlock = menuJs.slice(
      menuJs.indexOf("label: '시스템·설정'"),
      menuJs.indexOf("label: '시스템·설정'") + 900
    );
    expect(settingsBlock.indexOf('사업자·약관')).toBeLessThan(settingsBlock.indexOf('결제 연결'));
  });

  test('platform terms/privacy notice + public legal links, no terms/privacy editors', () => {
    expect(pageJs).toMatch(/이용약관·개인정보처리방침은 플랫폼 공통 · 편집 불가/);
    expect(pageJs).toMatch(/LEGAL_PUBLIC_PATHS\.TERMS/);
    expect(pageJs).toMatch(/LEGAL_PUBLIC_PATHS\.PRIVACY/);
    expect(pageJs).not.toMatch(/termsOfServiceText|privacyPolicyText|onChange\('terms/);
    expect(appJs).toMatch(/path="\/legal\/terms"/);
    expect(appJs).toMatch(/path="\/legal\/privacy"/);
    expect(appJs).toMatch(/path="\/legal\/products"/);
  });

  test('operator placeholders have no jargon tokens', () => {
    expect(pageJs).not.toMatch(/placeholder="[^"]*\[분\]/);
    expect(pageJs).not.toMatch(/하드코딩/);
    expect(pageJs).toMatch(/상품 구성과 가격 안내를 입력하세요/);
    expect(pageJs).toMatch(/환불·취소·청약철회 안내를 입력하세요/);
    expect(pageJs).toMatch(/sanitizeMerchantLegalGuideText/);
  });

  test('textarea CSS avoids clipping with clinic-os specificity', () => {
    expect(pageCss).toMatch(
      /\.merchant-legal-settings--clinic-os\s+\.merchant-legal-settings__field textarea/
    );
    expect(pageCss).toMatch(/line-height:\s*var\(--ml-textarea-line-height\)/);
    expect(pageCss).toMatch(/min-height:\s*var\(--ml-textarea-min-height\)/);
    expect(pageCss).toMatch(/box-sizing:\s*border-box/);
    expect(pageCss).toMatch(/overflow-y:\s*auto/);
    expect(pageCss).toMatch(/overflow:\s*visible/);
    expect(pageJs).toMatch(/rows=\{TEXTAREA_ROWS\}|rows=\{6\}|TEXTAREA_ROWS\s*=\s*6/);
    expect(pageJs).not.toMatch(/1회기 시간:\s*\[분\]\s*분/);
  });

  test('save payload keeps productPriceGuideText and uses nullish coalescing for guides', () => {
    expect(pageJs).toMatch(/productPriceGuideText:\s*sanitizedForm\.productPriceGuideText/);
    expect(pageJs).toMatch(/data\?\.productPriceGuideText\s*\?\?/);
    expect(pageJs).toMatch(/data\?\.refundPolicyText\s*\?\?/);
    expect(pageJs).toMatch(/결제 연결/);
    expect(pageJs).not.toMatch(/PG 설정/);
  });
});
