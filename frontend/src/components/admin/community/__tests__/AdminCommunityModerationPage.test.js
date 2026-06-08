/**
 * Apple T2 (1.2 UGC) — AdminCommunityModerationPage 단위 테스트.
 *
 * 검증 범위:
 *  - 초기 ALL 필터로 GET /api/v1/admin/community/reports 호출
 *  - 콘텐츠 숨김 액션 → PATCH 호출 (status=RESOLVED, action=HIDE_CONTENT)
 *  - 기각 액션 → status=REJECTED, action=NONE
 *  - SLA 24h 초과 라벨 노출
 *  - AUTO_QUARANTINE 우선순위 라벨 노출
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminCommunityModerationPage from '../AdminCommunityModerationPage';
import StandardizedApi from '../../../../utils/standardizedApi';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockShowToast = jest.fn();
jest.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const buildReport = (overrides = {}) => ({
  id: 9001,
  status: 'OPEN',
  priority: 'NORMAL',
  reasonCode: 'HARASSMENT',
  detailMessage: '괴롭히는 댓글',
  reporterDisplay: '신고자',
  postId: 5001,
  postAuthorDisplay: '게시자',
  postTitle: '문제 게시',
  postBodyPreview: '본문 미리보기',
  commentBodyPreview: null,
  minutesSinceCreated: 60,
  postHidden: false,
  resolutionAction: null,
  resolvedByDisplay: null,
  resolvedAt: null,
  ...overrides,
});

describe('AdminCommunityModerationPage — Apple T2 1.2 신고 처리 큐', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('초기 ALL 필터로 GET /api/v1/admin/community/reports 호출 + 카드 렌더링', async () => {
    StandardizedApi.get.mockResolvedValueOnce({ data: [buildReport()] });
    render(<AdminCommunityModerationPage />);

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        '/api/v1/admin/community/reports',
        {}
      );
    });
    await waitFor(() => {
      expect(screen.getByText('문제 게시')).toBeInTheDocument();
    });
  });

  it('OPEN 필터 클릭 시 status=OPEN 쿼리로 재호출', async () => {
    StandardizedApi.get.mockResolvedValue({ data: [] });
    render(<AdminCommunityModerationPage />);
    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByTestId('admin-cm-filter-OPEN'));

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenLastCalledWith(
        '/api/v1/admin/community/reports',
        { status: 'OPEN' }
      );
    });
  });

  it('콘텐츠 숨김 클릭 시 PATCH (status=RESOLVED, action=HIDE_CONTENT)', async () => {
    StandardizedApi.get.mockResolvedValueOnce({ data: [buildReport()] });
    StandardizedApi.patch.mockResolvedValueOnce({ success: true });
    StandardizedApi.get.mockResolvedValueOnce({ data: [] });
    render(<AdminCommunityModerationPage />);
    await waitFor(() => screen.getByTestId('admin-cm-hide-9001'));

    fireEvent.click(screen.getByTestId('admin-cm-hide-9001'));

    await waitFor(() => {
      expect(StandardizedApi.patch).toHaveBeenCalledWith(
        '/api/v1/admin/community/reports/9001',
        expect.objectContaining({
          status: 'RESOLVED',
          action: 'HIDE_CONTENT',
        })
      );
    });
  });

  it('기각 클릭 시 PATCH (status=REJECTED, action=NONE)', async () => {
    StandardizedApi.get.mockResolvedValueOnce({ data: [buildReport()] });
    StandardizedApi.patch.mockResolvedValueOnce({ success: true });
    StandardizedApi.get.mockResolvedValueOnce({ data: [] });
    render(<AdminCommunityModerationPage />);
    await waitFor(() => screen.getByTestId('admin-cm-reject-9001'));

    fireEvent.click(screen.getByTestId('admin-cm-reject-9001'));

    await waitFor(() => {
      expect(StandardizedApi.patch).toHaveBeenCalledWith(
        '/api/v1/admin/community/reports/9001',
        expect.objectContaining({
          status: 'REJECTED',
          action: 'NONE',
        })
      );
    });
  });

  it('AUTO_QUARANTINE 우선순위 라벨 노출', async () => {
    StandardizedApi.get.mockResolvedValueOnce({
      data: [buildReport({ priority: 'AUTO_QUARANTINE' })],
    });
    render(<AdminCommunityModerationPage />);
    await waitFor(() => {
      expect(screen.getByText('자동 격리')).toBeInTheDocument();
    });
  });

  it('SLA 24h 초과 시 "24h 초과" 라벨 노출', async () => {
    StandardizedApi.get.mockResolvedValueOnce({
      data: [buildReport({ minutesSinceCreated: 1500 })],
    });
    render(<AdminCommunityModerationPage />);
    await waitFor(() => {
      expect(screen.getByText('24h 초과')).toBeInTheDocument();
    });
  });
});
