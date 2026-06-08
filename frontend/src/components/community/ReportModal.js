/**
 * Apple T2 (1.2 UGC) — 게시글/댓글 신고 모달 (웹).
 *
 * <p>디자이너 핸드오프 §4 신고 모달 — 6+사유 선택 + 상세 메모(선택, 200자) + 중복 차단 + 토스트.
 * 게시글/댓글 양쪽에서 사용. 공통 {@code UnifiedModal} 위에 구성하며 색·간격은 디자인 토큰만
 * 사용한다. API 호출은 {@code StandardizedApi}, 엔드포인트는 {@code COMMUNITY_API.postReports}.
 * </p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import UnifiedModal from '../common/modals/UnifiedModal';
import StandardizedApi from '../../utils/standardizedApi';
import { useToast } from '../../contexts/ToastContext';
import {
  COMMUNITY_API,
  COMMUNITY_REPORT_REASONS
} from '../../constants/communityApi';
import './ReportModal.css';

const NOTE_MAX_LENGTH = 200;
const NOTE_PLACEHOLDER = '신고 사유를 자세히 알려주세요 (선택)';
const TOAST_SUCCESS = '신고가 접수되었습니다. 24시간 내 처리됩니다.';
const TOAST_DUPLICATE = '이미 신고하신 콘텐츠입니다.';
const TOAST_FAILED = '신고 처리에 실패했습니다. 잠시 후 다시 시도해주세요.';

const ReportModal = ({ isOpen, postId, commentId, onClose, onSubmitted }) => {
  const { showToast } = useToast();
  const [reasonCode, setReasonCode] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const disabled = useMemo(() => !reasonCode || submitting, [reasonCode, submitting]);

  const resetState = () => {
    setReasonCode('');
    setNote('');
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    resetState();
    onClose && onClose();
  };

  const handleSubmit = async() => {
    if (disabled) return;
    setSubmitting(true);
    try {
      await StandardizedApi.post(COMMUNITY_API.postReports(postId), {
        reasonCode,
        detailMessage: note.trim() || null,
        commentId: commentId || null
      });
      showToast({ type: 'success', message: TOAST_SUCCESS });
      onSubmitted && onSubmitted();
      resetState();
      onClose && onClose();
    } catch (error) {
      const status = error?.response?.status;
      if (status === 403 || status === 409) {
        showToast({ type: 'warning', message: TOAST_DUPLICATE });
      } else {
        showToast({ type: 'error', message: TOAST_FAILED });
      }
      setSubmitting(false);
    }
  };

  const actions = {
    primary: {
      label: submitting ? '제출 중...' : '신고 제출',
      onClick: handleSubmit,
      disabled,
      'data-testid': 'report-modal-submit'
    },
    secondary: {
      label: '취소',
      onClick: handleClose,
      'data-testid': 'report-modal-cancel'
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="신고하기"
      subtitle="어떤 점이 문제인가요?"
      size="small"
      variant="form"
      actions={actions}
      closeButtonDataTestId="report-modal-close"
    >
      <fieldset className="report-modal__fieldset" data-testid="report-modal-reasons">
        <legend className="report-modal__legend">신고 사유 선택</legend>
        {COMMUNITY_REPORT_REASONS.map((option) => (
          <label key={option.code} className="report-modal__option">
            <input
              type="radio"
              name="report-reason"
              value={option.code}
              checked={reasonCode === option.code}
              onChange={(e) => setReasonCode(e.target.value)}
              data-testid={`report-modal-option-${option.code}`}
            />
            <span className="report-modal__option-label">{option.label}</span>
          </label>
        ))}
      </fieldset>
      <label className="report-modal__note-label" htmlFor="report-modal-note">
        상세 설명 (선택)
      </label>
      <textarea
        id="report-modal-note"
        className="report-modal__note"
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LENGTH))}
        placeholder={NOTE_PLACEHOLDER}
        rows={4}
        maxLength={NOTE_MAX_LENGTH}
        data-testid="report-modal-note"
      />
      <div className="report-modal__counter" aria-live="polite">
        {note.length}/{NOTE_MAX_LENGTH}
      </div>
    </UnifiedModal>
  );
};

ReportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  postId: PropTypes.number.isRequired,
  commentId: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  onSubmitted: PropTypes.func
};

ReportModal.defaultProps = {
  commentId: null,
  onSubmitted: null
};

export default ReportModal;
