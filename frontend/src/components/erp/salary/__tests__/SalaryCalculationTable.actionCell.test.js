/**
 * 지급 목록 작업 열 — 승인/지급 · ⋮ · 프린트가 한 줄(row)이다.
 * 핸들러는 바꾸지 않는다.
 */
import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import SalaryCalculationTable from '../SalaryCalculationTable';
import { SALARY_ACTION_LABELS, SALARY_STATUS } from '../../../../constants/salaryConstants';
import { TABLE_ACTION_CELL_CLASS } from '../../../common/molecules/TableActionCell';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'ko' }
  })
}));

jest.mock('react-to-print', () => ({
  useReactToPrint: () => jest.fn()
}));

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

const formatCurrency = (n) => `${n}`;
const toSalaryNumber = (n) => Number(n) || 0;
const toSalaryStatusDisplayLabel = (status) => status;
const toSalaryStatusBadgeVariant = () => 'info';

function renderRow(calculation, handlers = {}) {
  return render(
    <SalaryCalculationTable
      calculations={[calculation]}
      consultants={[{ id: 7, name: '김상담' }]}
      formatCurrency={formatCurrency}
      toSalaryNumber={toSalaryNumber}
      toSalaryStatusDisplayLabel={toSalaryStatusDisplayLabel}
      toSalaryStatusBadgeVariant={toSalaryStatusBadgeVariant}
      onApprove={handlers.onApprove}
      onPay={handlers.onPay}
    />
  );
}

describe('SalaryCalculationTable action cell', () => {
  test('승인 대기 row lays approve, menu, and print in one row', () => {
    renderRow({
      id: 11,
      consultantId: 7,
      consultantName: '김상담',
      calculationPeriod: '2026-09',
      netSalary: 1000,
      status: SALARY_STATUS.CALCULATED
    });

    const cell = screen.getByTestId('table-action-cell');
    expect(cell).toHaveClass(TABLE_ACTION_CELL_CLASS);
    expect(cell.className).not.toMatch(/column/);

    const buttons = within(cell).getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveAccessibleName(SALARY_ACTION_LABELS.APPROVE);
    expect(buttons[1]).toHaveAccessibleName('더보기');
    expect(buttons[2]).toHaveTextContent('프린트');
  });

  test('지급 대기 row lays pay, menu, and print in one row and does not call approve', () => {
    const onApprove = jest.fn();
    const onPay = jest.fn();
    renderRow({
      id: 12,
      consultantId: 7,
      calculationPeriod: '2026-09',
      netSalary: 2000,
      status: SALARY_STATUS.APPROVED
    }, { onApprove, onPay });

    const cell = screen.getByTestId('table-action-cell');
    const buttons = within(cell).getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveAccessibleName(SALARY_ACTION_LABELS.PAY);
    fireEvent.click(buttons[0]);
    expect(onPay).toHaveBeenCalledTimes(1);
    expect(onApprove).not.toHaveBeenCalled();
  });

  test('승인 click calls onApprove only, and a paid row has no pay or approve button', () => {
    const onApprove = jest.fn();
    const onPay = jest.fn();
    const { unmount } = renderRow({
      id: 13,
      consultantId: 7,
      calculationPeriod: '2026-09',
      netSalary: 3000,
      status: SALARY_STATUS.CALCULATED
    }, { onApprove, onPay });

    fireEvent.click(screen.getByRole('button', { name: SALARY_ACTION_LABELS.APPROVE }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onPay).not.toHaveBeenCalled();
    unmount();

    renderRow({
      id: 14,
      consultantId: 7,
      calculationPeriod: '2026-09',
      netSalary: 4000,
      status: SALARY_STATUS.PAID
    }, { onApprove, onPay });

    const cell = screen.getByTestId('table-action-cell');
    expect(within(cell).queryByRole('button', { name: SALARY_ACTION_LABELS.APPROVE })).toBeNull();
    expect(within(cell).queryByRole('button', { name: SALARY_ACTION_LABELS.PAY })).toBeNull();
    expect(within(cell).getAllByRole('button')).toHaveLength(2);
  });

  test('action cell CSS is a nowrap row on the sm height token', () => {
    const css = read('src/components/common/molecules/TableActionCell.css');
    const rule = css.match(/\.mg-v2-table-action-cell\s*\{[^}]*\}/s);
    expect(rule).not.toBeNull();
    expect(rule[0]).toMatch(/flex-direction:\s*row/);
    expect(rule[0]).toMatch(/flex-wrap:\s*nowrap/);
    expect(rule[0]).not.toMatch(/flex-direction:\s*column/);
    expect(rule[0]).toMatch(/justify-content:\s*flex-end/);
    expect(rule[0]).toMatch(/--mg-v2-space-2/);
    expect(rule[0]).toMatch(/--mg-v2-component-height-sm/);
    expect(css).not.toMatch(/32px/);
    expect(css).toMatch(/\.mg-v2-entity-row-actions__trigger[\s\S]*width:\s*var\(--mg-v2-component-height-sm\)/);
    expect(css).toMatch(/min-width:\s*calc\(var\(--mg-v2-space-16\) \+ var\(--mg-v2-space-4\)\)/);
  });
});
