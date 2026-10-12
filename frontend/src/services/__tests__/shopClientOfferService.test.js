import StandardizedApi from '../../utils/standardizedApi';
import {
  cancelAdminClientOffer,
  createAdminClientOffer,
  listAdminClientOffers,
  listMyClientOffers
} from '../shopClientOfferService';
import { SHOP_CLIENT_OFFER_API } from '../../constants/shopClientOfferConstants';

jest.mock('../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() }
}));

describe('shopClientOfferService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('내담자 목록은 요청 값 없이 본인 경로만 호출한다', async() => {
    StandardizedApi.get.mockResolvedValue([{ id: 1 }]);
    await expect(listMyClientOffers()).resolves.toEqual([{ id: 1 }]);
    expect(StandardizedApi.get).toHaveBeenCalledWith(SHOP_CLIENT_OFFER_API.CLIENT);
  });

  test('관리자 생성은 최종가를 보내지 않는다(서버 확정)', async() => {
    StandardizedApi.post.mockResolvedValue({ data: { id: 2 } });
    const body = { clientId: 7, sourceSkuCode: 'SRC', discountType: 'RATE', discountValue: 10 };
    await createAdminClientOffer(body);
    expect(StandardizedApi.post).toHaveBeenCalledWith(SHOP_CLIENT_OFFER_API.ADMIN, body);
    expect(Object.keys(StandardizedApi.post.mock.calls[0][1])).not.toContain('finalPriceMinor');
  });

  test('관리자 목록·취소 경로', async() => {
    StandardizedApi.get.mockResolvedValue({ data: [] });
    await listAdminClientOffers(7);
    expect(StandardizedApi.get).toHaveBeenCalledWith(SHOP_CLIENT_OFFER_API.ADMIN, { clientId: 7 });
    StandardizedApi.post.mockResolvedValue({ data: { id: 3 } });
    await cancelAdminClientOffer(3);
    expect(StandardizedApi.post).toHaveBeenCalledWith(`${SHOP_CLIENT_OFFER_API.ADMIN}/3/cancel`, {});
  });
});
