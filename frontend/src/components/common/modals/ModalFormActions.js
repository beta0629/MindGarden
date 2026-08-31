/**
 * ModalFormActions — UnifiedModal 폼 푸터 ghost+primary MGButton 공유 행 (SSOT)
 *
 * Clinic-OS §D.4: cancel=ghost(slate), submit=primary(solid dusty teal), 동일 md/medium 높이.
 * per-page button skin·원오프 CSS 금지 — ERP dual-class + _unified-modals.css 잠금만 사용.
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../MGButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT
} from '../../erp/common/erpMgButtonProps';

/** 모달 폼 액션 행 고정 size key (ERP md ↔ MGButton medium) */
const MODAL_FORM_ACTION_SIZE = 'md';
const MODAL_FORM_ACTION_MG_SIZE = 'medium';

const SUBMIT_VARIANTS = new Set([
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'outline'
]);

const CANCEL_VARIANTS = new Set(['ghost', 'secondary', 'outline']);

/**
 * @param {Object} props
 * @param {string} [props.cancelText='취소']
 * @param {string} [props.submitText='저장']
 * @param {Function} props.onCancel
 * @param {Function} [props.onSubmit] — submitFormId 사용 시 생략 가능
 * @param {boolean} [props.loading=false]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.submitFormId] — type=submit + form= 연결
 * @param {string} [props.cancelVariant='ghost']
 * @param {string} [props.submitVariant='primary']
 * @returns {JSX.Element}
 */
const ModalFormActions = ({
  cancelText = '취소',
  submitText = '저장',
  onCancel,
  onSubmit,
  loading = false,
  disabled = false,
  submitFormId,
  cancelVariant = 'ghost',
  submitVariant = 'primary'
}) => {
  const resolvedCancelVariant = CANCEL_VARIANTS.has(cancelVariant) ? cancelVariant : 'ghost';
  const resolvedSubmitVariant = SUBMIT_VARIANTS.has(submitVariant) ? submitVariant : 'primary';
  const isBusy = loading || disabled;
  const hasSubmitFormId = submitFormId != null && String(submitFormId).trim() !== '';

  return (
    <div className="mg-modal__form-actions" data-testid="modal-form-actions">
      <MGButton
        type="button"
        variant={resolvedCancelVariant}
        size={MODAL_FORM_ACTION_MG_SIZE}
        onClick={onCancel}
        disabled={isBusy}
        className={buildErpMgButtonClassName({
          variant: resolvedCancelVariant,
          size: MODAL_FORM_ACTION_SIZE,
          loading: false
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        preventDoubleClick
        data-testid="modal-form-actions-cancel"
      >
        {cancelText}
      </MGButton>
      <MGButton
        type={hasSubmitFormId ? 'submit' : 'button'}
        form={hasSubmitFormId ? submitFormId : undefined}
        variant={resolvedSubmitVariant}
        size={MODAL_FORM_ACTION_MG_SIZE}
        onClick={hasSubmitFormId ? undefined : onSubmit}
        disabled={isBusy}
        loading={loading}
        className={buildErpMgButtonClassName({
          variant: resolvedSubmitVariant,
          size: MODAL_FORM_ACTION_SIZE,
          loading
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        preventDoubleClick
        data-testid="modal-form-actions-submit"
      >
        {submitText}
      </MGButton>
    </div>
  );
};

ModalFormActions.propTypes = {
  cancelText: PropTypes.string,
  submitText: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  submitFormId: PropTypes.string,
  cancelVariant: PropTypes.oneOf(['ghost', 'secondary', 'outline']),
  submitVariant: PropTypes.oneOf([
    'primary',
    'secondary',
    'success',
    'danger',
    'warning',
    'info',
    'outline'
  ])
};

ModalFormActions.defaultProps = {
  cancelText: '취소',
  submitText: '저장',
  onSubmit: undefined,
  loading: false,
  disabled: false,
  submitFormId: undefined,
  cancelVariant: 'ghost',
  submitVariant: 'primary'
};

export default ModalFormActions;
export { MODAL_FORM_ACTION_SIZE };
