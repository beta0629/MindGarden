/**
 * 테넌트 공통코드 관리 UI (Presentational Component)
 *
 * 순수 UI — 데이터·이벤트는 props로만 처리 (B0KlA 마스터–디테일 패턴)
 *
 * @author Core Solution
 * @version 2.1.0
 * @since 2025-12-03
 */

import React from 'react';
import MGCard from '../common/MGCard';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import UnifiedModal from '../common/modals/UnifiedModal';
import CustomSelect from '../common/CustomSelect';
import {
    getParentCodeGroupForSubcategory,
    isSubcategoryCodeGroup
} from '../../utils/commonCodeParentGroups';
import { toDisplayString } from '../../utils/safeDisplay';
import { useTranslation } from 'react-i18next';
import '../admin/CommonCodeManagementB0KlA.css';
import './TenantCommonCodeManagerB0KlA.css';

const TENANT_COMMON_CODE_FORM_ID = 'tenant-common-code-manager-form';

const TenantCommonCodeManagerUI = ({
    codeGroups,
    selectedGroup,
    searchTerm,
    codes,
    loading,
    error,
    showModal,
    modalMode,
    formData,
    parentCategoryOptions = [],
    parentOptionsLoading = false,
    onSearchChange,
    onGroupSelect,
    onCreateCode,
    onEditCode,
    onDeleteCode,
    onToggleActive,
    onQuickCreatePackage,
    onFormChange,
    onFormSubmit,
    onModalClose
}) => {
    const { t } = useTranslation(['admin']);
    const parseExtraData = (extraDataStr) => {
        if (!extraDataStr) return null;
        try {
            return JSON.parse(extraDataStr);
        } catch {
            return null;
        }
    };

    const selectedGroupName = selectedGroup ? (selectedGroup.groupName || selectedGroup) : '';
    const showSubcategoryParent = isSubcategoryCodeGroup(selectedGroupName);
    const showParentInModal = isSubcategoryCodeGroup(formData.codeGroup || '');

    const resolveParentLabel = (code) => {
        if (!code?.parentCodeValue) {
            return t('admin:tenantCommonCode.ui.displayDash', '—');
        }
        const opt = parentCategoryOptions.find((o) => o.value === code.parentCodeValue);
        if (opt) {
            return toDisplayString(opt.label, t('admin:tenantCommonCode.ui.displayDash', '—'));
        }
        return toDisplayString(code.parentCodeValue, t('admin:tenantCommonCode.ui.displayDash', '—'));
    };

    return (
        <div className="mg-v2-ad-b0kla__tenant-common-root">
            {error && (
                <div className="mg-v2-ad-b0kla__tenant-error" role="alert">
                    <span className="mg-v2-ad-b0kla__tenant-error-icon" aria-hidden="true">⚠️</span>
                    {error}
                </div>
            )}

            <div className="mg-v2-ad-b0kla__common-code-container">
                <div className="mg-v2-ad-b0kla__group-list-section">
                    <div className="mg-v2-ad-b0kla__section-header">
                        {t('admin:tenantCommonCode.ui.groupListTitle')}
                    </div>
                    <div className="mg-v2-ad-b0kla__search-bar">
                        <div className="mg-v2-ad-b0kla__search-input-wrapper">
                            <input
                                type="text"
                                placeholder={t('admin:tenantCommonCode.ui.searchPlaceholder')}
                                value={searchTerm || ''}
                                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                                className="mg-v2-ad-b0kla__search-input"
                            />
                            <i className="bi bi-search mg-v2-ad-b0kla__search-icon" aria-hidden="true" />
                        </div>
                    </div>
                    {loading && !selectedGroup ? (
                        <div className="mg-v2-ad-b0kla__detail-empty">
                            <p>{t('admin:tenantCommonCode.ui.loading')}</p>
                        </div>
                    ) : (
                        <div className="mg-v2-ad-b0kla__group-list">
                            {codeGroups.map((group) => {
                                const groupName = group.groupName || group;
                                const isSelected = selectedGroup
                                    && (selectedGroup.groupName || selectedGroup) === groupName;
                                return (
                                    <MGButton
                                        key={groupName}
                                        type="button"
                                        variant="outline"
                                        fullWidth
                                        className={buildErpMgButtonClassName({
                                            variant: 'outline',
                                            size: 'md',
                                            loading: false,
                                            className: `mg-v2-ad-b0kla__group-card ${isSelected ? 'mg-v2-ad-b0kla__group-card--selected' : ''}`
                                        })}
                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                        onClick={() => onGroupSelect(group)}
                                        preventDoubleClick={false}
                                    >
                                        <div className="mg-v2-ad-b0kla__group-card-header">
                                            <span className="mg-v2-ad-b0kla__group-icon" aria-hidden="true">
                                                {group.icon || '📁'}
                                            </span>
                                            <h3 className="mg-v2-ad-b0kla__group-title">
                                                {group.displayKoreanName || group.koreanName || groupName}
                                            </h3>
                                        </div>
                                        <span className="mg-v2-ad-b0kla__group-code">{groupName}</span>
                                    </MGButton>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mg-v2-ad-b0kla__detail-section">
                    {!selectedGroup ? (
                        <div className="mg-v2-ad-b0kla__detail-empty">
                            <i className="bi bi-folder-symlink" aria-hidden="true" />
                            <h3>{t('admin:tenantCommonCode.ui.emptySelectTitle')}</h3>
                            <p>{t('admin:tenantCommonCode.ui.emptySelectDesc')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="mg-v2-ad-b0kla__section-header">
                                <span>
                                    {selectedGroup.displayKoreanName
                                        || selectedGroup.koreanName
                                        || selectedGroup.groupName
                                        || selectedGroup}
                                </span>
                                <div className="mg-v2-ad-b0kla__action-buttons">
                                    {selectedGroup.groupName === 'CONSULTATION_PACKAGE' && (
                                        <MGButton
                                            variant="secondary"
                                            className={buildErpMgButtonClassName({
                                                variant: 'secondary',
                                                size: 'md',
                                                loading: false
                                            })}
                                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                            onClick={onQuickCreatePackage}
                                            preventDoubleClick={true}
                                        >
                                            {t('admin:tenantCommonCode.ui.btnQuickPackage')}
                                        </MGButton>
                                    )}
                                    <MGButton
                                        variant="primary"
                                        className={buildErpMgButtonClassName({
                                            variant: 'primary',
                                            size: 'md',
                                            loading: false
                                        })}
                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                        onClick={onCreateCode}
                                        preventDoubleClick={true}
                                    >
                                        + {t('admin:tenantCommonCode.ui.btnAddCode')}
                                    </MGButton>
                                </div>
                            </div>
                            {selectedGroup.description && (
                                <p className="mg-codes-description">{selectedGroup.description}</p>
                            )}

                            {loading ? (
                                <div className="mg-v2-ad-b0kla__detail-empty">
                                    <p>{t('admin:tenantCommonCode.ui.loading')}</p>
                                </div>
                            ) : codes.length === 0 ? (
                                <div className="mg-v2-ad-b0kla__detail-empty">
                                    <p>{t('admin:tenantCommonCode.ui.emptyNoCodes')}</p>
                                    <MGButton
                                        variant="primary"
                                        className={buildErpMgButtonClassName({
                                            variant: 'primary',
                                            size: 'md',
                                            loading: false
                                        })}
                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                        onClick={onCreateCode}
                                        preventDoubleClick={true}
                                    >
                                        {t('admin:tenantCommonCode.ui.btnFirstAdd')}
                                    </MGButton>
                                </div>
                            ) : (
                                <div className="mg-v2-ad-b0kla__tenant-code-cards-grid">
                                    {codes.map((code) => {
                                        const extraData = parseExtraData(code.extraData);
                                        return (
                                            <MGCard
                                                key={code.id}
                                                variant="default"
                                                className="mg-v2-ad-b0kla__tenant-code-card mg-code-card"
                                            >
                                                <div className="mg-code-card__header">
                                                    <div className="mg-code-card__title-section">
                                                        <code className="mg-code-value">
                                                            {toDisplayString(code.codeValue, t('admin:tenantCommonCode.ui.displayDash', '—'))}
                                                        </code>
                                                        <h4 className="mg-code-name">
                                                            {toDisplayString(code.koreanName || code.codeLabel, t('admin:tenantCommonCode.ui.displayDash', '—'))}
                                                        </h4>
                                                    </div>
                                                    <MGButton
                                                        type="button"
                                                        className={buildErpMgButtonClassName({
                                                            variant: 'outline',
                                                            size: 'sm',
                                                            loading: false,
                                                            className: `mg-status-badge ${code.isActive ? 'mg-active' : 'mg-inactive'}`
                                                        })}
                                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                        onClick={() => onToggleActive(code.id, code.isActive)}
                                                        variant="outline"
                                                        size="small"
                                                        preventDoubleClick={false}
                                                    >
                                                        {code.isActive ? t('admin:tenantCommonCode.ui.statusActive') : t('admin:tenantCommonCode.ui.statusInactive')}
                                                    </MGButton>
                                                </div>
                                                <div className="mg-code-card__content">
                                                    {showSubcategoryParent && (
                                                        <div className="mg-code-card__field">
                                                            <span className="mg-code-card__label">{t('admin:tenantCommonCode.ui.fieldParentCategory')}</span>
                                                            <span className="mg-code-card__value">{resolveParentLabel(code)}</span>
                                                        </div>
                                                    )}
                                                    {code.codeDescription && (
                                                        <div className="mg-code-card__field">
                                                            <span className="mg-code-card__label">{t('admin:tenantCommonCode.ui.fieldDescription')}</span>
                                                            <p className="mg-code-card__value">
                                                                {toDisplayString(code.codeDescription, t('admin:tenantCommonCode.ui.displayDash', '—'))}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {(selectedGroup.groupName === 'CONSULTATION_PACKAGE'
                                                        || selectedGroup.groupName === 'ASSESSMENT_TYPE') && (
                                                        <div className="mg-code-card__field">
                                                            <span className="mg-code-card__label">{t('admin:tenantCommonCode.ui.fieldAmount')}</span>
                                                            <span className="mg-code-card__value">
                                                                {extraData?.price
                                                                    ? `${extraData.price.toLocaleString()}${t('admin:tenantCommonCode.ui.currencyWonSuffix')}`
                                                                    : t('admin:tenantCommonCode.ui.amountEmpty', '-')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="mg-code-card__field">
                                                        <span className="mg-code-card__label">{t('admin:tenantCommonCode.ui.fieldSortOrder')}</span>
                                                        <span className="mg-code-card__value">{code.sortOrder}</span>
                                                    </div>
                                                </div>
                                                <div className="mg-code-card__actions">
                                                    <MGButton
                                                        variant="secondary"
                                                        size="small"
                                                        className={buildErpMgButtonClassName({
                                                            variant: 'secondary',
                                                            size: 'sm',
                                                            loading: false
                                                        })}
                                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                        onClick={() => onEditCode(code)}
                                                        preventDoubleClick={true}
                                                    >
                                                        {t('admin:tenantCommonCode.ui.btnEdit')}
                                                    </MGButton>
                                                    <MGButton
                                                        variant="danger"
                                                        size="small"
                                                        className={buildErpMgButtonClassName({
                                                            variant: 'danger',
                                                            size: 'sm',
                                                            loading: false
                                                        })}
                                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                        onClick={() => onDeleteCode(code.id)}
                                                        preventDoubleClick={true}
                                                    >
                                                        {t('admin:tenantCommonCode.ui.btnDelete')}
                                                    </MGButton>
                                                </div>
                                            </MGCard>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <UnifiedModal
                isOpen={!!showModal}
                onClose={onModalClose}
                title={modalMode === 'create' ? t('admin:tenantCommonCode.ui.modalTitleCreate') : t('admin:tenantCommonCode.ui.modalTitleEdit')}
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
                            className={buildErpMgButtonClassName({
                                variant: 'secondary',
                                size: 'md',
                                loading: false
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={onModalClose}
                            preventDoubleClick={true}
                        >
                            {t('admin:tenantCommonCode.ui.modalBtnCancel')}
                        </MGButton>
                        <MGButton
                            type="submit"
                            form={TENANT_COMMON_CODE_FORM_ID}
                            variant="primary"
                            className={buildErpMgButtonClassName({
                                variant: 'primary',
                                size: 'md',
                                loading
                            })}
                            disabled={loading}
                            loading={loading}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            preventDoubleClick={true}
                        >
                            {modalMode === 'create' ? t('admin:tenantCommonCode.ui.modalBtnSubmitCreate') : t('admin:tenantCommonCode.ui.modalBtnSubmitEdit')}
                        </MGButton>
                    </>
                )}
            >
                <form id={TENANT_COMMON_CODE_FORM_ID} onSubmit={onFormSubmit}>
                    <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
                        <label htmlFor="tenant-code-group" className="mg-v2-ad-b0kla__form-label">{t('admin:tenantCommonCode.ui.formLabelCodeGroup')}</label>
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
                            <label htmlFor="tenant-code-value" className="mg-v2-ad-b0kla__form-label">{t('admin:tenantCommonCode.ui.formLabelCodeValue')}</label>
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
                            <label htmlFor="tenant-code-label" className="mg-v2-ad-b0kla__form-label">{t('admin:tenantCommonCode.ui.formLabelCodeName')}</label>
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
                        <label htmlFor="tenant-korean-name" className="mg-v2-ad-b0kla__form-label">{t('admin:tenantCommonCode.ui.formLabelKoreanName')}</label>
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
                        <label htmlFor="tenant-code-desc" className="mg-v2-ad-b0kla__form-label">{t('admin:tenantCommonCode.ui.formLabelDescription')}</label>
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
                            <label htmlFor="tenant-sort-order" className="mg-v2-ad-b0kla__form-label">{t('admin:tenantCommonCode.ui.formLabelSortOrder')}</label>
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
                            <label htmlFor="tenant-active" className="mg-v2-ad-b0kla__form-label">{t('admin:tenantCommonCode.ui.formLabelActive')}</label>
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
                        <label htmlFor="tenant-extra-json" className="mg-v2-ad-b0kla__form-label">{t('admin:tenantCommonCode.ui.formLabelExtraJson')}</label>
                        <textarea
                            id="tenant-extra-json"
                            value={formData.extraData}
                            onChange={(e) => onFormChange({ ...formData, extraData: e.target.value })}
                            className="mg-v2-ad-b0kla__form-textarea"
                            rows={3}
                            placeholder='{"price": 100000, "duration": 50, "sessions": 10}'
                        />
                        <small className="mg-v2-ad-b0kla__form-hint">{t('admin:tenantCommonCode.ui.formHelpExtraJson')}</small>
                    </div>
                </form>
            </UnifiedModal>
        </div>
    );
};

export default TenantCommonCodeManagerUI;
