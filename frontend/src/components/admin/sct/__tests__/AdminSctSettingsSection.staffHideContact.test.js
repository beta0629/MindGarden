/**
 * SCT 설정 섹션 — 비ADMIN에게 사무실·휴대폰 입력칸 미렌더
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminSctSettingsSection from '../AdminSctSettingsSection';
import { SCT_TEST_ID, SCT_UI } from '../../../../constants/sctOnline';
import { USER_ROLES } from '../../../../constants/roles';
import {
  fetchSctSettings,
  fetchSctUnlinkedInvitations,
  reissueSctInviteLink
} from '../../../../utils/sctApi';

const mockSessionState = {
  user: { role: 'STAFF' }
};

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => mockSessionState
}));

jest.mock('../../../../utils/sctApi', () => ({
  fetchSctSettings: jest.fn(),
  updateSctSettings: jest.fn(),
  fetchSctUnlinkedInvitations: jest.fn(),
  reissueSctInviteLink: jest.fn()
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), success: jest.fn() }
}));

describe('AdminSctSettingsSection staff contact hide', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionState.user = { role: USER_ROLES.STAFF };
    fetchSctSettings.mockResolvedValue({
      linkExpiryDays: 14,
      retentionDays: 365,
      featureEnabled: true,
      officePhone: '02-0000-1111',
      mobilePhone: '010-0000-1111'
    });
    fetchSctUnlinkedInvitations.mockResolvedValue([]);
    reissueSctInviteLink.mockResolvedValue({});
  });

  it('does not render office/mobile phone inputs for STAFF', async() => {
    render(<AdminSctSettingsSection />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.SETTINGS)).toBeInTheDocument();
    });
    expect(screen.queryByTestId(SCT_TEST_ID.SETTINGS_OFFICE_PHONE)).not.toBeInTheDocument();
    expect(screen.queryByTestId(SCT_TEST_ID.SETTINGS_MOBILE_PHONE)).not.toBeInTheDocument();
    expect(screen.queryByText(SCT_UI.SETTINGS_PUBLIC_CONTACT_HINT)).not.toBeInTheDocument();
  });

  it('renders office/mobile phone inputs for ADMIN', async() => {
    mockSessionState.user = { role: USER_ROLES.ADMIN };
    render(<AdminSctSettingsSection />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.SETTINGS_OFFICE_PHONE)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.SETTINGS_MOBILE_PHONE)).toBeInTheDocument();
    expect(screen.getByText(SCT_UI.SETTINGS_PUBLIC_CONTACT_HINT)).toBeInTheDocument();
  });
});
