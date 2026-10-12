import {
  buildClientOptions,
  describeOfferDiscount,
  filterClientOptions,
  isOfferValueInRange,
  previewOfferFinalPrice,
  toOfferRequestValue
} from '../shopClientOffer';
import { MIN_PAYMENT_AMOUNT } from '../../constants/paymentAmountConstants';

describe('previewOfferFinalPrice', () => {
  test('금액·비율 할인 (비율은 내림)', () => {
    expect(previewOfferFinalPrice(440000, 'RATE', 10)).toBe(396000);
    expect(previewOfferFinalPrice(333, 'RATE', 10) === null).toBe(333 - 33 < MIN_PAYMENT_AMOUNT);
    expect(previewOfferFinalPrice(320000, 'AMOUNT', 48000)).toBe(272000);
  });
  test('규칙 위반은 null', () => {
    expect(previewOfferFinalPrice(90000, 'AMOUNT', 90000)).toBeNull();
    expect(previewOfferFinalPrice(90000, 'RATE', 100)).toBeNull();
    expect(previewOfferFinalPrice(90000, 'AMOUNT', 90000 - MIN_PAYMENT_AMOUNT + 1)).toBeNull();
    expect(previewOfferFinalPrice(90000, 'AMOUNT', '')).toBeNull();
  });
});

describe('client combobox options', () => {
  const opts = buildClientOptions([
    { id: 1, name: '한서윤', phoneLast4: '1234', maskedPhone: '010-****-1234' },
    { id: 2, name: '김민준', phoneLast4: '5678', maskedPhone: '010-****-5678' },
    { id: 3, name: '이하늘' }
  ], (n, tail) => `${n} · ${tail}`);

  test('라벨은 이름과 연락처 뒷자리 4자리, 연락처 없으면 이름만', () => {
    expect(opts.map((o) => o.label)).toEqual(['한서윤 · 1234', '김민준 · 5678', '이하늘']);
  });
  test('이름 부분 일치와 뒷자리 일치로 검색', () => {
    expect(filterClientOptions(opts, '서윤').map((o) => o.value)).toEqual(['1']);
    expect(filterClientOptions(opts, '5678').map((o) => o.value)).toEqual(['2']);
    expect(filterClientOptions(opts, '').length).toBe(3);
    expect(filterClientOptions(opts, '0000')).toEqual([]);
  });
  test('옵션에 전체 연락처가 남지 않는다', () => {
    expect(JSON.stringify(opts)).not.toMatch(/010|\*/);
  });
});

describe('할인 없음·직접 입력 (BE ShopClientOfferPricing 과 같은 규칙)', () => {
  it('정가 그대로: 비우면 정가', () => {
    expect(previewOfferFinalPrice(90000, 'NONE', '')).toBe(90000);
    expect(previewOfferFinalPrice(90000, 'NONE', 5)).toBeNull();
    expect(toOfferRequestValue('NONE', '123')).toBeNull();
  });
  it('직접 입력: 비우면 정가, 정가와 같거나 낮으면 허용', () => {
    expect(previewOfferFinalPrice(90000, 'PRICE', '')).toBe(90000);
    expect(previewOfferFinalPrice(90000, 'PRICE', '90000')).toBe(90000);
    expect(previewOfferFinalPrice(90000, 'PRICE', '70000')).toBe(70000);
    expect(toOfferRequestValue('PRICE', '')).toBeNull();
    expect(toOfferRequestValue('PRICE', '70000')).toBe(70000);
  });
  it('직접 입력: 0원·음수·정가 초과·최소 금액 미만 거부', () => {
    expect(previewOfferFinalPrice(90000, 'PRICE', '0')).toBeNull();
    expect(previewOfferFinalPrice(90000, 'PRICE', '-1')).toBeNull();
    expect(previewOfferFinalPrice(90000, 'PRICE', '90001')).toBeNull();
    expect(previewOfferFinalPrice(90000, 'PRICE', MIN_PAYMENT_AMOUNT - 1)).toBeNull();
    expect(isOfferValueInRange(90000, 'PRICE', MIN_PAYMENT_AMOUNT - 1)).toBe(true);
    expect(isOfferValueInRange(90000, 'PRICE', 90001)).toBe(false);
  });
  it('할인 표시: 할인이 없으면 null', () => {
    expect(describeOfferDiscount({ discountType: 'NONE', discountValue: 0, originalPriceMinor: 9000, finalPriceMinor: 9000 })).toBeNull();
    expect(describeOfferDiscount({ discountType: 'PRICE', discountValue: 7000, originalPriceMinor: 9000, finalPriceMinor: 7000 }))
      .toEqual({ kind: 'amount', value: 2000 });
    expect(describeOfferDiscount({ discountType: 'RATE', discountValue: 10, originalPriceMinor: 9000, finalPriceMinor: 8100 }))
      .toEqual({ kind: 'rate', value: 10 });
  });
});

describe('직접 입력 결제 최소 금액 경계 (BE 999 거부 · 1000 허용)', () => {
  it('최소 금액 미만은 null, 최소 금액은 허용', () => {
    expect(previewOfferFinalPrice(90000, 'PRICE', MIN_PAYMENT_AMOUNT - 1)).toBeNull();
    expect(previewOfferFinalPrice(90000, 'PRICE', MIN_PAYMENT_AMOUNT)).toBe(MIN_PAYMENT_AMOUNT);
    expect(previewOfferFinalPrice(90000, 'PRICE', '1000')).toBe(1000);
  });
});
