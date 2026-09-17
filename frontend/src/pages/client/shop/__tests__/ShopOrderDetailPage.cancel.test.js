/**
 * ShopOrderDetailPage — 미결제 취소 UI 스모크
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import fs from 'fs';
import path from 'path';

const pagePath = path.join(__dirname, '..', 'ShopOrderDetailPage.js');
const source = fs.readFileSync(pagePath, 'utf8');

describe('ShopOrderDetailPage source', () => {
  test('cancelShopOrder와 UnifiedModal 취소를 포함한다', () => {
    expect(source).toMatch(/cancelShopOrder/);
    expect(source).toMatch(/UnifiedModal/);
    expect(source).toMatch(/주문 취소/);
  });
});
