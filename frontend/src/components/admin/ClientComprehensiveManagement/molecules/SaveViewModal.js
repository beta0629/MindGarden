import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import UnifiedModal from '../../../common/modals/UnifiedModal';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import { USER_MANAGEMENT_SAVED_VIEW_LABEL_MAX_LENGTH } from '../../../../constants/userManagementSavedViewConstants';

const SAVE_VIEW_MODAL_TITLE = '현재 뷰 저장';
const SAVE_VIEW_MODAL_LABEL = '뷰 이름';
const SAVE_VIEW_MODAL_PLACEHOLDER = '저장할 뷰 이름을 입력하세요';

/**
 * Saved View 저장 모달 (UnifiedModal)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */
const SaveViewModal = ({ isOpen, onClose, onSave }) => {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLabel('');
    }
  }, [isOpen]);

  const trimmedLabel = label.trim();
  const canSave = trimmedLabel.length > 0
    && trimmedLabel.length <= USER_MANAGEMENT_SAVED_VIEW_LABEL_MAX_LENGTH;

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    onSave(trimmedLabel);
    onClose();
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={SAVE_VIEW_MODAL_TITLE}
      variant="form"
      size="small"
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
            variant="primary"
            preventDoubleClick={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
            onClick={handleSave}
            disabled={!canSave}
            data-testid="saved-view-save-confirm"
          >
            저장
          </MGButton>
        </>
      )}
    >
      <label className="mg-v2-saved-view-modal__label" htmlFor="saved-view-label-input">
        {SAVE_VIEW_MODAL_LABEL}
      </label>
      <input
        id="saved-view-label-input"
        type="text"
        className="mg-v2-input mg-v2-saved-view-modal__input"
        value={label}
        maxLength={USER_MANAGEMENT_SAVED_VIEW_LABEL_MAX_LENGTH}
        placeholder={SAVE_VIEW_MODAL_PLACEHOLDER}
        onChange={(event) => setLabel(event.target.value)}
        data-testid="saved-view-label-input"
      />
    </UnifiedModal>
  );
};

SaveViewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default SaveViewModal;
