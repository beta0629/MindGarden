/**
 * CardBillingProgress — 누적 진행·한눈 일시·접이식 일정 테스트
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CardBillingProgress from '../CardBillingProgress';

describe('CardBillingProgress', () => {
  it('renders cumulative progress for billing scan', () => {
    render(
      <CardBillingProgress
        usedSessions={2}
        totalSessions={10}
        remainingSessions={8}
        consultationSchedules={[]}
      />
    );
    expect(screen.getByTestId('mapping-card-billing-progress')).toHaveTextContent(
      '누적 진행 2회 / 총 10회 · 잔여 8'
    );
    expect(screen.queryByTestId('mapping-card-billing-schedule-toggle')).not.toBeInTheDocument();
  });

  it('shows institution-link cumulative and monthly glance without expand', () => {
    render(
      <CardBillingProgress
        isInstitutionLink
        clientCompletedConsultationCount={3}
        consultationSchedules={[
          { id: 1, date: '2026-08-31', status: 'COMPLETED' },
          { id: 2, date: '2026-09-07', status: 'COMPLETED' },
          { id: 3, date: '2026-09-14', status: 'BOOKED' }
        ]}
      />
    );
    expect(screen.getByTestId('mapping-card-billing-progress-line')).toHaveTextContent(
      '누적 3회'
    );
    expect(screen.getByTestId('mapping-card-billing-schedule-glance')).toHaveTextContent(
      '8월 31일 · 9월 7일 · 14일'
    );
    expect(screen.queryByText('일정 이력 있음')).not.toBeInTheDocument();
  });

  it('expands schedule dates/times without opening peek', () => {
    const onBodyClick = jest.fn();
    render(
      <div onClick={onBodyClick} role="presentation">
        <CardBillingProgress
          usedSessions={2}
          totalSessions={10}
          remainingSessions={8}
          consultationSchedules={[
            {
              id: 1,
              date: '2026-09-07',
              startTime: '14:00:00',
              status: 'COMPLETED',
              sessionSequence: 1
            },
            {
              id: 2,
              date: '2026-09-14',
              startTime: '10:30',
              status: 'BOOKED',
              sessionSequence: null
            }
          ]}
        />
      </div>
    );

    fireEvent.click(screen.getByTestId('mapping-card-billing-schedule-toggle'));
    expect(onBodyClick).not.toHaveBeenCalled();
    expect(screen.getByTestId('mapping-card-billing-schedule-list')).toHaveTextContent(
      '9/7 · 14:00 · 완료 · 1회차'
    );
    expect(screen.getByTestId('mapping-card-billing-schedule-list')).toHaveTextContent(
      '9/14 · 10:30 · 예약'
    );
  });

  it('coerces objectish values safely for React child guard', () => {
    render(
      <CardBillingProgress
        usedSessions={{ bad: true }}
        totalSessions={10}
        remainingSessions={8}
        consultationSchedules={[{ id: 9, date: '2026-09-01', status: 'COMPLETED' }]}
      />
    );
    expect(screen.getByTestId('mapping-card-billing-progress')).toHaveTextContent(
      '누적 진행 0회 / 총 10회 · 잔여 8'
    );
  });

  it('shows used-only progress when total is zero', () => {
    render(
      <CardBillingProgress
        usedSessions={3}
        totalSessions={0}
        remainingSessions={0}
        consultationSchedules={[]}
      />
    );
    expect(screen.getByTestId('mapping-card-billing-progress')).toHaveTextContent(
      '누적 진행 3회'
    );
  });
});
