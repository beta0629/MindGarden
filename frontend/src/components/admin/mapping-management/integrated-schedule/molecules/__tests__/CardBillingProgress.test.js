/**
 * CardBillingProgress — 사이드바 누적 진행 한 줄 테스트
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
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
    expect(screen.queryByTestId('mapping-card-billing-schedule-glance')).not.toBeInTheDocument();
  });

  it('shows institution-link cumulative from COMPLETED schedules (ignores stale lifetime count)', () => {
    render(
      <CardBillingProgress
        isInstitutionLink
        clientCompletedConsultationCount={99}
        consultationSchedules={[
          { id: 1, date: '2026-08-31', status: 'COMPLETED' },
          { id: 2, date: '2026-09-07', status: 'COMPLETED' },
          { id: 3, date: '2026-09-14', status: 'BOOKED' }
        ]}
      />
    );
    expect(screen.getByTestId('mapping-card-billing-progress-line')).toHaveTextContent(
      '이 연동 누적 2회'
    );
    expect(screen.queryByTestId('mapping-card-billing-schedule-glance')).not.toBeInTheDocument();
    expect(screen.queryByText('일정 이력 있음')).not.toBeInTheDocument();
  });

  it('IL cumulative refreshes when enrich adds a new COMPLETED row', () => {
    const { rerender } = render(
      <CardBillingProgress
        isInstitutionLink
        consultationSchedules={[
          { id: 1, date: '2026-09-07', status: 'COMPLETED' }
        ]}
      />
    );
    expect(screen.getByTestId('mapping-card-billing-progress-line')).toHaveTextContent(
      '이 연동 누적 1회'
    );

    rerender(
      <CardBillingProgress
        isInstitutionLink
        consultationSchedules={[
          { id: 1, date: '2026-09-07', status: 'COMPLETED' },
          { id: 2, date: '2026-09-21', status: 'COMPLETED' }
        ]}
      />
    );
    expect(screen.getByTestId('mapping-card-billing-progress-line')).toHaveTextContent(
      '이 연동 누적 2회'
    );
  });

  it('does not render schedule toggle/list on the sidebar card', () => {
    render(
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
    );

    expect(screen.getByTestId('mapping-card-billing-progress')).toHaveTextContent(
      '누적 진행 2회 / 총 10회 · 잔여 8'
    );
    expect(screen.queryByTestId('mapping-card-billing-schedule-toggle')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mapping-card-billing-schedule-list')).not.toBeInTheDocument();
    expect(screen.queryByText('9/7 · 14:00 · 완료 · 1회차')).not.toBeInTheDocument();
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

  it('shows progress 1 remaining 0 for a completed single-session package', () => {
    render(
      <CardBillingProgress
        usedSessions={0}
        totalSessions={1}
        remainingSessions={1}
        consultationSchedules={[
          { id: 1, date: '2026-09-20', status: 'COMPLETED' }
        ]}
      />
    );
    expect(screen.getByTestId('mapping-card-billing-progress')).toHaveTextContent(
      '누적 진행 1회 / 총 1회 · 잔여 0'
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
