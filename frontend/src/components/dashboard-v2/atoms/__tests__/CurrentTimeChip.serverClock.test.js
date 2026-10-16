/**
 * CurrentTimeChip — serverClock getNow 계약
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import CurrentTimeChip from '../CurrentTimeChip';

const mockGetNow = jest.fn(() => new Date('2026-10-14T00:00:00.000Z'));

jest.mock('../../../../hooks/useServerClock', () => ({
  useServerClock: () => ({
    getNow: mockGetNow,
    syncNow: jest.fn(),
    synced: true,
    syncGeneration: 1
  })
}));

describe('CurrentTimeChip serverClock 계약', () => {
  beforeEach(() => {
    mockGetNow.mockClear();
    mockGetNow.mockReturnValue(new Date('2026-10-14T00:00:00.000Z'));
  });

  it('표시 시각을 useServerClock().getNow() 로 읽는다', () => {
    render(<CurrentTimeChip />);
    expect(mockGetNow).toHaveBeenCalled();
    expect(screen.getByLabelText('10월 14일 (수) 오전 9:00')).toBeInTheDocument();
  });
});
