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
    expect(screen.queryByLabelText('할인율(%)')).toBeNull();
  });

  test('담은 상품 제거·총 원가·할인율 변경', () => {
    const h = setup({ items: [A, B], originalPrice: 500000, discountRate: 10 });
    expect(screen.getByText('500,000원')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('검사 A 제거'));
    expect(h.onRemove).toHaveBeenCalledWith(0);
    fireEvent.change(screen.getByLabelText('할인율(%)'), { target: { value: '25' } });
    expect(h.onDiscountChange).toHaveBeenCalledWith('25');
  });

  test('옵션이 없으면 선택이 비활성', () => {
    setup({ options: [] });
    expect(screen.getByLabelText('구성에 추가할 상품').disabled).toBe(true);
  });
});
