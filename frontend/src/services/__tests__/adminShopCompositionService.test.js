import StandardizedApi from '../../utils/standardizedApi';
import {
  getPackageComposition,
  listCompositionCandidates,
  savePackageComposition
} from '../adminShopCompositionService';
import { ADMIN_SHOP_API } from '../../constants/adminShopApi';

jest.mock('../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() }
}));

describe('adminShopCompositionService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('후보는 composition-candidates API 에서 {items,totalActive} 로 받는다', async() => {
    StandardizedApi.get.mockResolvedValue({ success: true, data: { items: [{ skuId: 1 }], totalActive: 3 } });
    await expect(listCompositionCandidates({ q: ' 상담 ', excludePackageCode: 'PKG' }))
      .resolves.toEqual({ items: [{ skuId: 1 }], totalActive: 3 });
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/admin/shop/catalog-skus/composition-candidates',
      { q: '상담', excludePackageCode: 'PKG' }
    );
  });

  test('빈 검색어는 q 없이 전체를 요청한다', async() => {
    StandardizedApi.get.mockResolvedValue({ items: [], totalActive: 0 });
    await listCompositionCandidates({ q: '' });
    expect(StandardizedApi.get).toHaveBeenCalledWith(ADMIN_SHOP_API.COMPOSITION_CANDIDATES, {});
  });

  test('저장은 PUT /package-compositions/{packageCode} 에 {items:[{skuId,quantity}]}', async() => {
    StandardizedApi.put.mockResolvedValue({ data: { packageCode: 'PKG_A', items: [] } });
    await savePackageComposition('PKG_A', [
      { skuId: 1, label: 'A', unitPrice: 100, quantity: 2 },
      { skuId: 2, label: 'B', unitPrice: 50, quantity: 0 }
    ]);
    expect(StandardizedApi.put).toHaveBeenCalledWith(
      '/api/v1/admin/shop/package-compositions/PKG_A',
      { items: [{ skuId: 1, quantity: 2 }, { skuId: 2, quantity: 1 }] }
    );
  });

  test('조회는 GET /package-compositions/{packageCode}', async() => {
    StandardizedApi.get.mockResolvedValue({ data: { packageCode: 'PKG_A', items: [{ skuId: 1 }] } });
    await expect(getPackageComposition('PKG_A')).resolves.toEqual({ packageCode: 'PKG_A', items: [{ skuId: 1 }] });
    expect(StandardizedApi.get).toHaveBeenCalledWith('/api/v1/admin/shop/package-compositions/PKG_A');
  });
});
