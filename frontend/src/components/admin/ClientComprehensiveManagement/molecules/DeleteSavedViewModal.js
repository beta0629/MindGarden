import React from 'react';
import PropTypes from 'prop-types';
import UnifiedModal from '../../../common/modals/UnifiedModal';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';

const DELETE_SAVED_VIEW_MODAL_TITLE = '저장된 뷰 삭제';

/**
 * Saved View 삭제 확인 모달 (UnifiedModal confirm)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */
const DeleteSavedViewModal = ({ isOpen, viewLabel, onClose, onConfirm }) => {
  const trimmedLabel = String(viewLabel ?? '').trim();
  const message = trimmedLabel
    ? `"${trimmedLabel}" 저장된 뷰를 삭제할까요?`
    : '저장된 뷰를 삭제할까요?';

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={DELETE_SAVED_VIEW_MODAL_TITLE}
      variant="confirm"
      size="small"
      data-testid="delete-saved-view-modal"
      actions={(
        <>
          <MGButton
            type="button"
            variant="outline"
            preventDoubleClick={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
            onClick={onClose}
          >
            취소
          </MGButton>
          <MGButton
            type="button"
            variant="danger"
            preventDoubleClick={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            className={buildErpMgButtonClassName({ variant: 'danger', size: 'md', loading: false })}
            onClick={onConfirm}
            data-testid="saved-view-delete-confirm"
          >
            삭제
          </MGButton>
        </>
      )}
    >
      <p className="mg-v2-saved-view-modal__message">
        {message}
      </p>
    </UnifiedModal>
  );
};

DeleteSavedViewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  viewLabel: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default DeleteSavedViewModal;