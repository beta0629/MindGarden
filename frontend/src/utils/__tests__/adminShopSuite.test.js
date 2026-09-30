import {
  ADMIN_SHOP_PRODUCT_KIND,
  ADMIN_SHOP_SESSION_DELTA_KIND,
  addDaysToAdminShopIsoDate,
  addMonthsToAdminShopIsoDate,
  adminShopBpsToPercent,
  adminShopPercentToBps,
  buildAdminShopOrderLedgerItem,
  computeAdminShopRewardExample,
  countAdminShopProductSegments,
  diffAdminShopIsoDays,
  filterAdminShopProducts,
  formatAdminShopDate,
  formatAdminShopShortDate,
  mapAdminShopServerProduct,
  normalizeAdminShopOrderSummary,
  resolveAdminShopExtendBaseDate,
  resolveAdminShopLedgerState,
  resolveAdminShopOrderPeriodRange,
  summarizeAdminShopOrders,
  validateAdminShopProductForm
} from '../adminShopSuite';
import {
  ADMIN_SHOP_LEDGER_STATE,
  ADMIN_SHOP_ORDER_PERIOD,
  ADMIN_SHOP_PRODUCT_SEGMENT
} from '../../constants/adminShopSuite';
import { buildAdminShopOrderTimeline } from '../../components/admin/shop/AdminShopOrderDetailModal';

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

describe('adminShopSuite order ledger — expiry (read-time)', () => {
  test('PAID + expiryState maps to 만료 임박 / 기한 만료; timed-out orders are UNPAID', () => {
    expect(resolveAdminShopLedgerState({ status: 'PAID', expiryState: 'EXPIRING_SOON' }, null))
      .toBe(ADMIN_SHOP_LEDGER_STATE.EXPIRING_SOON);
    expect(resolveAdminShopLedgerState({ status: 'PAID', expiryState: 'EXPIRED' }, null))
      .toBe(ADMIN_SHOP_LEDGER_STATE.EXPIRED);
    expect(resolveAdminShopLedgerState({ status: 'PAID' }, null)).toBe(ADMIN_SHOP_LEDGER_STATE.PAID);
    expect(resolveAdminShopLedgerState({ status: 'EXPIRED' }, null)).toBe(ADMIN_SHOP_LEDGER_STATE.UNPAID);
    expect(resolveAdminShopLedgerState({ status: 'REFUNDED', expiryState: 'EXPIRED' }, null))
      .toBe(ADMIN_SHOP_LEDGER_STATE.REFUNDED);
  });

  test('list row uses server ledgerState and expiry fields without a detail GET', () => {
    const item = buildAdminShopOrderLedgerItem({
      orderPublicId: 'ord-1',
      status: 'PAID',
      ledgerState: 'EXPIRED',
      sessionCount: 10,
      expireDate: '2026-09-01',
      daysLeft: -3,
      extensionCount: 1
    }, null);
    expect(item.state).toBe(ADMIN_SHOP_LEDGER_STATE.EXPIRED);
    expect(item.delta).toEqual({ kind: ADMIN_SHOP_SESSION_DELTA_KIND.EXPIRED, count: 10 });
    expect(item.expireDate).toBe('2026-09-01');
    expect(item.daysLeft).toBe(-3);
    expect(item.extensionCount).toBe(1);
  });

  test('summary: money includes expired orders, expired sessions are kept separate', () => {
    const summary = summarizeAdminShopOrders([
      { state: ADMIN_SHOP_LEDGER_STATE.PAID, amount: 100, sessions: 1, points: 0 },
      { state: ADMIN_SHOP_LEDGER_STATE.EXPIRING_SOON, amount: 200, sessions: 10, points: 5 },
      { state: ADMIN_SHOP_LEDGER_STATE.EXPIRED, amount: 300, sessions: 10, points: 0 },
      { state: ADMIN_SHOP_LEDGER_STATE.REFUNDED, amount: 50, sessions: 1, points: 0 },
      { state: ADMIN_SHOP_LEDGER_STATE.UNPAID, amount: 999, sessions: 1, points: 0 }
    ]);
    expect(summary.inAmount).toBe(600);
    expect(summary.inSessions).toBe(11);
    expect(summary.expiredSessions).toBe(10);
    expect(summary.expiringSoonCount).toBe(1);
    expect(summary.netAmount).toBe(550);
    expect(normalizeAdminShopOrderSummary({ inAmount: '7', bogus: 1 })).toMatchObject({ inAmount: 7, outAmount: 0 });
  });
});

describe('adminShopSuite dates', () => {
  const now = new Date(2026, 8, 29);

  test('period range is [from, to) and ALL is unbounded', () => {
    expect(resolveAdminShopOrderPeriodRange(ADMIN_SHOP_ORDER_PERIOD.THIS_MONTH, now))
      .toEqual({ from: '2026-09-01', to: '2026-10-01' });
    expect(resolveAdminShopOrderPeriodRange(ADMIN_SHOP_ORDER_PERIOD.LAST_MONTH, now))
      .toEqual({ from: '2026-08-01', to: '2026-09-01' });
    expect(resolveAdminShopOrderPeriodRange(ADMIN_SHOP_ORDER_PERIOD.ALL, now)).toEqual({ from: null, to: null });
  });

  test('month math clamps to month end; display formats', () => {
    expect(addMonthsToAdminShopIsoDate('2026-09-28', 3)).toBe('2026-12-28');
    expect(addMonthsToAdminShopIsoDate('2026-11-30', 3)).toBe('2027-02-28');
    expect(addDaysToAdminShopIsoDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(diffAdminShopIsoDays('2026-09-28', '2026-10-05')).toBe(7);
    expect(formatAdminShopDate('2026-12-28')).toBe('2026.12.28');
    expect(formatAdminShopShortDate('2026-12-28')).toBe('12.28');
  });

  test('extend base: current expiry, or today when already expired', () => {
    expect(resolveAdminShopExtendBaseDate({ expireDate: '2026-10-10', state: ADMIN_SHOP_LEDGER_STATE.EXPIRING_SOON }, now))
      .toBe('2026-10-10');
    expect(resolveAdminShopExtendBaseDate({ expireDate: '2026-09-01', state: ADMIN_SHOP_LEDGER_STATE.EXPIRED }, now))
      .toBe('2026-09-29');
    expect(resolveAdminShopExtendBaseDate({ expireDate: null }, now)).toBeNull();
  });
});

describe('adminShopSuite products — validity & server rows', () => {
  const base = { name: '상담', sessions: '1', price: '1000' };

  test('validity months: blank ok (no expiry), integer ≥ 1, no upper bound', () => {
    expect(validateAdminShopProductForm({ ...base, validityMonths: '' })).toMatchObject({ valid: true, validityMonths: null });
    expect(validateAdminShopProductForm({ ...base, validityMonths: '36' })).toMatchObject({ valid: true, validityMonths: 36 });
    expect(validateAdminShopProductForm({ ...base, validityMonths: '0' }).errors.validityMonths).toBe(true);
  });

  test('server product rows map to table rows (package + legacy)', () => {
    const pkg = mapAdminShopServerProduct({
      kind: ADMIN_SHOP_PRODUCT_KIND.PACKAGE,
      code: 'P1',
      active: false,
      codeRow: { id: 9, codeValue: 'P1', koreanName: '10회기', extraData: '{"sessions":10,"price":500000}' },
      fee: { packageCode: 'P1', catalogVisible: false, validityMonths: 3, sessionCount: 10, unitPriceMinor: 500000 }
    });
    expect(pkg).toMatchObject({ kind: ADMIN_SHOP_PRODUCT_KIND.PACKAGE, code: 'P1', active: false, validityMonths: 3 });
    const legacy = mapAdminShopServerProduct({
      kind: ADMIN_SHOP_PRODUCT_KIND.LEGACY,
      legacySku: { id: 4, skuCode: 'OLD', title: '예전 상품', active: true, catalogVisible: true }
    });
    expect(legacy).toMatchObject({ kind: ADMIN_SHOP_PRODUCT_KIND.LEGACY, skuId: 4, active: true, mallVisible: true });
  });
});

describe('order detail timeline', () => {
  test('extension history rows follow fulfillment events, oldest first, in Korean', () => {
    const rows = buildAdminShopOrderTimeline(
      [{ skuCode: 'P1', status: 'SUCCEEDED', createdAt: '2026-09-28T10:00:00' }],
      [
        { id: 2, previousExpireDate: '2027-01-28', newExpireDate: '2027-02-28', extendedByName: '관리자', reason: '입원', extendedAt: '2026-10-02T09:00:00' },
        { id: 1, previousExpireDate: '2026-12-28', newExpireDate: '2027-01-28', extendedByName: '관리자', reason: '휴가', extendedAt: '2026-10-01T09:00:00' }
      ]
    );
    expect(rows).toHaveLength(3);
    expect(rows[1].key).toBe('extend-1');
    expect(rows[1].label).toBe('기한 연장');
    expect(rows[1].note).toContain('2026.12.28');
    expect(rows[1].note).toContain('2027.01.28');
    expect(rows[1].note).toContain('휴가');
    expect(rows[2].key).toBe('extend-2');
  });
});
