/**
 * 미연결 패널 — ADMIN 재발급·복사, STAFF는 목록만
 *
 * @author MindGarden
 * @since 2026-11-24
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminSctUnlinkedPanel from '../AdminSctUnlinkedPanel';
import { SCT_TEST_ID, SCT_UI } from '../../../../constants/sctOnline';
import {
  fetchSctUnlinkedInvitations,
  reissueSctLink
} from '../../../../utils/sctApi';

const mockUseSession = jest.fn();

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => mockUseSession()
}));

jest.mock('../../../../utils/sctApi', () => ({
  fetchSctUnlinkedInvitations: jest.fn(),
  reissueSctLink: jest.fn()
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), success: jest.fn() }
}));

describe('AdminSctUnlinkedPanel reissue UI', () => {
  const row = {
    id: 42,
    recipientName: '홍길동',
    status: 'SENT',
    managementNo: 'MG-1'
  };

  beforeEach(() => {
    fetchSctUnlinkedInvitations.mockResolvedValue([row]);
    reissueSctLink.mockResolvedValue({ publicUrl: '/public/sct/new-token' });
  });

  it('ADMIN can reissue and then copy public link', async() => {
    mockUseSession.mockReturnValue({ user: { role: 'ADMIN' } });
    render(<AdminSctUnlinkedPanel />);
    await waitFor(() => {
      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });
    const btn = screen.getByTestId(`${SCT_TEST_ID.UNLINKED_REISSUE}-42`);
    fireEvent.click(btn);
    await waitFor(() => {
      expect(reissueSctLink).toHaveBeenCalledWith(42);
    });
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.COPY_LINK)).toBeInTheDocument();
    });
  });

  it('STAFF sees list without reissue button', async() => {
    mockUseSession.mockReturnValue({ user: { role: 'STAFF' } });
    render(<AdminSctUnlinkedPanel />);
    await waitFor(() => {
      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });
    expect(screen.queryByTestId(`${SCT_TEST_ID.UNLINKED_REISSUE}-42`)).not.toBeInTheDocument();
  });
});
