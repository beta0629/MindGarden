/**
 * PurchaseManagement Clinic-OS chrome alignment — cascade / copy / structure locks
 *
 * @author CoreSolution
 * @since 2026-09-01
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('PurchaseManagement Clinic-OS chrome', () => {
  const purchaseJs = read('src/components/erp/PurchaseManagement.js');
  const purchaseCss = read('src/components/erp/PurchaseManagement.css');
  const purchaseStrings = read('src/constants/purchaseManagementStrings.js');
  const erpKo = read('src/locales/ko/erp.json');

  test('uses quiet header + summary strip (not ContentHeader subtitle chrome)', () => {
    expect(purchaseJs).toMatch(/import PurchaseQuietHeader from '\.\/purchase\/PurchaseQuietHeader'/);
    expect(purchaseJs).toMatch(/import PurchaseSummaryStrip from '\.\/purchase\/PurchaseSummaryStrip'/);
    expect(purchaseJs).not.toMatch(/ContentHeader/);
    expect(purchaseJs).not.toMatch(/ErpFilterToolbar/);
    expect(purchaseStrings).toMatch(/PM_PAGE_TITLE = '센터 경비'/);
  });

  test('uses TabChipRow (not erp-tab underline tabs) for in-page tabs', () => {
    expect(purchaseJs).toMatch(/import TabChipRow from '\.\.\/common\/TabChipRow'/);
    expect(purchaseJs).toMatch(/<TabChipRow[\s\S]*activeKey=\{activeTab\}/);
    expect(purchaseJs).not.toMatch(/erp-tab \$\{activeTab/);
    expect(purchaseJs).not.toMatch(/className=\{`[^`]*erp-tab/);
  });

  test('main stage uses Clinic-OS geometry (single stage card)', () => {
    expect(purchaseJs).toMatch(/purchase-management__stage/);
    expect(purchaseCss).toMatch(/\.purchase-management__stage\s*\{[^}]*min-height:\s*36rem/s);
    expect(purchaseCss).toMatch(/border:\s*0\.0625rem solid var\(--mg-v2-color-neutral-300\)/);
    expect(purchaseCss).toMatch(/background:\s*var\(--mg-v2-color-neutral-50\)/);
  });

  test('section titles and cards have no left accent bars', () => {
    expect(purchaseCss).toMatch(/border-left:\s*none\s*!important/);
    expect(purchaseJs).not.toMatch(/erp-section/);
    expect(purchaseJs).not.toMatch(/erp-card/);
  });

  test('money amounts use expense blue token in order/item price rows', () => {
    expect(purchaseCss).toMatch(
      /\.purchase-management__card-value--amount\s*\{[^}]*color:\s*var\(--mg-v2-color-semantic-info\)/s
    );
    expect(purchaseJs).toMatch(/purchase-management__card-value--amount/);
  });

  test('card footer buttons are not full-bleed', () => {
    expect(purchaseCss).toMatch(
      /\.purchase-management__card-footer[\s\S]*?width:\s*auto\s*!important/
    );
    expect(purchaseCss).toMatch(
      /\.purchase-management__card-footer[\s\S]*?height:\s*var\(--button-height-sm\)\s*!important/
    );
  });

  test('hub subnav scoped under purchase shell (does not require global ErpCommon erp-tab)', () => {
    expect(purchaseJs).toMatch(/className="purchase-management-shell"/);
    expect(purchaseCss).toMatch(/\.purchase-management-shell \.mg-v2-purchase-hub-tabs \.erp-tab\.active/);
    expect(purchaseCss).toMatch(/var\(--mg-v2-color-primary-solid/);
  });

  test('Korean page title is 센터 경비 in strings and i18n', () => {
    expect(erpKo).toMatch(/"t_cd94ff1e":\s*"센터 경비"/);
    expect(purchaseStrings).toMatch(/BODY: '센터 경비 기능을 사용하려면 로그인해주세요\.'/);
  });

  test('uses ErpEmptyState for empty lists (no emoji)', () => {
    expect(purchaseJs).toMatch(/ErpEmptyState/);
    expect(purchaseJs).toMatch(/PM_EMPTY\.ITEMS/);
  });
});
