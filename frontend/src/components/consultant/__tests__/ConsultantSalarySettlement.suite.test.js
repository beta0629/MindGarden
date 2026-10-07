/**
 * /consultant/salary-settlement 수용 — 흰 카드 suite · 「N원」 · 읽기 전용 · 레거시 cr-* 없음
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '../../../i18n';
import ConsultantSalarySettlement from '../ConsultantSalarySettlement';
import ConsultantSalarySettlementPage from '../ConsultantSalarySettlementPage';
import { CONSULTANT_SUITE_CLASS, CONSULTANT_SUITE_TEST_ID } from '../../../constants/consultantSuite';

jest.mock('../../../hooks/useConsultantSalaryCalculations', () => ({
  useConsultantSalaryCalculations: jest.fn()
}));

const { useConsultantSalaryCalculations } = require('../../../hooks/useConsultantSalaryCalculations');

const PAID_AUG = {
  id: 1,
  calculationPeriod: '2026-08',
  calculationPeriodEnd: '2026-08-31',
  status: 'PAID',
  consultationCount: 12,
  commissionEarnings: 1200000,
  bonusEarnings: 40000,
  grossSalary: 1240000,
  taxAmount: 147840,
  netSalary: 1092160
};

const APPROVED_SEP = {
  id: 2,
  calculationPeriod: '2026-09',
  calculationPeriodEnd: '2026-09-30',
  status: 'APPROVED',
  consultationCount: 10,
  commissionEarnings: 1000000,
  grossSalary: 1000000,
  taxAmount: 33000,
  netSalary: 967000
};

const FORBIDDEN_CTA = /승인|지급하기|지급 처리|정산하기|계산하기|배정/;
const PG_VENDOR = /토스|toss|이니시스|inicis|kcp|나이스|nice ?pay|포트원|portone|아임포트|iamport/i;

const mockHook = (overrides = {}) => {
  useConsultantSalaryCalculations.mockReturnValue({
    items: [PAID_AUG, APPROVED_SEP],
    loading: false,
    error: null,
    refetch: jest.fn(),
    hasItems: true,
    ...overrides
  });
};

describe('ConsultantSalarySettlement suite 수용', () => {
  beforeEach(() => mockHook());

  it('레거시 cr-* 클래스·₩·PG 사명 없음', () => {
    const { container } = render(<ConsultantSalarySettlement />);
    expect(container.querySelector('[class*="cr-"]')).toBeNull();
    expect(container.textContent).not.toMatch(/[₩￦]/);
    expect(container.textContent).not.toMatch(PG_VENDOR);
  });

  it('승인·지급 CTA 없음 · primary 버튼 0', () => {
    const { container } = render(<ConsultantSalarySettlement />);
    screen.queryAllByRole('button').forEach((btn) => {
      expect(btn.textContent).not.toMatch(FORBIDDEN_CTA);
    });
    expect(container.querySelectorAll('.mg-button--primary').length).toBe(0);
  });

  it('안내 → 요약 → 칩 → 월 카드 순서 · 최신 월 먼저', () => {
    const { container } = render(<ConsultantSalarySettlement />);
    const root = container.firstChild;
    expect(root).toHaveClass(CONSULTANT_SUITE_CLASS.ROOT);
    const order = [
      root.querySelector(`.${CONSULTANT_SUITE_CLASS.NOTICE}`),
      root.querySelector(`.${CONSULTANT_SUITE_CLASS.SUMMARY}`),
      root.querySelector(`.${CONSULTANT_SUITE_CLASS.CHIPS}`),
      root.querySelector('.consultant-salary__list')
    ];
    order.forEach((el) => expect(el).not.toBeNull());
    for (let i = 1; i < order.length; i += 1) {
      // eslint-disable-next-line no-bitwise
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    const cards = screen.getAllByTestId(CONSULTANT_SUITE_TEST_ID.SALARY_CARD);
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByRole('heading')).toHaveTextContent('2026년 9월');
    expect(within(cards[0]).getByText('지급 대기')).toHaveClass(CONSULTANT_SUITE_CLASS.STATUS);
  });

  it('요약: 최근 실수령·지급 대기·지급 완료', () => {
    const { container } = render(<ConsultantSalarySettlement />);
    const summary = container.querySelector(`.${CONSULTANT_SUITE_CLASS.SUMMARY}`);
    expect(summary).toHaveTextContent('최근 실수령');
    expect(summary).toHaveTextContent('967,000원');
    expect(summary).toHaveTextContent('지급 대기');
    expect(summary).toHaveTextContent('지급 완료');
  });

  it('월 카드: 공제 −N원(out) · 수당 +N원 · 실수령 ink · 정산 수단 「—」', () => {
    render(<ConsultantSalarySettlement />);
    const aug = screen.getAllByTestId(CONSULTANT_SUITE_TEST_ID.SALARY_CARD)[1];
    expect(within(aug).getByText('\u2212147,840원')).toHaveClass(CONSULTANT_SUITE_CLASS.MONEY_OUT);
    expect(within(aug).getByText('+40,000원')).toBeInTheDocument();
    const net = within(aug).getByText('1,092,160원');
    expect(net).toHaveClass(CONSULTANT_SUITE_CLASS.MONEY_STRONG);
    expect(net).not.toHaveClass(CONSULTANT_SUITE_CLASS.MONEY_OUT);
    expect(within(aug).getByText('정산 수단').nextSibling).toHaveTextContent('—');
    expect(within(aug).getByText('지급됨')).toHaveClass(CONSULTANT_SUITE_CLASS.STATUS);
  });

  it('칩 필터: 지급됨 → 8월 카드만', () => {
    render(<ConsultantSalarySettlement />);
    fireEvent.click(screen.getByTestId('consultant-salary-filter-paid'));
    const cards = screen.getAllByTestId(CONSULTANT_SUITE_TEST_ID.SALARY_CARD);
    expect(cards).toHaveLength(1);
    expect(within(cards[0]).getByRole('heading')).toHaveTextContent('2026년 8월');
    expect(screen.getByTestId('consultant-salary-filter-paid')).toHaveAttribute('aria-pressed', 'true');
  });

  it('데이터 없음: Empty · 칩 없음 · 요약 「—」', () => {
    mockHook({ items: [], hasItems: false });
    const { container } = render(<ConsultantSalarySettlement />);
    expect(container.querySelector(`.${CONSULTANT_SUITE_CLASS.CHIPS}`)).toBeNull();
    expect(container.querySelector(`.${CONSULTANT_SUITE_CLASS.EMPTY}`)).not.toBeNull();
    expect(container.querySelector(`.${CONSULTANT_SUITE_CLASS.SUMMARY}`)).toHaveTextContent('—');
  });

  it('로딩: aria-busy 스켈레톤 · 오류: 다시 시도(outline) 1개', () => {
    mockHook({ loading: true, items: [], hasItems: false });
    const { container, rerender } = render(<ConsultantSalarySettlement />);
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    const refetch = jest.fn();
    mockHook({ error: new Error('x'), items: [], hasItems: false, refetch });
    rerender(<ConsultantSalarySettlement />);
    const retry = screen.getByRole('button', { name: '다시 시도' });
    expect(retry).toHaveClass('mg-button--outline');
    fireEvent.click(retry);
    expect(refetch).toHaveBeenCalled();
  });

  it('페이지 셸: 제목·부제 · suite 루트 · primary 0', () => {
    const { container } = render(<ConsultantSalarySettlementPage />);
    const page = screen.getByTestId(CONSULTANT_SUITE_TEST_ID.SALARY_PAGE);
    expect(page).toHaveClass(CONSULTANT_SUITE_CLASS.ROOT);
    expect(page).toHaveAttribute('data-surface', 'consultant');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(container.querySelectorAll('.mg-button--primary').length).toBe(0);
  });
});
