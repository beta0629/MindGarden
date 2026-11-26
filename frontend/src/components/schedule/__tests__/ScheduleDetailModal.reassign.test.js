/**
 * ScheduleDetailModal — 배정 변경 CTA 는 ADMIN only. 지난(완료) 일정도 허용.
 *
 * @author MindGarden
 * @since 2026-11-26
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

const mockNavigate = jest.fn();
const mockGet = jest.fn(() => Promise.resolve([]));
let mockSessionUser = { id: 1, role: 'ADMIN' };

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, opts) => {
      const scheduleKo = require('../../../locales/ko/schedule.json');
      const match = /^schedule:(.+)$/.exec(String(key));
      if (!match) {
        return opts?.defaultValue ?? key;
      }
      const resolved = match[1]
        .split('.')
        .reduce((acc, part) => (acc == null ? undefined : acc[part]), scheduleKo);
      return resolved ?? opts?.defaultValue ?? key;
    },
    i18n: { language: 'ko' }
  })
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    put: jest.fn(),
    post: jest.fn()
  }
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  __esModule: true,
  getCommonCodes: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), show: jest.fn() }
}));

jest.mock('../../../contexts/SessionContext', () => ({
  __esModule: true,
  SessionContext: { Consumer: ({ children }) => children({}) },
  useSession: () => ({ user: mockSessionUser })
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions }) => (isOpen ? (
    <div data-testid="unified-modal">
      <div data-testid="unified-modal-body">{children}</div>
      <div data-testid="unified-modal-actions">{actions}</div>
    </div>
  ) : null)
}));

jest.mock('../ScheduleClientNotesSection', () => ({
  __esModule: true,
  default: () => <div data-testid="client-notes-stub" />
}));

jest.mock('../molecules/SchedulePartyQuickViewModal', () => ({
  __esModule: true,
  default: () => <div data-testid="party-quick-view-stub" />
}));

jest.mock('../../admin/mapping-management/integrated-schedule/molecules/VehiclePlateQuickRegisterModal', () => ({
  __esModule: true,
  default: () => <div data-testid="vehicle-plate-stub" />
}));

jest.mock('../../consultant/molecules/ClientSummaryField', () => ({
  __esModule: true,
  default: ({ children, label }) => (
    <div data-testid="client-summary-stub">
      <span>{label}</span>
      {children}
    </div>
  )
}));

jest.mock('../../ui/Card/index', () => ({
  __esModule: true,
  ProfileCard: ({ name, children }) => <div data-testid="profile-card-stub">{name}{children}</div>
}));

jest.mock('../ScheduleReassignMappingPanel', () => ({
  __esModule: true,
  default: ({ isOpen }) => (isOpen ? <div data-testid="reassign-panel-open" /> : null)
}));

import ScheduleDetailModal from '../ScheduleDetailModal';

const baseSchedule = {
  id: 501,
  mappingId: 100,
  clientId: 10,
  consultantId: 20,
  clientName: '내담자',
  consultantName: '상담사',
  status: 'COMPLETED',
  title: '완료 일정',
  totalSessions: 10,
  remainingSessions: 5,
  usedSessions: 5,
  sessionDate: '2026-01-01',
  startTime: '10:00',
  endTime: '11:00'
};

describe('ScheduleDetailModal reassign CTA', () => {
  beforeEach(() => {
    mockSessionUser = { id: 1, role: 'ADMIN' };
    mockGet.mockResolvedValue([]);
  });

  test('ADMIN + mappingId → 배정 변경 CTA (완료 일정도)', () => {
    render(
      <ScheduleDetailModal
        isOpen
        onClose={jest.fn()}
        scheduleData={baseSchedule}
      />
    );
    expect(screen.getByTestId('schedule-detail-reassign-mapping')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-detail-reassign-mapping')).toHaveTextContent('배정 변경');
  });

  test('STAFF → CTA 없음', () => {
    mockSessionUser = { id: 2, role: 'STAFF' };
    render(
      <ScheduleDetailModal
        isOpen
        onClose={jest.fn()}
        scheduleData={baseSchedule}
      />
    );
    expect(screen.queryByTestId('schedule-detail-reassign-mapping')).not.toBeInTheDocument();
  });

  test('CONSULTANT → CTA 없음', () => {
    mockSessionUser = { id: 3, role: 'CONSULTANT' };
    render(
      <ScheduleDetailModal
        isOpen
        onClose={jest.fn()}
        scheduleData={baseSchedule}
      />
    );
    expect(screen.queryByTestId('schedule-detail-reassign-mapping')).not.toBeInTheDocument();
  });

  test('mappingId 없으면 CTA 없음', () => {
    render(
      <ScheduleDetailModal
        isOpen
        onClose={jest.fn()}
        scheduleData={{ ...baseSchedule, mappingId: null, consultationMappingId: null }}
      />
    );
    expect(screen.queryByTestId('schedule-detail-reassign-mapping')).not.toBeInTheDocument();
  });
});
