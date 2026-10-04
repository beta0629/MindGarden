/**
 * ScheduleDetailModal — 관리자 「완료 처리」 버튼 시작 전 비활성·툴팁, 서버 400 안내.
 *
 * 판정은 공용 util(canCompleteScheduleNow)만 쓰고 최종 판정은 서버(ScheduleSessionStartGate)가 한다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockNavigate = jest.fn();
const mockGet = jest.fn();
const mockPut = jest.fn();
const mockSessionUser = { id: 1, role: 'ADMIN' };

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => mockNavigate
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => {
      const scheduleKo = require('../../../locales/ko/schedule.json');
      const match = /^schedule:(.+)$/.exec(String(key));
      if (!match) {
        return key;
      }
      const resolved = match[1]
        .split('.')
        .reduce((acc, part) => (acc == null ? undefined : acc[part]), scheduleKo);
      return resolved ?? key;
    },
    i18n: { language: 'ko' }
  })
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    put: (...args) => mockPut(...args),
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
  default: () => <div data-testid="client-summary-stub" />
}));

jest.mock('../../ui/Card/index', () => ({
  __esModule: true,
  ProfileCard: ({ children }) => <div data-testid="profile-card-stub">{children}</div>
}));

import ScheduleDetailModal from '../ScheduleDetailModal';

import notificationManager from '../../../utils/notification';
import scheduleKo from '../../../locales/ko/schedule.json';

const TOOLTIP = scheduleKo.ScheduleDetailModal.completeBeforeStartTooltip;
const PAST_DATE = '2020-01-06';
const FUTURE_DATE = `${new Date().getFullYear() + 2}-01-06`;

const buildSchedule = (overrides = {}) => ({
  id: 9392,
  clientId: 4701,
  consultantId: 42,
  clientName: '내담자',
  consultantName: '상담사',
  date: FUTURE_DATE,
  sessionDate: FUTURE_DATE,
  startTime: '15:00',
  endTime: '15:50',
  consultationType: 'INDIVIDUAL',
  status: 'CONFIRMED',
  statusCode: 'CONFIRMED',
  ...overrides
});

const renderModal = (schedule) => render(
  <ScheduleDetailModal
    isOpen
    onClose={jest.fn()}
    scheduleData={schedule}
    onScheduleUpdated={jest.fn()}
    onConsultationLogOpen={jest.fn()}
  />
);

describe('ScheduleDetailModal 완료 처리 — 일정 시작 전 차단', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ records: [] });
  });

  test('시작 전(미래 일정) → 완료 버튼 비활성 + 툴팁, 클릭해도 PUT 없음', async() => {
    renderModal(buildSchedule());

    const button = await screen.findByTestId('schedule-detail-complete');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', TOOLTIP);
    fireEvent.click(button);
    expect(mockPut).not.toHaveBeenCalled();
  });

  test('시작 후 → 완료 버튼 활성, 클릭 시 status=COMPLETED PUT', async() => {
    mockPut.mockResolvedValue({ id: 9392, status: 'COMPLETED' });
    renderModal(buildSchedule({ date: PAST_DATE, sessionDate: PAST_DATE }));

    const button = await screen.findByTestId('schedule-detail-complete');
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('title');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/v1/schedules/9392', { status: 'COMPLETED' });
    });
  });

  test('서버가 시작 전으로 거부(400 SCHEDULE_SESSION_NOT_STARTED) → 시작 전 안내 문구', async() => {
    const error = new Error('bad request');
    error.status = 400;
    error.response = { data: { errorCode: 'SCHEDULE_SESSION_NOT_STARTED' } };
    mockPut.mockRejectedValue(error);
    renderModal(buildSchedule({ date: PAST_DATE, sessionDate: PAST_DATE }));

    fireEvent.click(await screen.findByTestId('schedule-detail-complete'));

    await waitFor(() => {
      expect(notificationManager.error).toHaveBeenCalledWith(TOOLTIP);
    });
  });
});
