/**
 * Apple T2 (1.2 UGC) — ReportModal 단위 테스트.
 *
 * 검증 범위:
 *  - 사유 미선택 시 제출 버튼 비활성화
 *  - 사유 선택 + 제출 → POST /api/v1/community/{postId}/reports 호출
 *  - 댓글 신고 시 commentId 전송
 *  - 제출 성공 시 onSubmitted + onClose 호출
 *  - 제출 실패 시 토스트 표시(에러 분기)
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportModal from '../ReportModal';
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
  return function MockUnifiedModal({ isOpen, title, children, actions, onClose }) {
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
        <button type="button" onClick={onClose} data-testid="modal-close">close</button>
      </div>
    );
  };
});

describe('ReportModal — Apple T2 1.2 UGC 신고 모달', () => {
  const POST_ID = 5001;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('사유 미선택 시 제출 버튼은 비활성화', () => {
    render(<ReportModal isOpen postId={POST_ID} onClose={jest.fn()} />);
    expect(screen.getByTestId('report-modal-submit')).toBeDisabled();
  });

  it('사유 선택 + 제출 시 POST /api/v1/community/{postId}/reports 호출', async () => {
    StandardizedApi.post.mockResolvedValueOnce({ success: true });
    const onClose = jest.fn();
    const onSubmitted = jest.fn();

    render(
      <ReportModal
        isOpen
        postId={POST_ID}
        onClose={onClose}
        onSubmitted={onSubmitted}
      />
    );

    fireEvent.click(screen.getByTestId('report-modal-option-HARASSMENT'));
    const submit = screen.getByTestId('report-modal-submit');
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        `/api/v1/community/${POST_ID}/reports`,
        expect.objectContaining({ reasonCode: 'HARASSMENT', commentId: null })
      );
    });
    expect(onSubmitted).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('댓글 신고 시 commentId 전송', async () => {
    StandardizedApi.post.mockResolvedValueOnce({ success: true });
    render(
      <ReportModal
        isOpen
        postId={POST_ID}
        commentId={777}
        onClose={jest.fn()}
        onSubmitted={jest.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('report-modal-option-SPAM'));
    fireEvent.click(screen.getByTestId('report-modal-submit'));

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ commentId: 777, reasonCode: 'SPAM' })
      );
    });
  });

  it('중복 신고(403) 발생 시 warning 토스트', async () => {
    StandardizedApi.post.mockRejectedValueOnce({ response: { status: 403 } });
    render(<ReportModal isOpen postId={POST_ID} onClose={jest.fn()} />);
    fireEvent.click(screen.getByTestId('report-modal-option-OBSCENE'));
    fireEvent.click(screen.getByTestId('report-modal-submit'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'warning' })
      );
    });
  });

  it('일반 에러 시 error 토스트', async () => {
    StandardizedApi.post.mockRejectedValueOnce({ response: { status: 500 } });
    render(<ReportModal isOpen postId={POST_ID} onClose={jest.fn()} />);
    fireEvent.click(screen.getByTestId('report-modal-option-VIOLENCE'));
    fireEvent.click(screen.getByTestId('report-modal-submit'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });
  });
});
