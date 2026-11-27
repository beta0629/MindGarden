/**
 * ClientSidePeekContent — 이력 탭 노출·권한 게이트
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import ClientSidePeekContent from '../molecules/ClientSidePeekContent';
import {
  CLIENT_EVENT_TYPE,
  CLIENT_EVENT_TIMELINE_UI
} from '../../../../constants/clientEventTimeline';
import { SCT_UI } from '../../../../constants/sctOnline';
import { USER_ROLES } from '../../../../constants/roles';

const mockUseSession = jest.fn();
const mockUseSctFeatureEnabled = jest.fn();

jest.mock('../../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => mockUseSession()
}));

jest.mock('../../../../hooks/useSctFeatureEnabled', () => ({
  __esModule: true,
  default: () => mockUseSctFeatureEnabled()
}));

jest.mock('../../package-payment-history/PackagePaymentHistoryList', () => ({
  __esModule: true,
  default: () => <div data-testid="package-payment-history-list">payment-history-mock</div>
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

import StandardizedApi from '../../../../utils/standardizedApi';

const SAMPLE_CLIENT = {
  id: 101,
  name: '김내담',
  email: 'client@example.com',
  phone: '01012345678',
  status: 'ACTIVE'
};

describe('ClientSidePeekContent — history tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSctFeatureEnabled.mockReturnValue({
      enabled: false,
      loading: false,
      refresh: jest.fn()
    });
    StandardizedApi.get.mockResolvedValue({
      events: [
        {
          id: 1,
          eventType: CLIENT_EVENT_TYPE.MAPPING_REASSIGNED,
          occurredAt: '2026-11-20T15:00:00',
          reason: '상담사 변경'
        }
      ],
      totalCount: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      last: true
    });
  });

  it('ADMIN → 이력 탭 노출, 클릭 시 타임라인', async() => {
    mockUseSession.mockReturnValue({ user: { id: 1, role: USER_ROLES.ADMIN } });

    render(<ClientSidePeekContent client={SAMPLE_CLIENT} />);

    expect(screen.getByRole('tab', { name: CLIENT_EVENT_TIMELINE_UI.TAB_HISTORY })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: SCT_UI.TAB_OVERVIEW })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: SCT_UI.TAB_QUESTIONNAIRE })).not.toBeInTheDocument();

    await act(async() => {
      fireEvent.click(screen.getByRole('tab', { name: CLIENT_EVENT_TIMELINE_UI.TAB_HISTORY }));
    });

    await waitFor(() => {
      expect(screen.getByText('재배정')).toBeInTheDocument();
    });
    expect(screen.getByText('상담사 변경')).toBeInTheDocument();
    expect(screen.getByTestId('client-event-timeline')).toBeInTheDocument();
  });

  it('STAFF → 이력 탭 노출', () => {
    mockUseSession.mockReturnValue({ user: { id: 2, role: USER_ROLES.STAFF } });

    render(<ClientSidePeekContent client={SAMPLE_CLIENT} />);

    expect(screen.getByRole('tab', { name: CLIENT_EVENT_TIMELINE_UI.TAB_HISTORY })).toBeInTheDocument();
  });

  it('non-ADMIN/STAFF → 이력 탭 미노출', () => {
    mockUseSession.mockReturnValue({ user: { id: 3, role: USER_ROLES.CONSULTANT } });

    render(<ClientSidePeekContent client={SAMPLE_CLIENT} />);

    expect(screen.queryByRole('tab', { name: CLIENT_EVENT_TIMELINE_UI.TAB_HISTORY })).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.getByTestId('package-payment-history-list')).toBeInTheDocument();
  });

  it('sctEnabled + ADMIN → 개요·질문지·이력 탭', () => {
    mockUseSctFeatureEnabled.mockReturnValue({
      enabled: true,
      loading: false,
      refresh: jest.fn()
    });
    mockUseSession.mockReturnValue({ user: { id: 1, role: USER_ROLES.ADMIN } });

    render(<ClientSidePeekContent client={SAMPLE_CLIENT} />);

    expect(screen.getByRole('tab', { name: SCT_UI.TAB_OVERVIEW })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: SCT_UI.TAB_QUESTIONNAIRE })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: CLIENT_EVENT_TIMELINE_UI.TAB_HISTORY })).toBeInTheDocument();
  });
});
