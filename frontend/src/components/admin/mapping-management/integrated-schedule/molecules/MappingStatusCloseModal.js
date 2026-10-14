/**
 * MappingStatusCloseModal — 관리자 매칭 상태-only 종료 확인 (UnifiedModal)
 *
 * 환불 terminate와 분리. 남은 회기 표시 + 사유 필수.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import UnifiedModal from '../../../../common/modals/UnifiedModal';
import ActionButton from '../../../../common/ActionButton';
import SafeText from '../../../../common/SafeText';
import StandardizedApi from '../../../../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import { toErrorMessage } from '../../../../../utils/safeDisplay';
import notificationManager from '../../../../../utils/notification';

const MappingStatusCloseModal = ({
  isOpen,
  onClose,
  mapping,
  onClosed
}) => {
  const { t } = useTranslation(['admin']);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
      setSubmitting(false);
    }
  }, [isOpen, mapping?.id]);

  const remainingSessions = mapping?.remainingSessions ?? 0;

  const handleClose = useCallback(() => {
    if (submitting) {
      return;
    }
    onClose();
  }, [submitting, onClose]);

  const handleSubmit = useCallback(async() => {
    if (!mapping?.id || submitting) {
      return;
    }
    const trimmed = reason != null ? String(reason).trim() : '';
    if (!trimmed) {
      setError(t('admin:integratedSchedule.sidePeek.statusClose.reasonRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await StandardizedApi.post(
        API_ENDPOINTS.ADMIN.MAPPINGS.STATUS_CLOSE(mapping.id),
        { reason: trimmed }
      );
      notificationManager.success(
        t('admin:integratedSchedule.sidePeek.statusClose.success')
      );
      if (typeof onClosed === 'function') {
        onClosed({
          mappingId: mapping.id,
          status: 'TERMINATED',
          remainingSessions: mapping.remainingSessions
        });
      }
      onClose();
    } catch (err) {
      notificationManager.error(
        toErrorMessage(err, t('admin:integratedSchedule.sidePeek.statusClose.failed'))
      );
    } finally {
      setSubmitting(false);
    }
  }, [mapping, reason, submitting, onClosed, onClose, t]);

  if (!isOpen || !mapping) {
    return null;
  }

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('admin:integratedSchedule.sidePeek.statusClose.modalTitle')}
      subtitle={t('admin:integratedSchedule.sidePeek.statusClose.modalSubtitle')}
      size="small"
      variant="confirm"
      className="mg-v2-ad-b0kla"
      backdropClick={!submitting}
      showCloseButton
      loading={submitting}
      actions={(
        <>
          <ActionButton
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
            data-testid="side-peek-status-close-cancel"
          >
            {t('admin:integratedSchedule.sidePeek.statusClose.cancel')}
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={handleSubmit}
            disabled={submitting || !String(reason || '').trim()}
            data-testid="side-peek-status-close-submit"
          >
            {t('admin:integratedSchedule.sidePeek.statusClose.confirm')}
          </ActionButton>
        </>
      )}
    >
      <div className="mg-v2-modal-body integrated-schedule-status-close-modal">
        <div className="mg-v2-info-row">
          <span className="mg-v2-info-label">
            {t('admin:integratedSchedule.sidePeek.statusClose.remainingSessionsLabel')}
          </span>
          <span
            className="mg-v2-info-value"
            data-testid="side-peek-status-close-remaining"
          >
            <SafeText>{remainingSessions}</SafeText>
          </span>
        </div>
        <label
          className="mg-v2-form-label"
          htmlFor="side-peek-status-close-reason"
        >
          {t('admin:integratedSchedule.sidePeek.statusClose.reasonLabel')}
          <span className="mg-v2-form-required" aria-hidden="true"> *</span>
        </label>
        <textarea
          id="side-peek-status-close-reason"
          className="mg-v2-form-textarea"
          data-testid="side-peek-status-close-reason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) {
              setError('');
            }
          }}
          placeholder={t('admin:integratedSchedule.sidePeek.statusClose.reasonPlaceholder')}
          rows={4}
          disabled={submitting}
          required
          aria-required="true"
        />
        {error ? (
          <span className="mg-v2-form-error" role="alert" data-testid="side-peek-status-close-reason-error">
            {error}
          </span>
        ) : null}
      </div>
    </UnifiedModal>
  );
};

MappingStatusCloseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    remainingSessions: PropTypes.number
  }),
  onClosed: PropTypes.func
};

MappingStatusCloseModal.defaultProps = {
  mapping: null,
  onClosed: undefined
};

export default MappingStatusCloseModal;
