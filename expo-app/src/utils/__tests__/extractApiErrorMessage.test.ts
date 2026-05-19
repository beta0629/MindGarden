import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

describe('extractApiErrorMessage', () => {
  const fallback = '장바구니 갱신에 실패했습니다.';

  it('returns Error.message when error is Error instance', () => {
    expect(extractApiErrorMessage(new Error('유효하지 않은 상품'), fallback)).toBe(
      '유효하지 않은 상품',
    );
  });

  it('returns message from axios-like reject object', () => {
    expect(
      extractApiErrorMessage({ status: 400, message: '유효하지 않은 상품' }, fallback),
    ).toBe('유효하지 않은 상품');
  });

  it('returns message from originalError.response.data', () => {
    expect(
      extractApiErrorMessage(
        {
          status: 400,
          message: '',
          originalError: {
            response: { data: { message: '재고 부족' } },
          },
        },
        fallback,
      ),
    ).toBe('재고 부족');
  });

  it('returns fallback when reject object has no message', () => {
    expect(extractApiErrorMessage({ status: 500 }, fallback)).toBe(fallback);
  });

  it('returns fallback for nullish input', () => {
    expect(extractApiErrorMessage(null, fallback)).toBe(fallback);
  });
});
