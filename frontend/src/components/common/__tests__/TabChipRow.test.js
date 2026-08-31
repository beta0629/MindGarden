/**
 * TabChipRow — MGButton chip/tab row SSOT unit tests
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TabChipRow from '../TabChipRow';

jest.mock('../MGButton', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    role,
    'aria-selected': ariaSelected,
    variant,
    'data-testid': testId
  }) => (
    <button
      type="button"
      role={role}
      aria-selected={ariaSelected}
      data-variant={variant}
      data-testid={testId}
      onClick={onClick}
    >
      {children}
    </button>
  )
}));

const ITEMS = [
  { key: 'income-statement', label: '손익' },
  { key: 'balance-sheet', label: '연말 자산·부채' }
];

describe('TabChipRow', () => {
  test('renders tablist with items and aria-label', () => {
    render(
      <TabChipRow
        items={ITEMS}
        activeKey="income-statement"
        onChange={() => {}}
        ariaLabel="세무사용 자료"
      />
    );

    expect(screen.getByTestId('tab-chip-row')).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: '세무사용 자료' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '손익' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '연말 자산·부채' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });

  test('switches active tab on click', () => {
    const onChange = jest.fn();
    render(
      <TabChipRow
        items={ITEMS}
        activeKey="income-statement"
        onChange={onChange}
        ariaLabel="세무사용 자료"
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: '연말 자산·부채' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('balance-sheet');
  });

  test('marks active tab as primary and inactive as outline', () => {
    render(
      <TabChipRow
        items={ITEMS}
        activeKey="balance-sheet"
        onChange={() => {}}
        ariaLabel="세무사용 자료"
      />
    );

    expect(screen.getByTestId('tab-chip-row-income-statement')).toHaveAttribute(
      'data-variant',
      'outline'
    );
    expect(screen.getByTestId('tab-chip-row-balance-sheet')).toHaveAttribute(
      'data-variant',
      'primary'
    );
  });
});
