/**
 * MatchingScheduleSidebar — 내담자 검색 노출 스모크
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MatchingScheduleSidebar from '../MatchingScheduleSidebar';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, opts) => (opts && opts.defaultValue) || key
  })
}));

jest.mock('../../../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v) => (v == null ? '' : String(v))
}));

jest.mock('../../../../../dashboard-v2/atoms/SearchInput', () => ({
  __esModule: true,
  default: ({ value, onChange, placeholder, className }) => (
    <input
      data-testid="sidebar-client-search"
      className={className}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      aria-label="통합 검색"
    />
  )
}));

jest.mock('../MatchingScheduleList', () => ({
  __esModule: true,
  default: ({ mappings }) => (
    <ul data-testid="matching-list">
      {mappings.map((m) => (
        <li key={m.id}>{m.clientName}</li>
      ))}
    </ul>
  )
}));

jest.mock('../../molecules/DensityToggle', () => ({
  __esModule: true,
  default: () => <div data-testid="density-toggle" />
}));

describe('MatchingScheduleSidebar client search', () => {
  const baseProps = {
    isCollapsed: false,
    onToggle: jest.fn(),
    filteredMappings: [{ id: 1, clientName: '김예린', status: 'ACTIVE', remainingSessions: 2 }],
    loading: false,
    viewFilter: 'remaining',
    onViewFilterChange: jest.fn(),
    statusFilter: '',
    onStatusFilterChange: jest.fn(),
    getStatusCount: () => 0,
    onScheduleFromCard: jest.fn()
  };

  it('renders SearchInput and calls onClientSearchChange', () => {
    const onClientSearchChange = jest.fn();
    render(
      <MatchingScheduleSidebar
        {...baseProps}
        clientSearchQuery=""
        onClientSearchChange={onClientSearchChange}
      />
    );

    const input = screen.getByTestId('sidebar-client-search');
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '김예린' } });
    expect(onClientSearchChange).toHaveBeenCalledWith('김예린');
  });

  it('hides search when onClientSearchChange is omitted', () => {
    render(<MatchingScheduleSidebar {...baseProps} />);
    expect(screen.queryByTestId('sidebar-client-search')).not.toBeInTheDocument();
  });
});
