import { buildClientOptions, filterClientOptions, previewOfferFinalPrice } from '../shopClientOffer';
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
    { id: 1, name: '한서윤', phone: '010-1111-1234' },
    { id: 2, name: '김민준', phone: '010-2222-5678' },
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
});
