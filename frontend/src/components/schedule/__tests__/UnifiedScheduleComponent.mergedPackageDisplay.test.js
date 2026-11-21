/**
 * 달력 이벤트 클릭 경로: API 일정 → extendedProps → scheduleData → 일정 상세 결합 표시명
 */
import React from 'react';
import fs from 'fs';
import path from 'path';
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
import { pickSchedulePackageFields } from '../../../utils/packagePricing';

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'UnifiedScheduleComponent.js'),
  'utf8'
);

describe('UnifiedScheduleComponent — 달력 클릭 경로 병합 패키지 전달', () => {
  const apiSchedule = {
    id: 9001,
    mappingId: 36,
    consultantId: 11,
    clientId: 21,
    consultantName: '테스트상담',
    clientName: '테스트내담자',
    date: '2026-11-17',
    startTime: '18:00',
    endTime: '18:50',
    status: 'BOOKED',
    scheduleType: 'CONSULTATION',
    consultationType: 'INDIVIDUAL',
    title: '개인상담',
    packageName: '언어치료20회기',
    displayPackageName: '언어치료20회기 + 언어치료패키지20회기',
    mergedPackageNames: ['언어치료패키지20회기'],
    packagePrice: 200000,
    totalSessions: 40,
    remainingSessions: 30
  };

  test('pickSchedulePackageFields는 표시 필드를 복사하고 raw packageName·금액은 그대로 둔다', () => {
    const picked = pickSchedulePackageFields(apiSchedule);
    expect(picked.packageName).toBe('언어치료20회기');
    expect(picked.displayPackageName).toBe('언어치료20회기 + 언어치료패키지20회기');
    expect(picked.mergedPackageNames).toEqual(['언어치료패키지20회기']);
    expect(apiSchedule.packageName).toBe('언어치료20회기');
    expect(apiSchedule.packagePrice).toBe(200000);
    expect(pickSchedulePackageFields(null)).toEqual({
      packageName: null,
      displayPackageName: null,
      mergedPackageNames: []
    });
  });

  test('소스: 두 extendedProps 매퍼와 handleEventClick scheduleData에 헬퍼를 연결한다', () => {
    expect(SOURCE).toMatch(/import \{ pickSchedulePackageFields \} from ['\"]\.\.\/\.\.\/utils\/packagePricing['\"]/);
    const spreads = SOURCE.match(/\.\.\.pickSchedulePackageFields\((schedule|event\.extendedProps)\)/g) || [];
    expect(spreads).toEqual([
      '...pickSchedulePackageFields(schedule)',
      '...pickSchedulePackageFields(schedule)',
      '...pickSchedulePackageFields(event.extendedProps)'
    ]);
  });

  test('달력 클릭과 같은 조립 경로로 연 일정 상세에 결합 표시명이 나온다', () => {
    const extendedProps = {
      id: apiSchedule.id,
      mappingId: apiSchedule.mappingId,
      consultantId: apiSchedule.consultantId,
      clientId: apiSchedule.clientId,
      consultantName: apiSchedule.consultantName,
      clientName: apiSchedule.clientName,
      status: apiSchedule.status,
      consultationType: apiSchedule.consultationType,
      ...pickSchedulePackageFields(apiSchedule)
    };
    const scheduleData = {
      id: extendedProps.id,
      mappingId: extendedProps.mappingId,
      consultantId: extendedProps.consultantId,
      clientId: extendedProps.clientId,
      consultantName: extendedProps.consultantName,
      clientName: extendedProps.clientName,
      date: apiSchedule.date,
      startTime: apiSchedule.startTime,
      endTime: apiSchedule.endTime,
      status: extendedProps.status,
      scheduleType: apiSchedule.scheduleType,
      consultationType: extendedProps.consultationType,
      title: apiSchedule.title,
      ...pickSchedulePackageFields(extendedProps)
    };

    render(
      <ScheduleDetailModal
        isOpen
        onClose={jest.fn()}
        scheduleData={scheduleData}
      />
    );

    expect(screen.getByTestId('schedule-detail-package-name'))
      .toHaveTextContent('언어치료20회기 + 언어치료패키지20회기');
    expect(scheduleData.packageName).toBe('언어치료20회기');
  });
});
