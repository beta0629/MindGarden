/**
 * ScheduleDetailModal — 예약 확정 실패 시 서버가 준 사유를 그대로 안내한다.
 *
 * 번역 문구는 {{message}} 자리표시자를 쓰고, 사유는 공용 ajax 오류 추출기로 읽는다.
 * 사유가 없으면 일반 실패 문구로 대체하고, 「${」 같은 원문 템플릿이 화면에 나오지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-06
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockNavigate = jest.fn();
const mockGet = jest.fn();
const mockPut = jest.fn();
let mockSessionUser = { id: 1, role: 'ADMIN' };

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => mockNavigate
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, params) => {
      const scheduleKo = require('../../../locales/ko/schedule.json');
      const match = /^schedule:(.+)$/.exec(String(key));
      if (!match) {
        return key;
      }
      const resolved = match[1]
        .split('.')
        .reduce((acc, part) => (acc == null ? undefined : acc[part]), scheduleKo);
      if (typeof resolved !== 'string') {
        return key;
      }
      return resolved.replace(/\{\{(\w+)\}\}/g, (_m, name) => String(params?.[name] ?? ''));
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

const CONFIRM_LABEL = '예약 확정';

const buildSchedule = () => ({
  id: 9501,
  clientId: 4701,
  consultantId: 41,
  mappingId: 801,
  clientName: '내담자',
  consultantName: '상담사',
  date: '2099-01-10',
  sessionDate: '2099-01-10',
  startTime: '12:00',
  endTime: '13:00',
  consultationType: 'INDIVIDUAL',
  status: 'BOOKED',
  statusCode: 'BOOKED'
});

const openConfirmAndSubmit = async() => {
  render(
    <ScheduleDetailModal
      isOpen
      onClose={jest.fn()}
      scheduleData={buildSchedule()}
      onScheduleUpdated={jest.fn()}
    />
  );
  const openButton = await screen.findByRole('button', { name: CONFIRM_LABEL });
  fireEvent.click(openButton);
  const submitButtons = await screen.findAllByRole('button', { name: /확정/ });
  fireEvent.click(submitButtons[submitButtons.length - 1]);
};

describe('ScheduleDetailModal 예약 확정 실패 안내', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionUser = { id: 1, role: 'ADMIN' };
    mockGet.mockResolvedValue({ records: [] });
  });

  test('서버 오류 본문의 message 를 실패 안내에 넣는다', async() => {
    const serverReason = '연결된 매칭을 찾을 수 없어 가예약 일정을 확정할 수 없습니다.';
    const error = new Error('Request failed with status code 400');
    error.response = { status: 400, data: { success: false, message: serverReason } };
    mockPut.mockRejectedValue(error);

    await openConfirmAndSubmit();

    await waitFor(() => expect(notificationManager.error).toHaveBeenCalled());
    const shown = notificationManager.error.mock.calls[0][0];
    expect(shown).toBe(`예약 확정에 실패했습니다: ${serverReason}`);
    expect(shown).not.toContain('${');
    expect(shown).not.toContain('{{');
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/schedules/9501/confirm'),
      expect.any(Object)
    );
  });

  test('서버 사유가 없으면 일반 실패 문구로 대체한다', async() => {
    mockPut.mockRejectedValue(new Error('Network Error'));

    await openConfirmAndSubmit();

    await waitFor(() => expect(notificationManager.error).toHaveBeenCalled());
    expect(notificationManager.error.mock.calls[0][0]).toBe('예약 확정에 실패했습니다.');
  });
});
