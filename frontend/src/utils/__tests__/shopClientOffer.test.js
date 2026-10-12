import { previewOfferFinalPrice } from '../shopClientOffer';
import { SHOP_CLIENT_OFFER_DISCOUNT_TYPE } from '../../constants/shopClientOfferConstants';

describe('previewOfferFinalPrice', () => {
  const { AMOUNT, RATE } = SHOP_CLIENT_OFFER_DISCOUNT_TYPE;

  test('금액 할인', () => {
    expect(previewOfferFinalPrice(100000, AMOUNT, '20000')).toBe(80000);
  });

  test('율 할인은 내림(서버와 동일)', () => {
    expect(previewOfferFinalPrice(100000, RATE, 10)).toBe(90000);
    expect(previewOfferFinalPrice(100001, RATE, 33)).toBe(66667);
  });

  test('잘못된 입력은 null', () => {
    expect(previewOfferFinalPrice(100000, 'X', 10)).toBeNull();
    expect(previewOfferFinalPrice(100000, AMOUNT, 0)).toBeNull();
    expect(previewOfferFinalPrice(100000, AMOUNT, 100000)).toBeNull();
    expect(previewOfferFinalPrice(100000, RATE, 100)).toBeNull();
    expect(previewOfferFinalPrice(100000, RATE, '')).toBeNull();
  });

  test('결제 최소 금액 미만이면 null', () => {
    expect(previewOfferFinalPrice(1001, AMOUNT, 1000)).toBeNull();
  });
});
