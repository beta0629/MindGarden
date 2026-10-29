/**
 * NextSheet — 헤드라인=시각(sheet-dom) · 서브=상담사명(sheet-body) · 빈 meta 미렌더
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NextSheet from '../NextSheet';
import {
  CLIENT_COVER_NEXT_SHEET_TEST_ID,
  CLIENT_COVER_SHEET_MODE
} from '../../constants';

jest.mock('../../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, className }) => (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  )
}));

const renderSheet = (props) => render(
  <MemoryRouter>
    <NextSheet
      sheetMode={CLIENT_COVER_SHEET_MODE.HAS}
      remainingSessions={4}
      pendingPaymentCount={0}
      {...props}
    />
  </MemoryRouter>
);

describe('NextSheet hierarchy', () => {
  test('has: sheet-dom is time headline; sheet-body is consultant · method', () => {
    renderSheet({
      nextSchedule: {
        date: '2099-09-20',
        startTime: '16:30',
        status: 'CONFIRMED',
        consultantName: '김선희',
        consultationMethod: 'FACE',
        durationMinutes: 50
      }
    });

    const sheet = screen.getByTestId(CLIENT_COVER_NEXT_SHEET_TEST_ID);
    const dom = sheet.querySelector('.client-cover__sheet-dom');
    const body = sheet.querySelector('.client-cover__sheet-body');

    expect(dom).toBeInTheDocument();
    expect(dom).toHaveTextContent(/16:30/);
    expect(dom).not.toHaveTextContent('김선희');
    expect(body).toBeInTheDocument();
    expect(body).toHaveTextContent(/김선희/);
    expect(body).toHaveTextContent(/상담사/);
    expect(sheet.querySelector('.client-cover__sheet-meta')).not.toBeInTheDocument();
    expect(sheet.innerHTML).not.toContain('&nbsp;');
  });

  test('has: memo renders meta; empty memo omits meta row', () => {
    const { rerender } = renderSheet({
      nextSchedule: {
        date: '2099-09-20',
        startTime: '10:00',
        status: 'CONFIRMED',
        consultantName: '이상담',
        consultationMethod: 'FACE',
        centerMemo: '3층 대기'
      }
    });

    expect(screen.getByTestId(CLIENT_COVER_NEXT_SHEET_TEST_ID)
      .querySelector('.client-cover__sheet-meta')).toHaveTextContent('3층 대기');

    rerender(
      <MemoryRouter>
        <NextSheet
          sheetMode={CLIENT_COVER_SHEET_MODE.HAS}
          remainingSessions={4}
          pendingPaymentCount={0}
          nextSchedule={{
            date: '2099-09-20',
            startTime: '10:00',
            status: 'CONFIRMED',
            consultantName: '이상담',
            consultationMethod: 'FACE',
            centerMemo: '   '
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId(CLIENT_COVER_NEXT_SHEET_TEST_ID)
      .querySelector('.client-cover__sheet-meta')).not.toBeInTheDocument();
  });
});
