/**
 * ScheduleDetailModal — 「상담일지 작성」 푸터 버튼 렌더 회귀 테스트.
 *
 * 운영 신고 (2026-09-12): 완료(COMPLETED) 처리만 되고 일지가 0건인 슬롯에서
 * 푸터에 「다시 예약」만 남아 상담사가 일지를 쓸 수 없었다.
 * 작성 버튼은 CONFIRMED·IN_PROGRESS 에만, 「보기/수정」 링크는 record 존재 시에만
 * 노출되던 분기 조합이 원인이다.
 *
 * @author MindGarden
 * @since 2026-09-12
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

const mockNavigate = jest.fn();
const mockGet = jest.fn();

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
  useSession: () => ({ user: { id: 41, role: 'CONSULTANT' } })
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

/** 운영 신고 형태(지난 날짜 12:00 슬롯). 식별자는 테스트 로컬 값. */
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

describe('ScheduleDetailModal 「상담일지 작성」 버튼 (완료 일정)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('COMPLETED + 일지 0건 → 「상담일지 작성」 노출, 「보기/수정」 미노출 (운영 신고 케이스)', async() => {
    mockGet.mockResolvedValue({ records: [] });

    renderModal(buildSchedule({ status: 'COMPLETED', statusCode: 'COMPLETED' }));

    await waitFor(() => {
      expect(screen.getByTestId('schedule-detail-write-consultation-log-completed')).toBeInTheDocument();
    });
    expect(screen.getByTestId('schedule-detail-write-consultation-log-completed'))
      .toHaveTextContent('상담일지 작성');
    expect(screen.queryByTestId('schedule-detail-open-consultation-log')).not.toBeInTheDocument();
    expect(screen.getByText('다시 예약')).toBeInTheDocument();
  });

  test('COMPLETED + 일지 존재 → 「보기/수정」만 노출 (작성 버튼과 상호배타)', async() => {
    mockGet.mockResolvedValue({ records: [{ id: 370 }] });

    renderModal(buildSchedule({ status: 'COMPLETED', statusCode: 'COMPLETED' }));

    await waitFor(() => {
      expect(screen.getByTestId('schedule-detail-open-consultation-log')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('schedule-detail-write-consultation-log-completed')).not.toBeInTheDocument();
  });

  test('COMPLETED + 일지 존재 여부 조회 실패 → 작성 버튼 노출 (진입점 유실 방지)', async() => {
    mockGet.mockRejectedValue(new Error('네트워크 오류'));

    renderModal(buildSchedule({ status: 'COMPLETED', statusCode: 'COMPLETED' }));

    await waitFor(() => {
      expect(screen.getByTestId('schedule-detail-write-consultation-log-completed')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('schedule-detail-open-consultation-log')).not.toBeInTheDocument();
  });

  test('작성 버튼 클릭 → onConsultationLogOpen 으로 해당 일정 전달', async() => {
    mockGet.mockResolvedValue({ records: [] });
    const onConsultationLogOpen = jest.fn();
    const schedule = buildSchedule({ status: 'COMPLETED', statusCode: 'COMPLETED' });

    renderModal(schedule, onConsultationLogOpen);

    const button = await screen.findByTestId('schedule-detail-write-consultation-log-completed');
    button.click();

    expect(onConsultationLogOpen).toHaveBeenCalledWith(expect.objectContaining({ id: schedule.id }));
  });

  test('CONFIRMED + 일지 0건 → 기존 작성 버튼 유지 (회귀 방지)', async() => {
    mockGet.mockResolvedValue({ records: [] });

    renderModal(buildSchedule({ status: 'CONFIRMED', statusCode: 'CONFIRMED' }));

    await waitFor(() => {
      expect(screen.getByTestId('schedule-detail-write-consultation-log')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('schedule-detail-open-consultation-log')).not.toBeInTheDocument();
  });

  test('CONFIRMED + 일지 존재 → 작성 버튼 유지, 보기/수정 미노출 (김민영/#130 회귀 방지)', async() => {
    mockGet.mockResolvedValue({ records: [{ id: 501 }] });

    renderModal(buildSchedule({ status: 'CONFIRMED', statusCode: 'CONFIRMED' }));

    await waitFor(() => {
      expect(screen.getByTestId('schedule-detail-write-consultation-log')).toBeInTheDocument();
    });
    expect(screen.getByTestId('schedule-detail-write-consultation-log'))
      .toHaveTextContent('상담일지 작성');
    expect(screen.queryByTestId('schedule-detail-open-consultation-log')).not.toBeInTheDocument();
    expect(screen.getByText('완료 처리')).toBeInTheDocument();
    expect(screen.getByText('예약 취소')).toBeInTheDocument();
  });

  test('CONFIRMED + 일지 조회 실패(null) → 작성 버튼 노출 (진입점 유실 방지)', async() => {
    mockGet.mockRejectedValue(new Error('네트워크 오류'));

    renderModal(buildSchedule({ status: 'CONFIRMED', statusCode: 'CONFIRMED' }));

    await waitFor(() => {
      expect(screen.getByTestId('schedule-detail-write-consultation-log')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('schedule-detail-open-consultation-log')).not.toBeInTheDocument();
    expect(screen.getByText('완료 처리')).toBeInTheDocument();
  });

  test('IN_PROGRESS + 일지 존재 → 작성 버튼 유지 (CONFIRMED와 동일)', async() => {
    mockGet.mockResolvedValue({ records: [{ id: 502 }] });

    renderModal(buildSchedule({ status: 'IN_PROGRESS', statusCode: 'IN_PROGRESS' }));

    await waitFor(() => {
      expect(screen.getByTestId('schedule-detail-write-consultation-log')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('schedule-detail-open-consultation-log')).not.toBeInTheDocument();
  });

  test('CANCELLED → 작성 버튼 미노출', async() => {
    mockGet.mockResolvedValue({ records: [] });

    renderModal(buildSchedule({ status: 'CANCELLED', statusCode: 'CANCELLED' }));

    await waitFor(() => {
      expect(screen.getByTestId('unified-modal-actions')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('schedule-detail-write-consultation-log-completed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('schedule-detail-write-consultation-log')).not.toBeInTheDocument();
  });
});
