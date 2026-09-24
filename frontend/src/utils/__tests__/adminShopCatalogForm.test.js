/**
 * adminShopCatalogForm — sessionCount 필수(fail-closed) 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import { ADMIN_SHOP_SKU_SESSION_COUNT_REQUIRED_MESSAGE } from '../../constants/adminShopCatalog';
import { SHOP_CATALOG_CATEGORY } from '../../constants/clientShopConstants';
import { SHOP_SESSION_COUNT_MIN } from '../shopSessionCount';
import {
  buildAdminShopCatalogUpsertBody,
  buildAdminShopPackageContentBody,
  emptyAdminShopCatalogForm,
  mapAdminShopPackageFeeToForm,
  validateAdminShopCatalogSessionCount
} from '../adminShopCatalogForm';

describe('validateAdminShopCatalogSessionCount', () => {
  test.each([
    ['blank', ''],
    ['whitespace', '   '],
    ['zero', '0'],
    ['negative', '-1'],
    ['undefined', undefined]
  ])('%s → invalid', (_label, sessionCount) => {
    const result = validateAdminShopCatalogSessionCount({ sessionCount });
    expect(result.valid).toBe(false);
    expect(result.message).toBe(ADMIN_SHOP_SKU_SESSION_COUNT_REQUIRED_MESSAGE);
  });

  test.each([
    ['one', '1', 1],
    ['ten', '10', 10]
  ])('%s → valid', (_label, sessionCount, expected) => {
    const result = validateAdminShopCatalogSessionCount({ sessionCount });
    expect(result.valid).toBe(true);
    expect(result.sessionCount).toBe(expected);
  });
});

describe('buildAdminShopCatalogUpsertBody', () => {
  const baseForm = () => ({
    ...emptyAdminShopCatalogForm(),
    title: '테스트 상품',
    unitPriceMinor: '10000',
    catalogCategory: SHOP_CATALOG_CATEGORY.CONSULTATION,
    sessionCount: String(SHOP_SESSION_COUNT_MIN)
  });

  test('유효 sessionCount를 body에 전달한다', () => {
    const body = buildAdminShopCatalogUpsertBody({
      ...baseForm(),
      sessionCount: '10'
    });
    expect(body.sessionCount).toBe(10);
    expect(body.title).toBe('테스트 상품');
    expect(body.unitPriceMinor).toBe(10000);
  });

  test.each([
    ['blank', ''],
    ['zero', '0'],
    ['negative', '-1'],
    ['undefined', undefined]
  ])('invalid sessionCount(%s)면 throw (fail-closed)', (_label, sessionCount) => {
    expect(() =>
      buildAdminShopCatalogUpsertBody({
        ...baseForm(),
        sessionCount
      })
    ).toThrow(ADMIN_SHOP_SKU_SESSION_COUNT_REQUIRED_MESSAGE);
  });
});

describe('buildAdminShopPackageContentBody', () => {
  test('설명·노출·정렬만 보내고 상품명·단가·회기는 넣지 않는다', () => {
    const body = buildAdminShopPackageContentBody({
      packageName: '10회기',
      unitPriceMinor: 150000,
      sessionCount: 10,
      descriptionText: '  상담 안내  ',
      catalogVisible: true,
      sortOrder: '3'
    });
    expect(body).toEqual({
      descriptionText: '상담 안내',
      catalogVisible: true,
      sortOrder: 3
    });
    expect(body).not.toHaveProperty('title');
    expect(body).not.toHaveProperty('unitPriceMinor');
    expect(body).not.toHaveProperty('sessionCount');
    expect(body).not.toHaveProperty('catalogCategory');
  });

  test('요금 행의 이름과 단가는 읽기 전용 폼에만 남긴다', () => {
    const form = mapAdminShopPackageFeeToForm({
      packageCode: 'PACKAGE_001',
      packageName: '10회기',
      unitPriceMinor: 150000,
      sessionCount: 10,
      priceReady: true,
      descriptionText: '안내',
      catalogVisible: false,
      sortOrder: 1,
      skuId: 9
    });
    expect(form.packageName).toBe('10회기');
    expect(form.unitPriceMinor).toBe(150000);
    expect(form.sessionCount).toBe(10);
    const body = buildAdminShopPackageContentBody(form);
    expect(body.descriptionText).toBe('안내');
    expect(body.catalogVisible).toBe(false);
    expect(body.title).toBeUndefined();
  });
});
