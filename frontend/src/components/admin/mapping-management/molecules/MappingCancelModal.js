/**
 * MappingCancelModal — R4 결제 대기(PENDING_PAYMENT) 매칭 관리자 취소 확인 모달.
 *
 * 디자이너 시안: docs/project-management/2026-05-28/R4_DESIGN_HANDOFF_DETAIL.md.
 * UnifiedModal medium + AlertTriangle 아이콘 + Danger/Secondary 액션 버튼.
 * 카피·라벨은 i18n (admin:mapping.cancel.modal.*) 으로만 노출하며, 색·간격은 SSOT 토큰만 사용한다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import UnifiedModal from '../../../common/modals/UnifiedModal';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';

const MAPPING_CANCEL_MODAL_TEST_ID = 'mapping-cancel-modal';
const MAPPING_CANCEL_CONFIRM_BUTTON_TEST_ID = 'mapping-cancel-modal-confirm';
const MAPPING_CANCEL_BACK_BUTTON_TEST_ID = 'mapping-cancel-modal-back';

const MappingCancelModal = ({ isOpen, onConfirm, onClose, processing }) => {
  const { t } = useTranslation();

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
          className: 'mg-v2-mapping-cancel-modal__btn-back'
        })}
        onClick={onClose}
        disabled={processing}
        aria-label={t('admin:mapping.cancel.modal.cancelLabel')}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        preventDoubleClick={false}
        data-testid={MAPPING_CANCEL_BACK_BUTTON_TEST_ID}
      >
        {t('admin:mapping.cancel.modal.cancelLabel')}
      </MGButton>
      <MGButton
        type="button"
        variant="danger"
        size="medium"
        className={buildErpMgButtonClassName({
          variant: 'danger',
          size: 'md',
          loading: processing,
          className: 'mg-v2-mapping-cancel-modal__btn-confirm'
        })}
        onClick={onConfirm}
        disabled={processing}
        loading={processing}
        aria-label={t('admin:mapping.cancel.modal.confirmLabel')}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        preventDoubleClick={false}
        data-testid={MAPPING_CANCEL_CONFIRM_BUTTON_TEST_ID}
      >
        {t('admin:mapping.cancel.modal.confirmLabel')}
      </MGButton>
    </>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin:mapping.cancel.modal.title')}
      size="medium"
      variant="confirm"
      backdropClick={!processing}
      closeOnEscape={!processing}
      actions={actions}
      className="mg-v2-mapping-cancel-modal"
      aria-label={t('admin:mapping.cancel.modal.ariaLabel')}
      data-testid={MAPPING_CANCEL_MODAL_TEST_ID}
    >
      <div className="mg-v2-mapping-cancel-modal__body">
        <AlertTriangle
          className="mg-v2-mapping-cancel-modal__icon"
          size={28}
          aria-hidden="true"
        />
        <p className="mg-v2-mapping-cancel-modal__message">
          {t('admin:mapping.cancel.modal.body')}
        </p>
      </div>
    </UnifiedModal>
  );
};

MappingCancelModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  processing: PropTypes.bool
};

MappingCancelModal.defaultProps = {
  processing: false
};

export default MappingCancelModal;
