/**
 * TenantCommonCodeFormModal — 생성·수정 UnifiedModal (G5-02)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../../common/MGButton';
import UnifiedModal from '../../../common/modals/UnifiedModal';
import CustomSelect from '../../../common/CustomSelect';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import {
  getParentCodeGroupForSubcategory,
  isSubcategoryCodeGroup
} from '../../../../utils/commonCodeParentGroups';
import { useTranslation } from 'react-i18next';

const TENANT_COMMON_CODE_FORM_ID = 'tenant-common-code-manager-form';

const TenantCommonCodeFormModal = ({
  showModal,
  modalMode,
  formData,
  loading,
  parentCategoryOptions,
  parentOptionsLoading,
  onFormChange,
  onFormSubmit,
  onModalClose
}) => {
  const { t } = useTranslation(['admin']);
  const showParentInModal = isSubcategoryCodeGroup(formData.codeGroup || '');

  return (
    <UnifiedModal
      isOpen={!!showModal}
      onClose={onModalClose}
      title={modalMode === 'create'
        ? t('admin:tenantCommonCode.ui.modalTitleCreate')
        : t('admin:tenantCommonCode.ui.modalTitleEdit')}
      size="large"
      variant="form"
      className="mg-v2-ad-b0kla"
      backdropClick
      showCloseButton
      actions={(
        <>
          <MGButton
            type="button"
            variant="secondary"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onModalClose}
            preventDoubleClick
          >
            {t('admin:tenantCommonCode.ui.modalBtnCancel')}
          </MGButton>
          <MGButton
            type="submit"
            form={TENANT_COMMON_CODE_FORM_ID}
            variant="primary"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading })}
            disabled={loading}
            loading={loading}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick
          >
            {modalMode === 'create'
              ? t('admin:tenantCommonCode.ui.modalBtnSubmitCreate')
              : t('admin:tenantCommonCode.ui.modalBtnSubmitEdit')}
          </MGButton>
        </>
      )}
    >
      <form id={TENANT_COMMON_CODE_FORM_ID} onSubmit={onFormSubmit}>
        <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
          <label htmlFor="tenant-code-group" className="mg-v2-ad-b0kla__form-label">
            {t('admin:tenantCommonCode.ui.formLabelCodeGroup')}
          </label>
          <input
            id="tenant-code-group"
            type="text"
            value={formData.codeGroup}
            disabled
            className="mg-v2-ad-b0kla__form-input"
          />
        </div>
        <div className="mg-v2-ad-b0kla__form-row">
          <div className="mg-v2-ad-b0kla__form-group">
            <label htmlFor="tenant-code-value" className="mg-v2-ad-b0kla__form-label">
              {t('admin:tenantCommonCode.ui.formLabelCodeValue')}
            </label>
            <input
              id="tenant-code-value"
              type="text"
              value={formData.codeValue}
              onChange={(e) => onFormChange({ ...formData, codeValue: e.target.value })}
              disabled={modalMode === 'edit'}
              required
              className="mg-v2-ad-b0kla__form-input"
              placeholder={t('admin:tenantCommonCode.ui.formPlaceholderCodeValue')}
            />
          </div>
          <div className="mg-v2-ad-b0kla__form-group">
            <label htmlFor="tenant-code-label" className="mg-v2-ad-b0kla__form-label">
              {t('admin:tenantCommonCode.ui.formLabelCodeName')}
            </label>
            <input
              id="tenant-code-label"
              type="text"
              value={formData.codeLabel}
              onChange={(e) => onFormChange({ ...formData, codeLabel: e.target.value })}
              required
              className="mg-v2-ad-b0kla__form-input"
              placeholder={t('admin:tenantCommonCode.ui.formPlaceholderCodeName')}
            />
          </div>
        </div>
        {showParentInModal && (
          <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
            <label htmlFor="tenant-parent-category" className="mg-v2-ad-b0kla__form-label">
              {t('admin:tenantCommonCode.ui.formLabelParentCategory')}
            </label>
            <CustomSelect
              options={parentCategoryOptions}
              value={formData.parentCodeValue || ''}
              onChange={(v) => onFormChange({
                ...formData,
                parentCodeGroup: getParentCodeGroupForSubcategory(formData.codeGroup) || '',
                parentCodeValue: v
              })}
              placeholder={t('admin:tenantCommonCode.ui.formPlaceholderParent')}
              disabled={parentOptionsLoading || parentCategoryOptions.length === 0}
              loading={parentOptionsLoading}
            />
          </div>
        )}
        <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
          <label htmlFor="tenant-korean-name" className="mg-v2-ad-b0kla__form-label">
            {t('admin:tenantCommonCode.ui.formLabelKoreanName')}
          </label>
          <input
            id="tenant-korean-name"
            type="text"
            value={formData.koreanName}
            onChange={(e) => onFormChange({ ...formData, koreanName: e.target.value })}
            className="mg-v2-ad-b0kla__form-input"
            placeholder={t('admin:tenantCommonCode.ui.formPlaceholderKorean')}
          />
        </div>
        <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
          <label htmlFor="tenant-code-desc" className="mg-v2-ad-b0kla__form-label">
            {t('admin:tenantCommonCode.ui.formLabelDescription')}
          </label>
          <textarea
            id="tenant-code-desc"
            value={formData.codeDescription}
            onChange={(e) => onFormChange({ ...formData, codeDescription: e.target.value })}
            className="mg-v2-ad-b0kla__form-textarea"
            rows={3}
            placeholder={t('admin:tenantCommonCode.ui.formPlaceholderDescription')}
          />
        </div>
        <div className="mg-v2-ad-b0kla__form-row">
          <div className="mg-v2-ad-b0kla__form-group">
            <label htmlFor="tenant-sort-order" className="mg-v2-ad-b0kla__form-label">
              {t('admin:tenantCommonCode.ui.formLabelSortOrder')}
            </label>
            <input
              id="tenant-sort-order"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => onFormChange({
                ...formData,
                sortOrder: parseInt(e.target.value, 10)
              })}
              className="mg-v2-ad-b0kla__form-input"
            />
          </div>
          <div className="mg-v2-ad-b0kla__form-group">
            <label htmlFor="tenant-active" className="mg-v2-ad-b0kla__form-label">
              {t('admin:tenantCommonCode.ui.formLabelActive')}
            </label>
            <div>
              <input
                id="tenant-active"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => onFormChange({ ...formData, isActive: e.target.checked })}
              />
            </div>
          </div>
        </div>
        <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
          <label htmlFor="tenant-extra-json" className="mg-v2-ad-b0kla__form-label">
            {t('admin:tenantCommonCode.ui.formLabelExtraJson')}
          </label>
          <textarea
            id="tenant-extra-json"
            value={formData.extraData}
            onChange={(e) => onFormChange({ ...formData, extraData: e.target.value })}
            className="mg-v2-ad-b0kla__form-textarea"
            rows={3}
            placeholder={t('admin:tenantCommonCode.ui.formHelpExtraJson')}
          />
        </div>
      </form>
    </UnifiedModal>
  );
};

TenantCommonCodeFormModal.propTypes = {
  showModal: PropTypes.bool,
  modalMode: PropTypes.oneOf(['create', 'edit']),
  formData: PropTypes.object.isRequired,
  loading: PropTypes.bool,
  parentCategoryOptions: PropTypes.array,
  parentOptionsLoading: PropTypes.bool,
  onFormChange: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired,
  onModalClose: PropTypes.func.isRequired
};

TenantCommonCodeFormModal.defaultProps = {
  showModal: false,
  modalMode: 'create',
  loading: false,
  parentCategoryOptions: [],
  parentOptionsLoading: false
};

export default TenantCommonCodeFormModal;
