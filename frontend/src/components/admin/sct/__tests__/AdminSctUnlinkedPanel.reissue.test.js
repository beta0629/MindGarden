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
  reissueSctInviteLink
} from '../../../../utils/sctApi';

const mockUseSession = jest.fn();

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => mockUseSession()
}));

jest.mock('../../../../utils/sctApi', () => ({
  fetchSctUnlinkedInvitations: jest.fn(),
  reissueSctInviteLink: jest.fn()
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
    reissueSctInviteLink.mockResolvedValue({ publicUrl: '/public/sct/new-token' });
  });

  it('ADMIN always sees copy area with security hint before reissue', async() => {
    mockUseSession.mockReturnValue({ user: { role: 'ADMIN' } });
    render(<AdminSctUnlinkedPanel />);
    await waitFor(() => {
      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });
    expect(screen.getByTestId(`${SCT_TEST_ID.UNLINKED_COPY_AREA}-42`)).toBeInTheDocument();
    expect(screen.getByTestId(`${SCT_TEST_ID.UNLINKED_COPY_HINT}-42`)).toHaveTextContent(
      SCT_UI.UNLINKED_COPY_HINT
    );
    expect(screen.queryByText(SCT_UI.COPY_LINK)).not.toBeInTheDocument();
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
      expect(reissueSctInviteLink).toHaveBeenCalledWith(42);
    });
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.COPY_LINK)).toBeInTheDocument();
    });
    expect(screen.queryByTestId(`${SCT_TEST_ID.UNLINKED_COPY_HINT}-42`)).not.toBeInTheDocument();
  });

  it('STAFF sees list without reissue button or copy area', async() => {
    mockUseSession.mockReturnValue({ user: { role: 'STAFF' } });
    render(<AdminSctUnlinkedPanel />);
    await waitFor(() => {
      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });
    expect(screen.queryByTestId(`${SCT_TEST_ID.UNLINKED_REISSUE}-42`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`${SCT_TEST_ID.UNLINKED_COPY_AREA}-42`)).not.toBeInTheDocument();
  });
});
