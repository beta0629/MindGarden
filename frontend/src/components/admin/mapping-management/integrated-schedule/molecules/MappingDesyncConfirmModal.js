/**
 * MappingDesyncConfirmModal — desync Danger CTA 확인 (UnifiedModal)
 * 스펙: docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_DESYNC_SPEC.md §3.3
 *
 * @author CoreSolution
 * @since 2026-07-18
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle } from 'lucide-react';
import UnifiedModal from '../../../../common/modals/UnifiedModal';
import MGButton from '../../../../common/MGButton';
import SafeText from '../../../../common/SafeText';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../../erp/common/erpMgButtonProps';

const MappingDesyncConfirmModal = ({
  isOpen,
  title,
  subtitle,
  onConfirm,
  onClose,
  processing
}) => {
  const safeTitle = toDisplayString(title, '');
  const safeSubtitle = toDisplayString(subtitle, '');

  const actions = (
    <>
      <MGButton
        type="button"
        variant="secondary"
        size="medium"
        className={buildErpMgButtonClassName({
          variant: 'secondary',
          size: 'md',
          loading: false,
          className: 'integrated-schedule__desync-modal-btn-cancel'
        })}
        onClick={onClose}
        disabled={processing}
        aria-label="취소"
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        preventDoubleClick={false}
        data-testid="mapping-desync-modal-cancel"
      >
        취소
      </MGButton>
      <MGButton
        type="button"
        variant="danger"
        size="medium"
        className={buildErpMgButtonClassName({
          variant: 'danger',
          size: 'md',
          loading: processing,
          className: 'integrated-schedule__desync-modal-btn-confirm integrated-schedule__action-danger'
        })}
        onClick={onConfirm}
        disabled={processing}
        loading={processing}
        aria-label="확인"
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        preventDoubleClick={false}
        data-testid="mapping-desync-modal-confirm"
      >
        확인
      </MGButton>
    </>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={safeTitle}
      size="medium"
      variant="confirm"
      backdropClick={!processing}
      closeOnEscape={!processing}
      actions={actions}
      className="mg-v2-ad-b0kla"
      aria-label={safeTitle}
      data-testid="mapping-desync-modal"
    >
      <div className="integrated-schedule__desync-modal-body">
        <AlertTriangle
          className="integrated-schedule__desync-modal-icon"
          size={28}
          aria-hidden="true"
        />
        <p className="integrated-schedule__desync-modal-message">
          <SafeText>{safeSubtitle}</SafeText>
        </p>
      </div>
    </UnifiedModal>
  );
};

MappingDesyncConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  processing: PropTypes.bool
};

MappingDesyncConfirmModal.defaultProps = {
  title: '',
  subtitle: '',
  processing: false
};

export default MappingDesyncConfirmModal;
