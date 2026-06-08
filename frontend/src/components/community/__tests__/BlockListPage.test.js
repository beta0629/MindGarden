/**
 * Apple T2 (1.2 UGC) — BlockListPage 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BlockListPage from '../BlockListPage';
import StandardizedApi from '../../../utils/standardizedApi';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockShowToast = jest.fn();
jest.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

describe('BlockListPage — Apple T2 1.2 차단 목록', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('비어 있을 때 안내 문구 표시', async () => {
    StandardizedApi.get.mockResolvedValueOnce({ data: [] });
    render(<BlockListPage />);
    await waitFor(() => {
      expect(screen.getByText('차단한 사용자가 없습니다.')).toBeInTheDocument();
    });
  });

  it('차단 사용자 목록을 노출', async () => {
    StandardizedApi.get.mockResolvedValueOnce({
      data: [
        { id: 1, blockedUserId: 100, blockedDisplayName: '익명123', blockedAt: '2026-06-01T00:00:00' },
        { id: 2, blockedUserId: 200, blockedDisplayName: '익명456', blockedAt: '2026-05-30T00:00:00' },
      ],
    });
    render(<BlockListPage />);
    await waitFor(() => {
      expect(screen.getByText('익명123')).toBeInTheDocument();
      expect(screen.getByText('익명456')).toBeInTheDocument();
    });
  });

  it('해제 버튼 클릭 시 DELETE /api/v1/community/users/{id}/block 호출 + 목록에서 제거', async () => {
    StandardizedApi.get.mockResolvedValueOnce({
      data: [
        { id: 1, blockedUserId: 100, blockedDisplayName: '익명123', blockedAt: '2026-06-01T00:00:00' },
      ],
    });
    StandardizedApi.delete.mockResolvedValueOnce({ success: true });
    render(<BlockListPage />);
    await waitFor(() => {
      expect(screen.getByText('익명123')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('block-list-unblock-100'));

    await waitFor(() => {
      expect(StandardizedApi.delete).toHaveBeenCalledWith('/api/v1/community/users/100/block');
    });
    await waitFor(() => {
      expect(screen.queryByText('익명123')).not.toBeInTheDocument();
    });
  });

  it('GET 실패 시 role=alert 인라인 오류 노출', async () => {
    StandardizedApi.get.mockRejectedValueOnce({ message: '네트워크 오류' });
    render(<BlockListPage />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('네트워크 오류');
    });
  });
});
