/**
 * SCT 설정 섹션 — feature OFF여도 렌더·토글 노출 · 공개 연락처 입력
 *
 * @author MindGarden
 * @since 2026-11-24
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminSctSettingsSection from '../AdminSctSettingsSection';
import { SCT_TEST_ID, SCT_UI } from '../../../../constants/sctOnline';
import notificationManager from '../../../../utils/notification';
import {
  fetchSctSettings,
  fetchSctUnlinkedInvitations,
  reissueSctInviteLink,
  updateSctSettings
} from '../../../../utils/sctApi';

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { role: 'ADMIN' } })
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

describe('AdminSctSettingsSection feature OFF', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchSctSettings.mockResolvedValue({
      linkExpiryDays: 14,
      retentionDays: 365,
      featureEnabled: false,
      officePhone: null,
      mobilePhone: null
    });
    updateSctSettings.mockResolvedValue({
      linkExpiryDays: 14,
      retentionDays: 365,
      featureEnabled: false,
      officePhone: null,
      mobilePhone: null
    });
    fetchSctUnlinkedInvitations.mockResolvedValue([]);
    reissueSctInviteLink.mockResolvedValue({});
  });

  it('renders settings section when feature is disabled', async() => {
    render(<AdminSctSettingsSection />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.SETTINGS)).toBeInTheDocument();
    });
    expect(screen.getByText(SCT_UI.SETTINGS_FEATURE_TOGGLE)).toBeInTheDocument();
    expect(screen.getByText(SCT_UI.SETTINGS_FEATURE_OFF_LABEL)).toBeInTheDocument();
  });

  it('renders office and mobile phone inputs for ADMIN', async() => {
    render(<AdminSctSettingsSection />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.SETTINGS_OFFICE_PHONE)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.SETTINGS_MOBILE_PHONE)).toBeInTheDocument();
    expect(screen.getByText(SCT_UI.SETTINGS_PUBLIC_CONTACT_HINT)).toBeInTheDocument();
    expect(screen.getByLabelText(SCT_UI.SETTINGS_OFFICE_PHONE)).toHaveAttribute('type', 'tel');
    expect(screen.getByLabelText(SCT_UI.SETTINGS_MOBILE_PHONE)).toHaveAttribute('type', 'tel');
  });

  it('does not call update when public contact phone is invalid', async() => {
    render(<AdminSctSettingsSection />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.SETTINGS_OFFICE_PHONE)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId(SCT_TEST_ID.SETTINGS_OFFICE_PHONE), {
      target: { value: 'abc-call' }
    });
    fireEvent.click(screen.getByRole('button', { name: SCT_UI.SETTINGS_SAVE }));
    await waitFor(() => {
      expect(notificationManager.show).toHaveBeenCalledWith(
        SCT_UI.VALIDATE_PUBLIC_CONTACT_PHONE,
        'error'
      );
    });
    expect(updateSctSettings).not.toHaveBeenCalled();
  });

  it('sends empty strings when phones cleared', async() => {
    fetchSctSettings.mockResolvedValue({
      linkExpiryDays: 14,
      retentionDays: 365,
      featureEnabled: false,
      officePhone: '02-0000-1111',
      mobilePhone: '010-0000-1111'
    });
    updateSctSettings.mockResolvedValue({
      linkExpiryDays: 14,
      retentionDays: 365,
      featureEnabled: false,
      officePhone: null,
      mobilePhone: null
    });

    render(<AdminSctSettingsSection />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.SETTINGS_OFFICE_PHONE)).toHaveValue('02-0000-1111');
    });
    fireEvent.change(screen.getByTestId(SCT_TEST_ID.SETTINGS_OFFICE_PHONE), {
      target: { value: '' }
    });
    fireEvent.change(screen.getByTestId(SCT_TEST_ID.SETTINGS_MOBILE_PHONE), {
      target: { value: '' }
    });
    fireEvent.click(screen.getByRole('button', { name: SCT_UI.SETTINGS_SAVE }));
    await waitFor(() => {
      expect(updateSctSettings).toHaveBeenCalledWith(expect.objectContaining({
        officePhone: '',
        mobilePhone: ''
      }));
    });
  });
});
