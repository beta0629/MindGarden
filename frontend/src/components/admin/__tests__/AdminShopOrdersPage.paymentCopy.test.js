/**
 * AdminShopOrdersPage — cashDue 를 결제수단「현금」으로 오표기하지 않음
 */
import fs from 'fs';
import path from 'path';

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'AdminShopOrdersPage.js'),
  'utf8'
);

const API_CONSTANTS = fs.readFileSync(
  path.join(__dirname, '../../../constants/adminShopApi.js'),
  'utf8'
);

describe('AdminShopOrdersPage payment copy (Path B PortOne)', () => {
  test('cashDue 표시는 실결제 라벨 — 「현금」을 결제수단처럼 쓰지 않음', () => {
    expect(SOURCE).toMatch(/ADMIN_SHOP_ORDER_CASH_DUE_LABEL/);
    expect(SOURCE).toMatch(/ADMIN_SHOP_ORDER_POINTS_LABEL/);
    expect(SOURCE).not.toMatch(/`현금 \$\{/);
    expect(SOURCE).not.toMatch(/현금 \$\{cash/);
    expect(SOURCE).not.toMatch(/· 현금 /);
  });

  test('constants: CASH_DUE_LABEL is 실결제 (not 현금)', () => {
    expect(API_CONSTANTS).toMatch(/ADMIN_SHOP_ORDER_CASH_DUE_LABEL\s*=\s*'실결제'/);
    expect(API_CONSTANTS).not.toMatch(/ADMIN_SHOP_ORDER_CASH_DUE_LABEL\s*=\s*'현금'/);
  });
});
