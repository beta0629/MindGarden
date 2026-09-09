/**
 * MappingScheduleCard.clinicOsChrome — SSOT structure gate (v2)
 * docs/design-system/clinic-os-sidebar-cards.md
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import MappingScheduleCard from '../MappingScheduleCard';
import CardActionGroup from '../../molecules/CardActionGroup';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => {
      const labels = {
        'admin:mapping.card.actions.checkoutSameDayPayment': '당일 결제',
        'admin:mapping.card.actions.changePackage': '패키지 변경',
        'admin:mapping.card.actions.cancel': '배정 취소',
        'admin:mapping.card.actions.confirmAndActivate': '입금 확인 후 활성화',
        'admin:mapping.card.actions.activateMapping': '배정 활성화',
        'admin.actions.paymentConfirm': '결제 확인'
      };
      return labels[key] || key;
    }
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../../../common/CardContainer', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="card-container">{children}</div>
}));

jest.mock('../../../../../common/ActionBar', () => ({
  __esModule: true,
  default: ({ children, className }) => (
    <div data-testid="action-bar" className={className}>{children}</div>
  )
}));

jest.mock('../../../../../common/ActionBarButton', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    'aria-label': ariaLabel,
    disabled,
    loading,
    'data-testid': testId,
    className,
    variant
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled || loading}
      data-testid={testId}
      className={className}
      data-variant={variant}
    >
      {children}
    </button>
  )
}));

jest.mock('../../../../../common', () => ({
  __esModule: true,
  CardActionGroup: ({ children, className }) => (
    <div data-testid="common-card-actions" className={className}>{children}</div>
  )
}));

const SAME_DAY = {
  id: 12,
  status: 'PENDING_PAYMENT',
  paymentTiming: 'SAME_DAY_CARD',
  consultantName: '김상담',
  clientName: '이내담',
  packageName: 'Basic',
  usedSessions: 0,
  totalSessions: 10,
  remainingSessions: 10,
  hasConsultationSchedule: false
};

describe('MappingScheduleCard.clinicOsChrome', () => {
  it('dual identity captions + ticket track + ≤1 amber pill + no green chip classes', () => {
    const { container } = render(<MappingScheduleCard mapping={SAME_DAY} />);

    expect(screen.getByText('상담')).toBeInTheDocument();
    expect(screen.getByText('내담자')).toBeInTheDocument();
    expect(screen.getByTestId('mapping-card-ticket-track')).toBeInTheDocument();
    expect(screen.queryByTestId('session-progress-indicator')).toBeNull();

    const pills = screen.getAllByTestId('mapping-card-todo-pill');
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent('결제 대기');

    expect(container.querySelector('.mg-v2-badge--success')).toBeNull();
    expect(container.querySelector('.integrated-schedule__card-schedule-status--registered')).toBeNull();
    expect(container.querySelector('.integrated-schedule__card-schedule-status')).toBeNull();
    expect(container.querySelector('.mg-v2-status-badge')).toBeNull();
    expect(container.querySelector('.mg-v2-count-badge')).toBeNull();

    expect(screen.getByTestId('mapping-card-meta-mute')).toHaveTextContent(
      '잔여 10 · 일정 미등록'
    );
  });

  it('2-row actions: schedule ghost + 당일 결제 primary; package+cancel ghost; cancel brick class', () => {
    render(
      <CardActionGroup
        mapping={SAME_DAY}
        onScheduleFromCard={jest.fn()}
        onCheckoutSameDay={jest.fn()}
        onChangePendingPackage={jest.fn()}
        onCancelPendingMapping={jest.fn()}
      />
    );

    const scheduleBtn = screen.getByLabelText('일정 등록');
    expect(scheduleBtn).toHaveAttribute('data-variant', 'ghost');

    const checkoutBtn = screen.getByLabelText('당일 결제');
    expect(checkoutBtn).toHaveAttribute('data-variant', 'primary');
    expect(checkoutBtn).toHaveTextContent('당일 결제');

    const packageBtn = screen.getByTestId('mapping-pending-package-edit-trigger');
    expect(packageBtn).toHaveAttribute('data-variant', 'ghost');
    expect(packageBtn).toHaveTextContent('패키지 변경');

    const cancelBtn = screen.getByTestId('mapping-cancel-pending-trigger');
    expect(cancelBtn).toHaveAttribute('data-variant', 'ghost');
    expect(cancelBtn).toHaveClass('integrated-schedule__btn-cancel-pending');
    expect(cancelBtn).toHaveTextContent('배정 취소');
  });

  it('MatchingScheduleList CSS encodes 2-row grid + cancel soft border + paper + selected chrome', () => {
    const listCssPath = path.join(__dirname, '../MatchingScheduleList.css');
    const listCss = fs.readFileSync(listCssPath, 'utf8');
    expect(listCss).toMatch(/grid-template-columns:\s*1fr 1fr/);
    expect(listCss).toMatch(/display:\s*contents/);
    expect(listCss).toMatch(/#FAF9F7/);
    expect(listCss).toMatch(/border-radius:\s*14px/);
    expect(listCss).toMatch(/#F1D4D4/);
    expect(listCss).toMatch(/#A84848/);
    expect(listCss).toMatch(/height:\s*36px/);
    expect(listCss).toMatch(/integrated-schedule__card--selected/);
    expect(listCss).toMatch(/#E2E8F0/);
    expect(listCss).toMatch(/#94A3B8/);
    expect(listCss).not.toMatch(/mg-v2-badge--success/);
  });

  it('MappingScheduleCard CSS encodes ticket track 3px + rail #E2E8F0 + fill #0F172A', () => {
    const cardCssPath = path.join(__dirname, '../MappingScheduleCard.css');
    const cardCss = fs.readFileSync(cardCssPath, 'utf8');
    expect(cardCss).toMatch(/\.integrated-schedule__card-ticket-track\s*\{[\s\S]*?height:\s*3px/);
    expect(cardCss).toMatch(/\.integrated-schedule__card-ticket-track-rail\s*\{[\s\S]*?#E2E8F0/);
    expect(cardCss).toMatch(/\.integrated-schedule__card-ticket-track-fill\s*\{[\s\S]*?#0F172A/);
    expect(cardCss).not.toMatch(/height:\s*6px/);
    expect(cardCss).not.toMatch(/#CBD5E1/);
  });

  it('CardMeta CSS encodes amber pill #FEF3C7/#92400E without #F59E0B border', () => {
    const metaCssPath = path.join(
      __dirname,
      '../../molecules/CardMeta.css'
    );
    const metaCss = fs.readFileSync(metaCssPath, 'utf8');
    expect(metaCss).toMatch(/#FEF3C7/);
    expect(metaCss).toMatch(/#92400E/);
    expect(metaCss).not.toMatch(/#F59E0B/);
  });

  it('IntegratedMatchingSchedule.css selected chrome only; status-btn/filter-label blocks untouched in this rule', () => {
    const scheduleCssPath = path.join(
      __dirname,
      '../../../IntegratedMatchingSchedule.css'
    );
    const scheduleCss = fs.readFileSync(scheduleCssPath, 'utf8');
    const selectedCardBlock = scheduleCss.match(
      /\.integrated-schedule__card--selected[\s\S]*?\.mg-v2-card-container\s*\{[^}]+\}/
    );
    expect(selectedCardBlock).not.toBeNull();
    expect(selectedCardBlock[0]).toMatch(/#E2E8F0/);
    expect(selectedCardBlock[0]).toMatch(/#94A3B8/);
    expect(selectedCardBlock[0]).not.toMatch(/status-btn/);
    expect(selectedCardBlock[0]).not.toMatch(/filter-label/);
  });
});
