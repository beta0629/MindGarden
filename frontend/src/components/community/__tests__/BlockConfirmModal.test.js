/**
 * Apple T2 (1.2 UGC) — BlockConfirmModal 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BlockConfirmModal from '../BlockConfirmModal';
import StandardizedApi from '../../../utils/standardizedApi';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

const mockShowToast = jest.fn();
jest.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock('../../common/modals/UnifiedModal', () => {
  return function MockUnifiedModal({ isOpen, title, children, actions }) {
    if (!isOpen) return null;
    const primary = actions?.primary;
    const secondary = actions?.secondary;
    return (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <div>{children}</div>
        <button
          type="button"
          data-testid={primary?.['data-testid']}
          onClick={primary?.onClick}
          disabled={primary?.disabled}
        >
          {primary?.label}
        </button>
        <button
          type="button"
          data-testid={secondary?.['data-testid']}
          onClick={secondary?.onClick}
        >
          {secondary?.label}
        </button>
      </div>
    );
  };
});

describe('BlockConfirmModal — Apple T2 1.2 사용자 차단 확인', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('차단 버튼 클릭 시 POST /api/v1/community/users/{userId}/block 호출', async () => {
    StandardizedApi.post.mockResolvedValueOnce({ success: true });
    const onBlocked = jest.fn();
    const onClose = jest.fn();
    render(
      <BlockConfirmModal
        isOpen
        userId={777}
        displayName="익명1"
        onClose={onClose}
        onBlocked={onBlocked}
      />
    );

    fireEvent.click(screen.getByTestId('block-confirm-submit'));

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledWith('/api/v1/community/users/777/block', {});
    });
    expect(onBlocked).toHaveBeenCalledWith(777);
    expect(onClose).toHaveBeenCalled();
  });

  it('이미 차단(409) 시 warning 토스트', async () => {
    StandardizedApi.post.mockRejectedValueOnce({ response: { status: 409 } });
    render(
      <BlockConfirmModal
        isOpen
        userId={777}
        displayName="익명1"
        onClose={jest.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('block-confirm-submit'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'warning' })
      );
    });
  });

  it('취소 클릭 시 onClose 호출, API 미호출', () => {
    const onClose = jest.fn();
    render(
      <BlockConfirmModal
        isOpen
        userId={777}
        displayName="익명1"
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByTestId('block-confirm-cancel'));
    expect(onClose).toHaveBeenCalled();
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });
});
