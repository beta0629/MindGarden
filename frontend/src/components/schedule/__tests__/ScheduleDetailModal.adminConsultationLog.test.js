/**
 * ScheduleDetailModal — 관리자(ADMIN) 상담일지 작성·수정 진입점, 사무원(STAFF)·내담자 비노출.
 *
 * 관리자는 상담사와 같은 「상담일지 작성」/「보기/수정」 버튼으로 같은 ConsultationLogModal 을 연다
 * (onConsultationLogOpen). 사무원·내담자는 본문 권한이 없으므로(canAccessConsultationLogBody)
 * 버튼도, 일지 조회 호출도 없다. 최종 권한 판정은 서버 공용 가드가 한다.
 *
 * @author MindGarden
 * @since 2026-10-06
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

const mockNavigate = jest.fn();
const mockGet = jest.fn();
let mockSessionUser = { id: 1, role: 'ADMIN' };

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
  default: () => <div data-testid="client-summary-stub" />
}));

jest.mock('../../ui/Card/index', () => ({
  __esModule: true,
  ProfileCard: ({ children }) => <div data-testid="profile-card-stub">{children}</div>
}));

import ScheduleDetailModal from '../ScheduleDetailModal';

const buildSchedule = (overrides = {}) => ({
  id: 9391,
  clientId: 4700,
  consultantId: 41,
  clientName: '내담자',
  consultantName: '상담사',
  date: '2026-09-10',
  sessionDate: '2026-09-10',
  startTime: '12:00',
  endTime: '13:00',
  consultationType: 'INDIVIDUAL',
  status: 'COMPLETED',
  statusCode: 'COMPLETED',
  ...overrides
});

const renderModal = (schedule, onConsultationLogOpen = jest.fn()) => render(
  <ScheduleDetailModal
    isOpen
    onClose={jest.fn()}
    scheduleData={schedule}
    onScheduleUpdated={jest.fn()}
    onConsultationLogOpen={onConsultationLogOpen}
  />
);

describe.each([
  ['ADMIN', { id: 1, role: 'ADMIN' }]
])('ScheduleDetailModal 관리자 상담일지 진입점 (%s)', (_label, sessionUser) => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionUser = sessionUser;
  });

  test('일지 0건 → 「상담일지 작성」 클릭 시 같은 일정으로 상담일지 모달을 연다', async() => {
    mockGet.mockResolvedValue({ records: [] });
    const onConsultationLogOpen = jest.fn();
    const schedule = buildSchedule();

    renderModal(schedule, onConsultationLogOpen);

    const button = await screen.findByTestId('schedule-detail-write-consultation-log-completed');
    expect(button).toHaveTextContent('상담일지 작성');
    button.click();

    expect(onConsultationLogOpen).toHaveBeenCalledWith(expect.objectContaining({ id: schedule.id, consultantId: 41 }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('일지 존재 → 「보기/수정」 클릭 시 목록 이동 없이 상담일지 모달을 연다', async() => {
    mockGet.mockResolvedValue({ records: [{ id: 370 }] });
    const onConsultationLogOpen = jest.fn();
    const schedule = buildSchedule();

    renderModal(schedule, onConsultationLogOpen);

    const button = await screen.findByTestId('schedule-detail-open-consultation-log');
    expect(screen.queryByTestId('schedule-detail-write-consultation-log-completed')).not.toBeInTheDocument();
    button.click();

    expect(onConsultationLogOpen).toHaveBeenCalledWith(expect.objectContaining({ id: schedule.id }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe.each([
  ['내담자', { id: 4700, role: 'CLIENT' }],
  ['사무원(STAFF)', { id: 2, role: 'STAFF' }]
])('ScheduleDetailModal %s', (label, sessionUser) => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionUser = sessionUser;
  });

  test.each(['COMPLETED', 'CONFIRMED'])(`${label}에게는 작성·보기/수정 버튼이 없고 일지 조회도 하지 않는다 (%s)`, async(status) => {
    mockGet.mockResolvedValue({ records: [] });

    renderModal(buildSchedule({ status, statusCode: status }));

    await waitFor(() => {
      expect(screen.getByTestId('unified-modal-actions')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('schedule-detail-write-consultation-log-completed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('schedule-detail-write-consultation-log')).not.toBeInTheDocument();
    expect(screen.queryByTestId('schedule-detail-open-consultation-log')).not.toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalledWith('/api/v1/schedules/consultation-records', expect.anything());
  });
});
