/**
 * DesktopGnb — CurrentTimeChip 1개, 검색은 GNB에 없음
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DesktopGnb from '../DesktopGnb';

jest.mock('../../molecules', () => ({
  GnbRight: () => <div data-testid="gnb-right" />
}));

describe('DesktopGnb CurrentTimeChip', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-14T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('헤더에 CurrentTimeChip이 정확히 하나 있다', () => {
    const { container } = render(
      <MemoryRouter>
        <DesktopGnb logoLabel="센터" />
      </MemoryRouter>
    );
    const chips = container.querySelectorAll('.mg-v2-current-time-chip');
    expect(chips).toHaveLength(1);
    expect(screen.getByLabelText(/10월 14일/)).toBeInTheDocument();
  });

  it('GNB에 통합 검색이 없다', () => {
    render(
      <MemoryRouter>
        <DesktopGnb logoLabel="센터" />
      </MemoryRouter>
    );
    expect(screen.queryByLabelText('통합 검색')).not.toBeInTheDocument();
  });
});
