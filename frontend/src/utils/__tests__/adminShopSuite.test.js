import {
  adminShopBpsToPercent,
  adminShopPercentToBps,
  computeAdminShopRewardExample,
  countAdminShopProductSegments,
  filterAdminShopProducts
} from '../adminShopSuite';
import { ADMIN_SHOP_PRODUCT_SEGMENT } from '../../constants/adminShopSuite';

const products = [
  { code: 'A', name: '중지 상품', active: false },
  { code: 'B', name: '판매 상품 하나', active: true },
  { code: 'C', name: '판매 상품 둘' }
];

describe('adminShopSuite product segments', () => {
  test('counts all / on sale / stopped', () => {
    const counts = countAdminShopProductSegments(products);
    expect(counts[ADMIN_SHOP_PRODUCT_SEGMENT.ALL]).toBe(3);
    expect(counts[ADMIN_SHOP_PRODUCT_SEGMENT.ON_SALE]).toBe(2);
    expect(counts[ADMIN_SHOP_PRODUCT_SEGMENT.STOPPED]).toBe(1);
  });

  test('ALL keeps on-sale first with stable order, stopped last', () => {
    const codes = filterAdminShopProducts(products, { segment: ADMIN_SHOP_PRODUCT_SEGMENT.ALL })
      .map((p) => p.code);
    expect(codes).toEqual(['B', 'C', 'A']);
  });

  test('STOPPED segment and query filter', () => {
    expect(filterAdminShopProducts(products, { segment: ADMIN_SHOP_PRODUCT_SEGMENT.STOPPED })
      .map((p) => p.code)).toEqual(['A']);
    expect(filterAdminShopProducts(products, { query: '둘' }).map((p) => p.code)).toEqual(['C']);
  });
});

describe('adminShopSuite reward helpers', () => {
  test('percent and bps round-trip', () => {
    const bps = adminShopPercentToBps('2.5');
    expect(adminShopBpsToPercent(bps)).toBe('2.5');
    expect(adminShopPercentToBps('')).toBe(0);
    expect(adminShopPercentToBps('abc')).toBeNull();
  });

  test('example: no mix and no points-only blocks point use', () => {
    const r = computeAdminShopRewardExample({
      price: 1000, earnBps: 0, earnCap: 0, maxRedeem: 0,
      allowPgMix: false, allowPointsOnly: false, pointsUsed: 500
    });
    expect(r.limitBlocked).toBe(true);
    expect(r.used).toBe(0);
    expect(r.pay).toBe(1000);
  });

  test('example: earn cap applies on paid amount', () => {
    const r = computeAdminShopRewardExample({
      price: 1000, earnBps: adminShopPercentToBps('50'), earnCap: 100, maxRedeem: 200,
      allowPgMix: true, allowPointsOnly: false, pointsUsed: 500
    });
    expect(r.used).toBe(200);
    expect(r.pay).toBe(800);
    expect(r.earn).toBe(100);
    expect(r.capApplied).toBe(true);
  });
});
