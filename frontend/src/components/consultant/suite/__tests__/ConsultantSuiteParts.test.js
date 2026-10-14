/**
 * 상담사 suite 공통 — MoneyText(「N원」·₩ 금지) · FilterChips(slate 선택·aria-pressed)
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ConsultantMoneyText, { formatConsultantMoney } from '../ConsultantMoneyText';
import ConsultantFilterChips from '../ConsultantFilterChips';
import ConsultantNotice from '../ConsultantNotice';
import { CONSULTANT_MONEY_SIGN, CONSULTANT_SUITE_CLASS } from '../../../../constants/consultantSuite';

const WON_SYMBOLS = /[₩￦]/;

describe('formatConsultantMoney', () => {
  it('「N원」 형식 · ₩ 없음', () => {
    expect(formatConsultantMoney(1092160)).toBe('1,092,160원');
    expect(formatConsultantMoney(1092160)).not.toMatch(WON_SYMBOLS);
  });

  it('공제는 −, 수당은 + 기호', () => {
    expect(formatConsultantMoney(147840, CONSULTANT_MONEY_SIGN.MINUS)).toBe('\u2212147,840원');
    expect(formatConsultantMoney(40000, CONSULTANT_MONEY_SIGN.PLUS)).toBe('+40,000원');
  });

  it('값이 없거나 숫자가 아니면 「—」', () => {
    expect(formatConsultantMoney(null)).toBe('—');
    expect(formatConsultantMoney('')).toBe('—');
    expect(formatConsultantMoney('abc')).toBe('—');
  });
});

describe('ConsultantMoneyText', () => {
  it('strong=ink 클래스, minus=out 클래스', () => {
    const { rerender } = render(<ConsultantMoneyText value={1000} strong />);
    const net = screen.getByText('1,000원');
    expect(net).toHaveClass(CONSULTANT_SUITE_CLASS.MONEY_STRONG);
    expect(net).not.toHaveClass(CONSULTANT_SUITE_CLASS.MONEY_OUT);
    rerender(<ConsultantMoneyText value={500} sign={CONSULTANT_MONEY_SIGN.MINUS} />);
    expect(screen.getByText('\u2212500원')).toHaveClass(CONSULTANT_SUITE_CLASS.MONEY_OUT);
  });
});

describe('ConsultantFilterChips', () => {
  const items = [
    { key: 'all', label: '전체' },
    { key: 'paid', label: '지급됨' }
  ];

  it('선택 칩만 aria-pressed=true · selected 클래스 · primary 아님', () => {
    const onChange = jest.fn();
    render(
      <ConsultantFilterChips
        items={items}
        activeKey="all"
        onChange={onChange}
        ariaLabel="필터"
        testIdPrefix="chip"
      />
    );
    const all = screen.getByTestId('chip-all');
    const paid = screen.getByTestId('chip-paid');
    expect(all).toHaveAttribute('aria-pressed', 'true');
    expect(all).toHaveClass(CONSULTANT_SUITE_CLASS.CHIP_SELECTED);
    expect(paid).toHaveAttribute('aria-pressed', 'false');
    expect(paid).not.toHaveClass(CONSULTANT_SUITE_CLASS.CHIP_SELECTED);
    expect(screen.getByRole('group', { name: '필터' }).querySelector('.mg-button--primary')).toBeNull();
    fireEvent.click(paid);
    expect(onChange).toHaveBeenCalledWith('paid');
  });
});

describe('ConsultantNotice', () => {
  it('role=note slate notice', () => {
    render(<ConsultantNotice>안내</ConsultantNotice>);
    expect(screen.getByRole('note')).toHaveClass(CONSULTANT_SUITE_CLASS.NOTICE);
  });
});
