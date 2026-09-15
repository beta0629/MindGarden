/**
 * MappingScheduleCard — Clinic-OS sidebar card v2.1 structure
 * SSOT: docs/design-system/clinic-os-sidebar-cards.md
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MappingScheduleCard from '../MappingScheduleCard';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key) => key }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../../../common/CardContainer', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="card-container">{children}</div>
}));

jest.mock('../../molecules/CardActionGroup', () => ({
  __esModule: true,
  default: () => <div data-testid="card-action-group" />
}));

const MOCK_MAPPING = {
  id: 42,
  consultantName: '김상담',
  clientName: '이내담',
  status: 'ACTIVE',
  usedSessions: 2,
  totalSessions: 10,
  remainingSessions: 8
};

describe('MappingScheduleCard Clinic-OS v2.1', () => {
  it('does not render SessionProgressIndicator; renders ticket track', () => {
    render(<MappingScheduleCard mapping={MOCK_MAPPING} />);

    expect(screen.queryByTestId('session-progress-indicator')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByTestId('mapping-card-ticket-track')).toBeInTheDocument();
  });

  it('renders horizontal identity line with captions and bold names', () => {
    const { container } = render(<MappingScheduleCard mapping={MOCK_MAPPING} />);

    const partiesLine = container.querySelector('.integrated-schedule__card-parties-line');
    expect(partiesLine).toBeTruthy();
    expect(partiesLine.querySelector('.integrated-schedule__card-identity--consultant')).toBeTruthy();
    expect(partiesLine.querySelector('.integrated-schedule__card-identity--client')).toBeTruthy();
    expect(partiesLine.querySelector('.integrated-schedule__card-parties-sep')).toBeTruthy();

    expect(screen.getByText('상담')).toBeInTheDocument();
    expect(screen.getByText('내담자')).toBeInTheDocument();
    expect(screen.getByText('김상담')).toBeInTheDocument();
    expect(screen.getByText('이내담')).toBeInTheDocument();
  });

  it('renders muted package as sibling under parties (not under client identity)', () => {
    render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          packageName: 'Package A + Package B'
        }}
      />
    );

    expect(screen.getByText('Package A')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    const packageEl = screen.getByText('Package A').closest('.integrated-schedule__card-package');
    expect(packageEl).toBeTruthy();
    expect(packageEl.closest('.integrated-schedule__card-identity--client')).toBeNull();
    expect(packageEl.closest('.integrated-schedule__card-parties-line')).toBeNull();
    expect(packageEl.closest('.integrated-schedule__card-parties')).toBeTruthy();
    expect(packageEl.closest('.integrated-schedule__card-meta')).toBeNull();
  });

  it('shows 기관연동 badge for INSTITUTION_LINK without remaining mute', () => {
    render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          paymentTiming: 'INSTITUTION_LINK',
          remainingSessions: 0,
          clientCompletedConsultationCount: 3
        }}
      />
    );
    expect(screen.getByTestId('engagement-type-badge')).toHaveTextContent('기관연동');
    // mute는 배지와 문구 이중 렌더 금지 — 일정 요약만
    expect(screen.getByTestId('mapping-card-meta-mute')).toHaveTextContent('일정 미등록');
    expect(screen.getByTestId('mapping-card-meta-mute')).not.toHaveTextContent('기관연동');
    expect(screen.getByTestId('mapping-card-meta-mute')).not.toHaveTextContent('잔여');
    expect(screen.queryByTestId('mapping-card-todo-pill')).not.toBeInTheDocument();
  });

  it('does not render voucher badge when voucher data is missing', () => {
    render(<MappingScheduleCard mapping={MOCK_MAPPING} />);
    expect(screen.queryByTestId('engagement-type-badge')).not.toBeInTheDocument();
  });

  it('renders mute meta with remaining and schedule unregistered', () => {
    render(<MappingScheduleCard mapping={MOCK_MAPPING} />);
    expect(screen.getByTestId('mapping-card-meta-mute')).toHaveTextContent('잔여 8 · 일정 미등록');
  });

  it('renders mute meta with registered schedule date', () => {
    render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          hasConsultationSchedule: true,
          nextConsultationDate: '2026-07-20'
        }}
      />
    );
    expect(screen.getByTestId('mapping-card-meta-mute')).toHaveTextContent(
      '잔여 8 · 일정 등록 · 7/20'
    );
  });

  it('shows amber 결제 대기 pill for PENDING_PAYMENT (not chip cloud)', () => {
    const { container } = render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          status: 'PENDING_PAYMENT',
          paymentTiming: 'SAME_DAY_CARD',
          remainingSessions: 0
        }}
      />
    );
    const pill = screen.getByTestId('mapping-card-todo-pill');
    expect(pill).toHaveTextContent('결제 대기');
    expect(pill).toHaveClass('integrated-schedule__card-todo-pill');
    expect(container.querySelector('.mg-v2-badge--success')).toBeNull();
    expect(container.querySelector('.integrated-schedule__card-schedule-status--registered')).toBeNull();
    expect(container.querySelector('.mg-v2-status-badge')).toBeNull();
    expect(container.querySelector('.mg-v2-count-badge')).toBeNull();
  });

  it('shows ≤1 amber pill for desync STATUS (상태 불일치)', () => {
    render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          remainingSessions: 0,
          hasConsultationSchedule: true,
          nextConsultationDate: '2026-07-20'
        }}
      />
    );
    const pills = screen.getAllByTestId('mapping-card-todo-pill');
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent('상태 불일치');
    expect(screen.queryByText('일정 등록 · 7/20')).not.toBeInTheDocument();
  });

  it('keeps mute schedule for SESSIONS_EXHAUSTED + nextDate without desync pill', () => {
    render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          status: 'SESSIONS_EXHAUSTED',
          remainingSessions: 0,
          hasConsultationSchedule: true,
          nextConsultationDate: '2026-07-20'
        }}
      />
    );
    expect(screen.queryByTestId('mapping-card-todo-pill')).not.toBeInTheDocument();
    expect(screen.getByTestId('mapping-card-meta-mute')).toHaveTextContent(
      '잔여 0 · 일정 등록 · 7/20'
    );
  });

  it('renders zero ticket fill when session counts are missing', () => {
    render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          usedSessions: undefined,
          totalSessions: undefined,
          remainingSessions: undefined
        }}
      />
    );
    const track = screen.getByTestId('mapping-card-ticket-track');
    expect(track).toHaveStyle({ '--integrated-schedule-ticket-fill': '0%' });
    expect(screen.getByTestId('mapping-card-meta-mute')).toHaveTextContent('잔여 0 · 일정 미등록');
  });

  it('sets non-zero ticket fill CSS var from usedSessions/totalSessions (ink fill visible)', () => {
    render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          usedSessions: 2,
          totalSessions: 10
        }}
      />
    );
    const track = screen.getByTestId('mapping-card-ticket-track');
    expect(track).toHaveStyle({ '--integrated-schedule-ticket-fill': '20%' });
  });

  it('shows voucher cumulative progress and expandable schedule dates for billing scan', () => {
    render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          usedSessions: 2,
          totalSessions: 10,
          remainingSessions: 8,
          consultationSchedules: [
            { id: 11, date: '2026-09-07', status: 'COMPLETED', sessionSequence: 1 },
            { id: 12, date: '2026-09-14', status: 'BOOKED', sessionSequence: 2 }
          ]
        }}
      />
    );
    expect(screen.getByTestId('mapping-card-billing-progress')).toHaveTextContent(
      '누적 진행 2회 / 총 10회 · 잔여 8'
    );
    expect(screen.getByTestId('mapping-card-billing-schedule-toggle')).toHaveTextContent('일정 2건');
  });

  it('shows institution-link lifetime cumulative and client schedule list (not used/total)', () => {
    render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          paymentTiming: 'INSTITUTION_LINK',
          usedSessions: 0,
          totalSessions: 1,
          remainingSessions: 0,
          clientCompletedConsultationCount: 3,
          consultationSchedules: [
            { id: 99, date: '2026-09-01', status: 'BOOKED' }
          ],
          clientConsultationSchedules: [
            { id: 11, date: '2026-08-31', startTime: '14:00:00', status: 'COMPLETED' },
            { id: 12, date: '2026-09-07', startTime: '10:30', status: 'COMPLETED' },
            { id: 13, date: '2026-09-14', startTime: '11:00', status: 'BOOKED' }
          ]
        }}
      />
    );
    expect(screen.getByTestId('mapping-card-billing-progress')).toHaveTextContent('누적 3회');
    expect(screen.getByTestId('mapping-card-billing-progress')).not.toHaveTextContent('총 1회');
    expect(screen.getByTestId('mapping-card-billing-schedule-glance')).toHaveTextContent(
      '8월 8/31 · 9월 9/7 · 9/14'
    );
    expect(screen.queryByText('일정 이력 있음')).not.toBeInTheDocument();
    expect(screen.getByTestId('mapping-card-meta-mute')).toHaveTextContent(
      '8월 8/31 · 9월 9/7 · 9/14'
    );
    expect(screen.getByTestId('mapping-card-meta-mute')).not.toHaveTextContent('기관연동');
    expect(screen.getByTestId('mapping-card-billing-schedule-toggle')).toHaveTextContent('일정 3건');
    expect(screen.getByTestId('mapping-card-ticket-track')).toHaveStyle({
      '--integrated-schedule-ticket-fill': '0%'
    });
  });

  /**
   * 표시 SSOT = institution_link_contracts.prepaid_amount.
   * FT #241 금액(9만) UPDATE/DATAFIX 금지. 카드는 단회기 9만 숨김 + 초기상담료(선납) 10만.
   */
  it('IL prepaidAmount shows 초기상담료(선납) and hides 단회기 90,000', () => {
    render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          paymentTiming: 'INSTITUTION_LINK',
          packageName: '단회기 90,000원',
          packagePrice: 90000,
          institutionLinkPrepaidAmount: 100000,
          remainingSessions: 0,
          clientCompletedConsultationCount: 3
        }}
      />
    );
    expect(screen.getByText('초기상담료(선납) 100,000원')).toBeInTheDocument();
    expect(screen.queryByText('단회기 90,000원')).not.toBeInTheDocument();
    expect(screen.queryByText(/90,000/)).not.toBeInTheDocument();
  });

  it('regular mapping keeps packageName', () => {
    render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          paymentTiming: 'ADVANCE',
          packageName: '단회기 90,000원'
        }}
      />
    );
    expect(screen.getByText('단회기 90,000원')).toBeInTheDocument();
  });
});
