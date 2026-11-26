/**
 * ScheduleDetailModal — 배정 변경 후 packageName/displayPackageName 갱신.
 *
 * @author MindGarden
 * @since 2026-11-26
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

let capturedOnReassigned = null;

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, opts) => (opts && opts.defaultValue) || key,
    i18n: { language: 'ko' }
  })
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ success: true, data: {} })),
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
  useSession: () => ({ user: { id: 1, role: 'ADMIN' } })
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children }) => (isOpen ? <div data-testid="unified-modal">{children}</div> : null)
}));

jest.mock('../ScheduleClientNotesSection', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../molecules/SchedulePartyQuickViewModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../admin/mapping-management/integrated-schedule/molecules/VehiclePlateQuickRegisterModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../consultant/molecules/ClientSummaryField', () => ({
  __esModule: true,
  default: ({ label, children }) => (
    <div>
      <span>{label}</span>
      <div>{children}</div>
    </div>
  )
}));

jest.mock('../../ui/Card/index', () => ({
  __esModule: true,
  ProfileCard: ({ children }) => <div>{children}</div>
}));

jest.mock('../ScheduleReassignMappingPanel', () => ({
  __esModule: true,
  default: ({ isOpen, onReassigned }) => {
    capturedOnReassigned = onReassigned;
    return isOpen ? <div data-testid="reassign-panel-stub" /> : null;
  }
}));

import ScheduleDetailModal from '../ScheduleDetailModal';

describe('ScheduleDetailModal — onReassigned 패키지명 갱신', () => {
  beforeEach(() => {
    capturedOnReassigned = null;
  });

  test('onReassigned 후 targetPackageName으로 패키지명 변경', async () => {
    render(
      <ScheduleDetailModal
        isOpen
        onClose={jest.fn()}
        scheduleData={{
          id: 9001,
          clientId: 21,
          consultantId: 11,
          clientName: '테스트내담자',
          consultantName: '김상담',
          date: '2026-11-21',
          startTime: '14:00',
          endTime: '14:50',
          status: 'BOOKED',
          scheduleType: 'CONSULTATION',
          consultationType: 'INDIVIDUAL',
          title: '개인상담',
          mappingId: 100,
          packageName: '단회기 90,000원',
          displayPackageName: '단회기 90,000원'
        }}
      />
    );

    expect(screen.getByTestId('schedule-detail-package-name')).toHaveTextContent('단회기 90,000원');

    const cta = screen.getByTestId('schedule-detail-reassign-mapping');
    fireEvent.click(cta);
    expect(await screen.findByTestId('reassign-panel-stub')).toBeInTheDocument();
    expect(typeof capturedOnReassigned).toBe('function');

    await act(async () => {
      capturedOnReassigned({
        targetMappingId: 200,
        targetPackageName: '다른 상품 10회',
        targetTotalSessions: 10,
        targetUsedSessions: 1,
        targetRemainingSessions: 9,
        sessionSequence: 1
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('schedule-detail-package-name')).toHaveTextContent('다른 상품 10회');
    });
  });
});
