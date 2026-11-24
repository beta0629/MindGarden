/**
 * SCT 설정 섹션 — feature OFF여도 렌더·토글 노출
 *
 * @author MindGarden
 * @since 2026-11-24
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminSctSettingsSection from '../AdminSctSettingsSection';
import { SCT_TEST_ID, SCT_UI } from '../../../../constants/sctOnline';
import {
  fetchSctSettings,
  fetchSctUnlinkedInvitations,
  reissueSctLink,
  updateSctSettings
} from '../../../../utils/sctApi';

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { role: 'ADMIN' } })
}));

jest.mock('../../../../utils/sctApi', () => ({
  fetchSctSettings: jest.fn(),
  updateSctSettings: jest.fn(),
  fetchSctUnlinkedInvitations: jest.fn(),
  reissueSctLink: jest.fn()
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), success: jest.fn() }
}));

describe('AdminSctSettingsSection feature OFF', () => {
  beforeEach(() => {
    fetchSctSettings.mockResolvedValue({
      linkExpiryDays: 14,
      retentionDays: 365,
      featureEnabled: false
    });
    updateSctSettings.mockResolvedValue({
      linkExpiryDays: 14,
      retentionDays: 365,
      featureEnabled: false
    });
    fetchSctUnlinkedInvitations.mockResolvedValue([]);
    reissueSctLink.mockResolvedValue({});
  });

  it('renders settings section when feature is disabled', async() => {
    render(<AdminSctSettingsSection />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.SETTINGS)).toBeInTheDocument();
    });
    expect(screen.getByText(SCT_UI.SETTINGS_FEATURE_TOGGLE)).toBeInTheDocument();
    expect(screen.getByText(SCT_UI.SETTINGS_FEATURE_OFF_LABEL)).toBeInTheDocument();
  });
});
