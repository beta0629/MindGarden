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
import SettingSwitchRow from '../../../common/molecules/SettingSwitchRow';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import {
  getParentCodeGroupForSubcategory,
  isSubcategoryCodeGroup
} from '../../../../utils/commonCodeParentGroups';
import { supportsAutoCodeValue } from '../../../../constants/tenantCodeConstants';
import { useTranslation } from 'react-i18next';

const TENANT_COMMON_CODE_FORM_ID = 'tenant-common-code-manager-form';

/** 최소 등록 UX 대상: 비용·수입 카테고리 (표시이름 + parent만) */
const isMinimalExpenseIncomeGroup = (codeGroup) =>
  supportsAutoCodeValue(codeGroup) && codeGroup !== 'CONSULTATION_PACKAGE';

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
  const autoCodeOnCreate = modalMode === 'create' && supportsAutoCodeValue(formData.codeGroup);
  const minimalFields = isMinimalExpenseIncomeGroup(formData.codeGroup || '');
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    if (showModal) {
      setErrors({});
    }
  }, [showModal, modalMode]);

  const updateForm = (next) => {
    onFormChange(next);
    setErrors((prev) => {
      const cleared = { ...prev };
      if (next.codeValue !== formData.codeValue) cleared.codeValue = '';
      if (next.codeLabel !== formData.codeLabel) cleared.codeLabel = '';
      if (next.parentCodeValue !== formData.parentCodeValue) cleared.parentCodeValue = '';
      return cleared;
    });
  };

  /**
   * codeValue/codeLabel JS validate. HTML required만 의존하지 않음.
   * @returns {boolean}
   */
  const validateForm = () => {
    const newErrors = {};
    if (!autoCodeOnCreate && !(formData.codeValue || '').trim()) {
      newErrors.codeValue = t('admin:tenantCommonCode.msg.errCodeValueRequired', '코드값을 입력해주세요.');
    }
    if (!(formData.codeLabel || '').trim()) {
      newErrors.codeLabel = t('admin:tenantCommonCode.msg.errCodeLabelRequired', '코드명을 입력해주세요.');
    }
    if (showParentInModal && !(formData.parentCodeValue || '').trim()) {
      newErrors.parentCodeValue = t('admin:tenantCommonCode.msg.errSelectParentCategory');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    onFormSubmit(e);
  };

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
      <form id={TENANT_COMMON_CODE_FORM_ID} onSubmit={handleSubmit} noValidate>
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
          {!autoCodeOnCreate && (
            <div className="mg-v2-ad-b0kla__form-group">
              <label htmlFor="tenant-code-value" className="mg-v2-ad-b0kla__form-label">
                {t('admin:tenantCommonCode.ui.formLabelCodeValue')}
                <span className="mg-v2-form-label-required">*</span>
              </label>
              <input
                id="tenant-code-value"
                type="text"
                value={formData.codeValue}
                onChange={(e) => updateForm({ ...formData, codeValue: e.target.value })}
                disabled={modalMode === 'edit'}
                className={`mg-v2-ad-b0kla__form-input${errors.codeValue ? ' mg-v2-form-input-error' : ''}`}
                placeholder={t('admin:tenantCommonCode.ui.formPlaceholderCodeValue')}
                aria-invalid={errors.codeValue ? true : undefined}
              />
              {errors.codeValue ? (
                <span className="mg-v2-form-error" role="alert">{errors.codeValue}</span>
              ) : null}
            </div>
          )}
          {autoCodeOnCreate && (
            <div className="mg-v2-ad-b0kla__form-group">
              <label htmlFor="tenant-code-value-auto" className="mg-v2-ad-b0kla__form-label">
                {t('admin:tenantCommonCode.ui.formLabelCodeValue')}
              </label>
              <input
                id="tenant-code-value-auto"
                type="text"
                value=""
                disabled
                className="mg-v2-ad-b0kla__form-input"
                placeholder={t(
                  'admin:tenantCommonCode.ui.formPlaceholderAutoCodeValue',
                  '저장 시 자동으로 발급됩니다'
                )}
              />
            </div>
          )}
          <div className="mg-v2-ad-b0kla__form-group">
            <label htmlFor="tenant-code-label" className="mg-v2-ad-b0kla__form-label">
              {t('admin:tenantCommonCode.ui.formLabelCodeName')}
              <span className="mg-v2-form-label-required">*</span>
            </label>
            <input
              id="tenant-code-label"
              type="text"
              value={formData.codeLabel}
              onChange={(e) => updateForm({
                ...formData,
                codeLabel: e.target.value,
                koreanName: minimalFields ? e.target.value : formData.koreanName
              })}
              className={`mg-v2-ad-b0kla__form-input${errors.codeLabel ? ' mg-v2-form-input-error' : ''}`}
              placeholder={t('admin:tenantCommonCode.ui.formPlaceholderCodeName')}
              aria-invalid={errors.codeLabel ? true : undefined}
            />
            {errors.codeLabel ? (
              <span className="mg-v2-form-error" role="alert">{errors.codeLabel}</span>
            ) : null}
          </div>
        </div>
        {showParentInModal && (
          <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
            <label htmlFor="tenant-parent-category" className="mg-v2-ad-b0kla__form-label">
              {t('admin:tenantCommonCode.ui.formLabelParentCategory')}
              <span className="mg-v2-form-label-required">*</span>
            </label>
            <CustomSelect
              options={parentCategoryOptions}
              value={formData.parentCodeValue || ''}
              onChange={(v) => updateForm({
                ...formData,
                parentCodeGroup: getParentCodeGroupForSubcategory(formData.codeGroup) || '',
                parentCodeValue: v
              })}
              placeholder={t('admin:tenantCommonCode.ui.formPlaceholderParent')}
              disabled={parentOptionsLoading || parentCategoryOptions.length === 0}
              loading={parentOptionsLoading}
            />
            {errors.parentCodeValue ? (
              <span className="mg-v2-form-error" role="alert">{errors.parentCodeValue}</span>
            ) : null}
          </div>
        )}
        {!minimalFields && (
        <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
          <label htmlFor="tenant-korean-name" className="mg-v2-ad-b0kla__form-label">
            {t('admin:tenantCommonCode.ui.formLabelKoreanName')}
          </label>
          <input
            id="tenant-korean-name"
            type="text"
            value={formData.koreanName}
            onChange={(e) => updateForm({ ...formData, koreanName: e.target.value })}
            className="mg-v2-ad-b0kla__form-input"
            placeholder={t('admin:tenantCommonCode.ui.formPlaceholderKorean')}
          />
        </div>
        )}
        {!minimalFields && (
        <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
          <label htmlFor="tenant-code-desc" className="mg-v2-ad-b0kla__form-label">
            {t('admin:tenantCommonCode.ui.formLabelDescription')}
          </label>
          <textarea
            id="tenant-code-desc"
            value={formData.codeDescription}
            onChange={(e) => updateForm({ ...formData, codeDescription: e.target.value })}
            className="mg-v2-ad-b0kla__form-textarea"
            rows={3}
            placeholder={t('admin:tenantCommonCode.ui.formPlaceholderDescription')}
          />
        </div>
        )}
        {!minimalFields && (
        <div className="mg-v2-ad-b0kla__form-row">
          <div className="mg-v2-ad-b0kla__form-group">
            <label htmlFor="tenant-sort-order" className="mg-v2-ad-b0kla__form-label">
              {t('admin:tenantCommonCode.ui.formLabelSortOrder')}
            </label>
            <input
              id="tenant-sort-order"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => updateForm({
                ...formData,
                sortOrder: parseInt(e.target.value, 10)
              })}
              className="mg-v2-ad-b0kla__form-input"
            />
          </div>
          <div className="mg-v2-ad-b0kla__form-group">
            <SettingSwitchRow
              id="tenant-active"
              label={t('admin:tenantCommonCode.ui.formLabelActive')}
              checked={!!formData.isActive}
              onCheckedChange={(next) => updateForm({ ...formData, isActive: next })}
              ariaLabel={t('admin:tenantCommonCode.ui.formLabelActive')}
            />
          </div>
        </div>
        )}
        {!minimalFields && (
        <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
          <label htmlFor="tenant-extra-json" className="mg-v2-ad-b0kla__form-label">
            {t('admin:tenantCommonCode.ui.formLabelExtraJson')}
          </label>
          <textarea
            id="tenant-extra-json"
            value={formData.extraData}
            onChange={(e) => updateForm({ ...formData, extraData: e.target.value })}
            className="mg-v2-ad-b0kla__form-textarea"
            rows={3}
            placeholder={t('admin:tenantCommonCode.ui.formHelpExtraJson')}
          />
        </div>
        )}
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
