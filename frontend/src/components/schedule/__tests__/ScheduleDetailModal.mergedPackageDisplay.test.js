import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => jest.fn()
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => {
      const scheduleKo = require('../../../locales/ko/schedule.json');
      const match = /^schedule:(.+)$/.exec(String(key));
      if (!match) return key;
      const resolved = match[1]
        .split('.')
        .reduce((acc, part) => (acc == null ? undefined : acc[part]), scheduleKo);
      return typeof resolved === 'string' ? resolved : key;
    },
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

import ScheduleDetailModal from '../ScheduleDetailModal';
import { CALENDAR_EXTENDED_TYPE_VACATION } from '../../../constants/schedule';

describe('ScheduleDetailModal — 병합 패키지 displayPackageName 노출', () => {
  const baseSchedule = {
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
    packageName: '단회기 90,000원',
    displayPackageName: '단회기 90,000원 + 기본10회기'
  };

  it('일반 일정 상세에서 합산된 displayPackageName 을 표시한다', () => {
    render(
      <ScheduleDetailModal
        isOpen
        onClose={jest.fn()}
        scheduleData={baseSchedule}
      />
    );

    expect(screen.getByTestId('schedule-detail-package-name')).toHaveTextContent('단회기 90,000원 + 기본10회기');
  });

  it('휴가 일정에서는 패키지 행을 노출하지 않는다', () => {
    render(
      <ScheduleDetailModal
        isOpen
        onClose={jest.fn()}
        scheduleData={{ ...baseSchedule, scheduleType: 'VACATION', calendarEventType: CALENDAR_EXTENDED_TYPE_VACATION, type: CALENDAR_EXTENDED_TYPE_VACATION }}
      />
    );

    expect(screen.queryByTestId('schedule-detail-package-name')).toBeNull();
  });
});
