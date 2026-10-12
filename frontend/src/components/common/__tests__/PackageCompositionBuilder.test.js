import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PackageCompositionBuilder from '../PackageCompositionBuilder';

const A = { value: 'A', label: '검사 A', sessions: 2, price: 100000 };
const B = { value: 'B', label: '상담 B', sessions: 8, price: 400000 };

const setup = (props = {}) => {
  const handlers = { onAdd: jest.fn(), onRemove: jest.fn(), onDiscountChange: jest.fn() };
  render(<PackageCompositionBuilder options={[A, B]} {...handlers} {...props} />);
  return handlers;
};

describe('PackageCompositionBuilder', () => {
  test('선택하면 onAdd 에 옵션이 전달된다', () => {
    const h = setup();
    fireEvent.change(screen.getByLabelText('구성에 추가할 상품'), { target: { value: 'B' } });
    expect(h.onAdd).toHaveBeenCalledWith(B);
  });

  test('구성이 없으면 요약·할인율이 없다', () => {
    setup();
    expect(screen.queryByText('총 원가')).toBeNull();
    expect(screen.queryByLabelText('할인율')).toBeNull();
  });

  test('담은 상품 제거·총 원가·할인율 변경', () => {
    const h = setup({ items: [A, B], originalPrice: 500000, discountRate: 10 });
    expect(screen.getByText('500,000원')).toBeTruthy();
    expect(screen.getByText('450,000원')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('검사 A 제거'));
    expect(h.onRemove).toHaveBeenCalledWith(0);
    fireEvent.change(screen.getByLabelText('할인율'), { target: { value: '25' } });
    expect(h.onDiscountChange).toHaveBeenCalledWith('25');
  });

  test('옵션이 없으면 선택이 비활성', () => {
    setup({ options: [] });
    expect(screen.getByLabelText('구성에 추가할 상품').disabled).toBe(true);
  });

  test('구성이 비어 있으면 직접 입력 안내가 보이고 목록·요약은 없다', () => {
    setup();
    expect(screen.getByText('비워 두면 아래 가격·회기를 직접 입력합니다.')).toBeTruthy();
    expect(screen.queryByLabelText('담은 상품')).toBeNull();
  });

  test('옵션이 없으면 이유 안내가 보인다', () => {
    setup({ options: [] });
    expect(screen.getByText('이미 모두 담았거나, 담을 수 있는 다른 상품이 없습니다.')).toBeTruthy();
  });

  test('구성이 있으면 잠금 안내와 할인 후 판매가가 보인다', () => {
    setup({ items: [A, B], originalPrice: 500000, discountRate: 10 });
    expect(screen.getByText(/직접 고칠 수 없습니다/)).toBeTruthy();
    expect(screen.getByText('할인 후 판매가')).toBeTruthy();
  });

  test('할인율 99 초과 입력은 99로 보정되고 안내가 보인다', () => {
    const h = setup({ items: [A], originalPrice: 100000, discountRate: 0 });
    fireEvent.change(screen.getByLabelText('할인율'), { target: { value: '150' } });
    expect(h.onDiscountChange).toHaveBeenCalledWith('99');
    expect(screen.getByRole('alert').textContent).toContain('99');
  });

  test('할인율은 숫자 이외 문자를 제거한다', () => {
    const h = setup({ items: [A], originalPrice: 100000 });
    fireEvent.change(screen.getByLabelText('할인율'), { target: { value: '1a2' } });
    expect(h.onDiscountChange).toHaveBeenCalledWith('12');
  });
});
