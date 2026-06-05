/**
 * CleanupPendingPaymentModal — 옵션 B R4 디러티 PENDING_PAYMENT 매칭 정리 모달.
 *
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md.
 *
 * 모드:
 *  - single: 단건 매칭 정리 (POST /mappings/{id}/cleanup-pending-payment)
 *  - bulk:   일괄 매칭 정리 (POST /mappings/pending-payment-dirty/bulk-cleanup)
 *
 * 입력:
 *  - 정리 사유 (textarea, 최소 10자, 최대 500자, 필수)
 *  - 내담자에게 알림 발송 토글 (default true)
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import UnifiedModal from '../../common/modals/UnifiedModal';
import SafeText from '../../common/SafeText';
import ActionBar from '../../common/ActionBar';
import ActionBarButton from '../../common/ActionBarButton';
import notificationManager from '../../../utils/notification';
import StandardizedApi from '../../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { toErrorMessage } from '../../../utils/safeDisplay';

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;

const CleanupPendingPaymentModal = ({
  isOpen,
  mode,
  target,
  selectedIds,
  onClose,
  onCompleted
}) => {
  const { t } = useTranslation(['admin']);
  const [reason, setReason] = useState('');
  const [notifyClient, setNotifyClient] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setNotifyClient(true);
      setSubmitting(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (submitting) return;
    onClose?.();
  };

  const validate = () => {
    const trimmed = (reason || '').trim();
    if (trimmed.length < MIN_REASON_LENGTH) {
      setErrorMessage(t('admin:mappings.pendingPaymentCleanup.modal.error.reasonTooShort'));
      return false;
    }
    if (trimmed.length > MAX_REASON_LENGTH) {
      setErrorMessage(t('admin:mappings.pendingPaymentCleanup.modal.error.reasonTooLong'));
      return false;
    }
    if (mode === 'bulk' && (!Array.isArray(selectedIds) || selectedIds.length === 0)) {
      setErrorMessage(t('admin:mappings.pendingPaymentCleanup.modal.error.noSelection'));
      return false;
    }
    if (mode === 'single' && (!target || target.mappingId == null)) {
      setErrorMessage(t('admin:mappings.pendingPaymentCleanup.modal.error.noTarget'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setErrorMessage(null);
    if (!validate()) {
      return;
    }
    setSubmitting(true);
    try {
      const trimmedReason = reason.trim();
      if (mode === 'single') {
        await StandardizedApi.post(
          API_ENDPOINTS.ADMIN.MAPPINGS.CLEANUP_PENDING_PAYMENT(target.mappingId),
          { reason: trimmedReason, notifyClient }
        );
        notificationManager.success(t('admin:mappings.pendingPaymentCleanup.toast.success'));
      } else {
        await StandardizedApi.post(
          API_ENDPOINTS.ADMIN.MAPPINGS.PENDING_PAYMENT_DIRTY_BULK_CLEANUP,
          { mappingIds: selectedIds, reason: trimmedReason, notifyClient }
        );
        notificationManager.success(
          t('admin:mappings.pendingPaymentCleanup.toast.bulkSuccess', { count: selectedIds.length })
        );
      }
      onCompleted?.();
    } catch (err) {
      const message = err?.response?.data?.message
        || err?.message
        || toErrorMessage(err)
        || t('admin:mappings.pendingPaymentCleanup.toast.error');
      setErrorMessage(message);
      notificationManager.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const title = mode === 'bulk'
    ? t('admin:mappings.pendingPaymentCleanup.modal.titleBulk', {
      count: Array.isArray(selectedIds) ? selectedIds.length : 0
    })
    : t('admin:mappings.pendingPaymentCleanup.modal.titleSingle', {
      mappingId: target?.mappingId ?? ''
    });

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="medium"
      backdropClick={!submitting}
      showCloseButton={!submitting}
      loading={submitting}
      actions={(
        <ActionBar align="end" gap="md">
          <ActionBarButton variant="outline" onClick={handleClose} disabled={submitting}>
            {t('admin:mappings.pendingPaymentCleanup.modal.cancel')}
          </ActionBarButton>
          <ActionBarButton variant="primary" onClick={handleSubmit} loading={submitting}>
            {t('admin:mappings.pendingPaymentCleanup.modal.confirm')}
          </ActionBarButton>
        </ActionBar>
      )}
    >
      <div className="mg-v2-cleanup-pending-payment-modal__body">
        <p>
          <SafeText tag="span">
            {t('admin:mappings.pendingPaymentCleanup.modal.description')}
          </SafeText>
        </p>

        <div className="mg-v2-cleanup-pending-payment-modal__field-group">
          <label htmlFor="cleanup-pending-payment-reason">
            {t('admin:mappings.pendingPaymentCleanup.modal.reason')}
          </label>
          <textarea
            id="cleanup-pending-payment-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            maxLength={MAX_REASON_LENGTH}
            placeholder={t('admin:mappings.pendingPaymentCleanup.modal.reasonPlaceholder')}
          />
          <small>
            {t('admin:mappings.pendingPaymentCleanup.modal.reasonHint', {
              min: MIN_REASON_LENGTH,
              max: MAX_REASON_LENGTH
            })}
          </small>
        </div>

        <div className="mg-v2-cleanup-pending-payment-modal__field-group">
          <label>
            <input
              type="checkbox"
              checked={notifyClient}
              disabled={submitting}
              onChange={(e) => setNotifyClient(e.target.checked)}
            />
            <SafeText tag="span">
              {t('admin:mappings.pendingPaymentCleanup.modal.notifyClient')}
            </SafeText>
          </label>
        </div>

        {errorMessage ? (
          <p role="alert" className="mg-v2-cleanup-pending-payment-modal__error">
            <SafeText tag="span">{errorMessage}</SafeText>
          </p>
        ) : null}
      </div>
    </UnifiedModal>
  );
};

CleanupPendingPaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['single', 'bulk']).isRequired,
  target: PropTypes.shape({
    mappingId: PropTypes.number,
    consultantName: PropTypes.string,
    clientName: PropTypes.string
  }),
  selectedIds: PropTypes.arrayOf(PropTypes.number),
  onClose: PropTypes.func.isRequired,
  onCompleted: PropTypes.func
};

CleanupPendingPaymentModal.defaultProps = {
  target: null,
  selectedIds: [],
  onCompleted: undefined
};

export default CleanupPendingPaymentModal;
