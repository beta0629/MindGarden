/**
 * ShopCheckoutPage — 체크아웃 사업자·약관 푸터 (MerchantLegalFooterPreview) 마운트 계약
 *
 * @author CoreSolution
 * @since 2026-10-28
 */

const fs = require('fs');
const path = require('path');

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'ShopCheckoutPage.js'),
  'utf8'
);

describe('ShopCheckoutPage merchant legal footer', () => {
  test('imports MerchantLegalFooterPreview and fetchTenantPublicHomeMeta', () => {
    expect(SOURCE).toMatch(/import MerchantLegalFooterPreview from ['"].*MerchantLegalFooterPreview['"]/);
    expect(SOURCE).toMatch(/import \{ fetchTenantPublicHomeMeta \} from ['"].*tenantPublicHomeMeta['"]/);
  });

  test('mounts compact MerchantLegalFooterPreview with API-loaded legal (no hardcoded 신고번호)', () => {
    expect(SOURCE).toMatch(/<MerchantLegalFooterPreview/);
    expect(SOURCE).toMatch(/compact/);
    expect(SOURCE).toMatch(/showAccountLinks=\{false\}/);
    expect(SOURCE).toMatch(/fetchTenantPublicHomeMeta\(\)/);
    expect(SOURCE).toMatch(/meta\?\.tenant\?\.merchantLegal/);
    expect(SOURCE).toMatch(/data-testid="checkout-merchant-legal-footer"/);
    expect(SOURCE).not.toMatch(/제\d{4}-서울-\d+호/);
    expect(SOURCE).not.toMatch(/mailOrderReportNumber:\s*['"][^'"]+['"]/);
  });
});
