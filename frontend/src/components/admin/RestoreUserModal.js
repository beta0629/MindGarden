/**
 * RestoreUserModal — 어드민 강제 종료 7일 윈도우 내 "되돌리기" 모달.
 *
 * USER_LIFECYCLE_TERMINATION_POLICY §0.1 Q5 — POST /api/v1/admin/users/{userId}/restore.
 * 사유(reason) 필수 + 500자 제한 + UnifiedModal SSOT 사용.
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import StandardizedApi from '../../utils/standardizedApi';
import { showSuccess, showError } from '../../utils/notification';
import { toDisplayString } from '../../utils/safeDisplay';

const REASON_MAX_LENGTH = 500;

const RestoreUserModal = ({
  isOpen,
  onClose,
  user,
  onRestored
}) => {
  const { t } = useTranslation('admin');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleReasonChange = (event) => {
    const value = event.target.value;
    setReason(value);
    if (value && error) {
      setError('');
    }
  };

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t('userManagement.pendingDeletion.error.reasonRequired'));
      return;
    }
    if (trimmed.length > REASON_MAX_LENGTH) {
      setError(t('userManagement.pendingDeletion.error.reasonTooLong'));
      return;
    }
    if (!user || user.userId == null) {
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const endpoint = `/api/v1/admin/users/${user.userId}/restore`;
      await StandardizedApi.post(endpoint, { reason: trimmed });
      showSuccess(t('userManagement.pendingDeletion.toast.success'));
      if (typeof onRestored === 'function') {
        onRestored(user.userId);
      }
      onClose();
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (status === 409) {
        setError(t('userManagement.pendingDeletion.error.expired'));
        showError(t('userManagement.pendingDeletion.error.expired'));
      } else {
        setError(t('userManagement.pendingDeletion.toast.failure'));
        showError(t('userManagement.pendingDeletion.toast.failure'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const targetName = toDisplayString(user?.name, '-');

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      title={t('userManagement.pendingDeletion.modal.title')}
      subtitle={t('userManagement.pendingDeletion.modal.subtitle', { name: targetName })}
      size="medium"
      variant="confirm"
      loading={submitting}
      closeOnEscape={!submitting}
      backdropClick={!submitting}
      actions={(
        <div className="mg-modal-actions">
          <MGButton
            variant="outline"
            size="medium"
            onClick={onClose}
            disabled={submitting}
            type="button"
          >
            {t('userManagement.pendingDeletion.modal.cancel')}
          </MGButton>
          <MGButton
            variant="primary"
            size="medium"
            onClick={handleConfirm}
            disabled={submitting}
            loading={submitting}
            type="button"
            data-testid="restore-user-modal-confirm"
          >
            {t('userManagement.pendingDeletion.modal.confirm')}
          </MGButton>
        </div>
      )}
    >
      <div className="mg-form-group">
        <label htmlFor="restore-reason-textarea" className="mg-label">
          {t('userManagement.pendingDeletion.modal.reasonLabel')}
        </label>
        <textarea
          id="restore-reason-textarea"
          className="mg-textarea"
          value={reason}
          onChange={handleReasonChange}
          placeholder={t('userManagement.pendingDeletion.modal.reasonPlaceholder')}
          rows={4}
          maxLength={REASON_MAX_LENGTH}
          disabled={submitting}
          data-testid="restore-user-modal-reason"
        />
        <p className="mg-form-hint">
          {t('userManagement.pendingDeletion.modal.reasonHint')} ({reason.length}/{REASON_MAX_LENGTH})
        </p>
        {error && (
          <p
            className="mg-form-error"
            role="alert"
            data-testid="restore-user-modal-error"
          >
            {error}
          </p>
        )}
      </div>
    </UnifiedModal>
  );
};

RestoreUserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string
  }),
  onRestored: PropTypes.func
};

RestoreUserModal.defaultProps = {
  user: null,
  onRestored: undefined
};

export default RestoreUserModal;
