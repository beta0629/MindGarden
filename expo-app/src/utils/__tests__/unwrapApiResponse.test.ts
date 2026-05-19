import { assertApiSuccessVoid, unwrapApiResponse } from '@/api/unwrapApiResponse';

describe('unwrapApiResponse', () => {
  it('returns null data when success is true and data is null', () => {
    expect(unwrapApiResponse({ success: true, data: null })).toBeNull();
  });
});

describe('assertApiSuccessVoid', () => {
  const fallback = '장바구니 갱신에 실패했습니다.';

  it('accepts success true with null data', () => {
    expect(() => assertApiSuccessVoid({ success: true, data: null }, fallback)).not.toThrow();
  });

  it('throws with server message when success is false', () => {
    expect(() =>
      assertApiSuccessVoid({ success: false, message: '재고 부족' }, fallback),
    ).toThrow('재고 부족');
  });

  it('throws fallback when success is false without message', () => {
    expect(() => assertApiSuccessVoid({ success: false }, fallback)).toThrow(fallback);
  });

  it('throws fallback when response is missing', () => {
    expect(() => assertApiSuccessVoid(null, fallback)).toThrow(fallback);
  });

  it('throws fallback when success field is absent', () => {
    expect(() => assertApiSuccessVoid({ data: {} }, fallback)).toThrow(fallback);
  });
});
