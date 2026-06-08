/**
 * Apple T2 (1.2 UGC) — 사용자 차단 확인 모달 (웹).
 *
 * <p>디자이너 핸드오프 §5.1 — 차단 효과 안내 + 취소/차단 액션. 차단은 단방향이며 차단 후
 * 차단된 사용자의 게시글·댓글이 즉시 비노출된다. 차단 목록 페이지에서 해제 가능.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import UnifiedModal from '../common/modals/UnifiedModal';
import StandardizedApi from '../../utils/standardizedApi';
import { useToast } from '../../contexts/ToastContext';
import { COMMUNITY_API } from '../../constants/communityApi';
import './BlockConfirmModal.css';

const TOAST_SUCCESS = '사용자를 차단했습니다.';
const TOAST_FAILED = '차단 처리에 실패했습니다. 잠시 후 다시 시도해주세요.';
const TOAST_DUPLICATE = '이미 차단된 사용자입니다.';

const BlockConfirmModal = ({
  isOpen,
  userId,
  displayName,
  onClose,
  onBlocked
}) => {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    onClose && onClose();
  };

  const handleConfirm = async() => {
    if (submitting || !userId) return;
    setSubmitting(true);
    try {
      await StandardizedApi.post(COMMUNITY_API.USERS_BLOCK(userId), {});
      showToast({ type: 'success', message: TOAST_SUCCESS });
      onBlocked && onBlocked(userId);
      onClose && onClose();
    } catch (error) {
      const status = error?.response?.status;
      if (status === 409) {
        showToast({ type: 'warning', message: TOAST_DUPLICATE });
      } else {
        showToast({ type: 'error', message: TOAST_FAILED });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const actions = {
    primary: {
      label: submitting ? '차단 중...' : '차단하기',
      onClick: handleConfirm,
      disabled: submitting,
      variant: 'danger',
      'data-testid': 'block-confirm-submit'
    },
    secondary: {
      label: '취소',
      onClick: handleClose,
      'data-testid': 'block-confirm-cancel'
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${displayName || '사용자'}을(를) 차단하시겠습니까?`}
      size="small"
      variant="confirm"
      actions={actions}
      closeButtonDataTestId="block-confirm-close"
    >
      <ul className="block-confirm-modal__list" data-testid="block-confirm-effects">
        <li>이 사용자의 게시글과 댓글이 보이지 않습니다.</li>
        <li>마이페이지 &gt; 차단 목록에서 언제든지 해제할 수 있습니다.</li>
        <li>차단 사실은 상대방에게 알려지지 않습니다.</li>
      </ul>
    </UnifiedModal>
  );
};

BlockConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  userId: PropTypes.number,
  displayName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onBlocked: PropTypes.func
};

BlockConfirmModal.defaultProps = {
  userId: null,
  displayName: '',
  onBlocked: null
};

export default BlockConfirmModal;
