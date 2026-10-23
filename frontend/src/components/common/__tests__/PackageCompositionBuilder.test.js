import React from 'react';
import { render, screen, fireEvent, within, createEvent } from '@testing-library/react';
import PackageCompositionBuilder from '../PackageCompositionBuilder';
import { COMPOSITION_FETCH_STATUS } from '../../../hooks/useCompositionCandidates';

const C1 = { skuId: 1, label: '개인상담 4회 패키지', catalogCategory: 'CONSULTATION', unitPrice: 320000, sessions: 4, composed: false };
const C2 = { skuId: 2, label: '마음일기 노트', catalogCategory: 'GOODS', unitPrice: 12000, sessions: 0, composed: false };
const ITEM1 = { ...C1, quantity: 1, priceChanged: false, currentUnitPrice: 320000, available: true };
const ITEM2 = { ...C2, quantity: 2, priceChanged: false, currentUnitPrice: 12000, available: true };

const setup = (props = {}) => {
  const handlers = {
    onAdd: jest.fn(),
    onRemove: jest.fn(),
    onQuantityChange: jest.fn(),
    onDiscountChange: jest.fn(),
    onQueryChange: jest.fn(),
    onRecalc: jest.fn(),
    onRetry: jest.fn()
  };
  render(
    <PackageCompositionBuilder
      candidates={[C1, C2]}
      totalActive={2}
      status={COMPOSITION_FETCH_STATUS.READY}
      {...handlers}
      {...props}
    />
  );
  return handlers;
};

describe('PackageCompositionBuilder (몰 SKU 구성)', () => {
  test('검색 칸을 열면 후보가 보이고 「담기」로 onAdd 에 후보가 전달된다', () => {
    const h = setup();
    fireEvent.focus(screen.getByLabelText('몰 상품 검색'));
    expect(screen.getByText('검색 결과 2건')).toBeTruthy();
    expect(screen.getByText('판매가 320,000원 · 4회기')).toBeTruthy();
    expect(screen.getByText('판매가 12,000원 · 회기 없음(실물 상품)')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('개인상담 4회 패키지 담기'));
    expect(h.onAdd).toHaveBeenCalledWith(C1);
  });

  test('담기 mousedown 은 기본 동작을 막고, relatedTarget 이 null 인 blur 뒤에도 클릭은 onAdd 를 한 번 호출한다', () => {
    const h = setup();
    const search = screen.getByLabelText('몰 상품 검색');
    fireEvent.focus(search);
    const addButton = screen.getByRole('button', { name: '개인상담 4회 패키지 담기' });

    const mouseDown = createEvent.mouseDown(addButton);
    fireEvent(addButton, mouseDown);
    expect(mouseDown.defaultPrevented).toBe(true);

    fireEvent.focusOut(search, { relatedTarget: null });
    fireEvent.click(addButton);
    expect(h.onAdd).toHaveBeenCalledTimes(1);
    expect(h.onAdd).toHaveBeenCalledWith(C1);
  });

  test('검색어가 이름 앞에 있으면 빈 앞조각을 「—」로 그리지 않는다', () => {
    const candidate = {
      skuId: 9,
      label: '초기상담료',
      catalogCategory: 'CONSULTATION',
      unitPrice: 100000,
      sessions: 1,
      composed: false
    };
    setup({ candidates: [candidate], totalActive: 1, query: '초기' });
    fireEvent.focus(screen.getByLabelText('몰 상품 검색'));
    const list = screen.getByRole('listbox', { name: '몰 상품 검색 결과' });
    const name = within(list).getByText((_, node) => (
      node.classList?.contains('mg-package-composition__opt-name')
      && node.textContent === '초기상담료'
    ));
    expect(name.textContent).toBe('초기상담료');
    expect(name.textContent).not.toContain('—');
    expect(list.textContent).not.toContain('—');
  });

  test('재조회 LOADING 중에도 이전 결과의 담기 버튼이 남고 클릭된다', () => {
    const onAdd = jest.fn();
    const props = {
      candidates: [C1],
      totalActive: 1,
      status: COMPOSITION_FETCH_STATUS.READY,
      onAdd,
      onRemove: jest.fn(),
      onQuantityChange: jest.fn(),
      onDiscountChange: jest.fn(),
      onQueryChange: jest.fn(),
      onRecalc: jest.fn(),
      onRetry: jest.fn()
    };
    const { rerender } = render(<PackageCompositionBuilder {...props} />);
    fireEvent.focus(screen.getByLabelText('몰 상품 검색'));
    const addButton = screen.getByRole('button', { name: '개인상담 4회 패키지 담기' });
    fireEvent.mouseDown(addButton);

    rerender(
      <PackageCompositionBuilder
        {...props}
        status={COMPOSITION_FETCH_STATUS.LOADING}
      />
    );

    expect(screen.queryByText('몰 상품을 검색하는 중…')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '개인상담 4회 패키지 담기' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(C1);
  });

  test('첫 조회 LOADING 이고 후보가 없으면 검색 중 표시를 유지한다', () => {
    setup({ candidates: [], totalActive: 2, status: COMPOSITION_FETCH_STATUS.LOADING });
    fireEvent.focus(screen.getByLabelText('몰 상품 검색'));
    expect(screen.getByText('몰 상품을 검색하는 중…')).toBeTruthy();
    expect(screen.queryByRole('listbox', { name: '몰 상품 검색 결과' })).toBeNull();
  });

  test('검색 칸에서 바깥 요소로 포커스가 이동하면 목록이 닫힌다', () => {
    setup();
    const search = screen.getByLabelText('몰 상품 검색');
    fireEvent.focus(search);
    expect(screen.getByRole('listbox', { name: '몰 상품 검색 결과' })).toBeTruthy();

    const outside = document.createElement('button');
    outside.type = 'button';
    document.body.appendChild(outside);
    fireEvent.focusOut(search, { relatedTarget: outside });
    expect(screen.queryByRole('listbox', { name: '몰 상품 검색 결과' })).toBeNull();
    outside.remove();
  });

  test('이미 담은 후보는 「담김」이고 담기 버튼이 없다', () => {
    setup({ items: [ITEM1] });
    fireEvent.focus(screen.getByLabelText('몰 상품 검색'));
    const list = screen.getByRole('listbox', { name: '몰 상품 검색 결과' });
    expect(within(list).getByText('담김')).toBeTruthy();
    expect(screen.queryByLabelText('개인상담 4회 패키지 담기')).toBeNull();
  });

  test('totalActive 0 이면 「후보 없음」: 검색 잠금 + 몰 등록 링크', () => {
    const onRegisterClick = jest.fn();
    setup({ candidates: [], totalActive: 0, registerHref: '/admin/shop/products/new', onRegisterClick });
    expect(screen.getByText('담을 수 있는 몰 상품이 없습니다')).toBeTruthy();
    expect(screen.getByLabelText('몰 상품 검색').disabled).toBe(true);
    fireEvent.click(screen.getByText('몰에 상품 등록하기'));
    expect(onRegisterClick).toHaveBeenCalled();
  });

  test('items 0 이고 totalActive > 0 이면 「검색 결과 없음」(후보 없음 아님, 입력 유지)', () => {
    setup({ candidates: [], totalActive: 5, query: '없는상품' });
    const search = screen.getByLabelText('몰 상품 검색');
    fireEvent.focus(search);
    expect(screen.getByText('「없는상품」와 일치하는 몰 상품이 없습니다.')).toBeTruthy();
    expect(screen.queryByText('담을 수 있는 몰 상품이 없습니다')).toBeNull();
    expect(search.disabled).toBe(false);
    expect(search.value).toBe('없는상품');
  });

  test('오류면 점선 오류 + 「다시 시도」', () => {
    const h = setup({ status: COMPOSITION_FETCH_STATUS.ERROR, candidates: [] });
    fireEvent.focus(screen.getByLabelText('몰 상품 검색'));
    expect(screen.getByText('몰 상품을 불러오지 못했습니다.')).toBeTruthy();
    fireEvent.click(screen.getByText('다시 시도'));
    expect(h.onRetry).toHaveBeenCalled();
  });

  test('비어 있으면 「담은 상품이 없습니다」, 합계는 없다', () => {
    setup();
    expect(screen.getByText('담은 상품이 없습니다')).toBeTruthy();
    expect(screen.queryByText('몰 판매가 합계')).toBeNull();
  });

  test('합계 = 몰 판매가 × 수량, 할인 금액·최종 판매가', () => {
    setup({ items: [ITEM1, ITEM2], discountRate: 10 });
    expect(screen.getByText('몰 판매가 합계')).toBeTruthy();
    expect(screen.getByText('344,000원')).toBeTruthy();
    expect(screen.getByText('회기 합계 4회')).toBeTruthy();
    expect(screen.getByText('−34,400원')).toBeTruthy();
    expect(screen.getByText('최종 판매가')).toBeTruthy();
    expect(screen.getByText('309,600원')).toBeTruthy();
    expect(screen.getByText('24,000원')).toBeTruthy();
  });

  test('수량 스테퍼: 늘리기·줄이기, 1에서는 줄이기 잠금', () => {
    const h = setup({ items: [ITEM1, ITEM2] });
    expect(screen.getByLabelText('개인상담 4회 패키지 수량 줄이기').disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('개인상담 4회 패키지 수량 늘리기'));
    expect(h.onQuantityChange).toHaveBeenCalledWith(1, 2);
    fireEvent.click(screen.getByLabelText('마음일기 노트 수량 줄이기'));
    expect(h.onQuantityChange).toHaveBeenCalledWith(2, 1);
    fireEvent.click(screen.getByLabelText('마음일기 노트 삭제'));
    expect(h.onRemove).toHaveBeenCalledWith(2);
  });

  test('가격이 바뀐 항목은 「가격 변경됨」 배지 + 「다시 계산」', () => {
    const h = setup({ items: [{ ...ITEM1, priceChanged: true, currentUnitPrice: 350000 }] });
    expect(screen.getByText('가격 변경됨')).toBeTruthy();
    fireEvent.click(screen.getByText('다시 계산'));
    expect(h.onRecalc).toHaveBeenCalled();
  });

  test('할인율 입력 → onDiscountChange, 99 초과는 99로 보정', () => {
    const h = setup({ items: [ITEM1] });
    fireEvent.change(screen.getByLabelText(/할인율/), { target: { value: '25' } });
    expect(h.onDiscountChange).toHaveBeenCalledWith('25');
    fireEvent.change(screen.getByLabelText(/할인율/), { target: { value: '150' } });
    expect(h.onDiscountChange).toHaveBeenLastCalledWith('99');
  });

  test('예전 문구(상품 추가·할인 후 판매가·총 원가·개 담음)가 없다', () => {
    setup({ items: [ITEM1] });
    ['상품 추가', '할인 후 판매가', '총 원가', '개 담음'].forEach((old) => {
      expect(screen.queryByText(new RegExp(old))).toBeNull();
    });
  });
});

describe('PackageCompositionBuilder — 리더 확정 문구·예전 구성 안내', () => {
  test('「가격 변경됨」「다시 계산」은 상수, 「다시 계산」은 previewErrorRetry 와 같은 글자', () => {
    const { ADMIN_SHOP_COMPOSITION_COPY } = require('../../../constants/adminShopSuite');
    expect(ADMIN_SHOP_COMPOSITION_COPY.PRICE_CHANGED).toBe('가격 변경됨');
    expect(ADMIN_SHOP_COMPOSITION_COPY.RECALC).toBe('다시 계산');
  });

  test('예전 구성 항목이 있으면 안내 한 줄과 이름 목록을 보여 준다', () => {
    setup({ legacyLabels: ['검사 A', '상담 B'] });
    expect(screen.getByText('예전 방식으로 저장된 구성입니다. 몰 상품으로 다시 담아 저장하면 예전 구성은 사라집니다.')).toBeTruthy();
    const list = screen.getByRole('list', { name: '예전 구성 항목' });
    expect(within(list).getByText('검사 A')).toBeTruthy();
    expect(within(list).getByText('상담 B')).toBeTruthy();
  });

  test('예전 구성이 없으면 안내가 없다', () => {
    setup();
    expect(screen.queryByText(/예전 방식으로 저장된 구성/)).toBeNull();
  });
});
