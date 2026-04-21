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
import { TENANT_COMMON_CODE_UI } from '../../constants/tenantCommonCodeManagerStrings';
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
    const UI = TENANT_COMMON_CODE_UI;

    const resolveParentLabel = (code) => {
        if (!code?.parentCodeValue) {
            return UI.DISPLAY_DASH;
        }
        const opt = parentCategoryOptions.find((o) => o.value === code.parentCodeValue);
        if (opt) {
            return toDisplayString(opt.label, UI.DISPLAY_DASH);
        }
        return toDisplayString(code.parentCodeValue, UI.DISPLAY_DASH);
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
                        {UI.GROUP_LIST_TITLE}
                    </div>
                    <div className="mg-v2-ad-b0kla__search-bar">
                        <div className="mg-v2-ad-b0kla__search-input-wrapper">
                            <input
                                type="text"
                                placeholder={UI.SEARCH_PLACEHOLDER}
                                value={searchTerm || ''}
                                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                                className="mg-v2-ad-b0kla__search-input"
                            />
                            <i className="bi bi-search mg-v2-ad-b0kla__search-icon" aria-hidden="true" />
                        </div>
                    </div>
                    {loading && !selectedGroup ? (
                        <div className="mg-v2-ad-b0kla__detail-empty">
                            <p>{UI.LOADING}</p>
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
                            <h3>{UI.EMPTY_SELECT_TITLE}</h3>
                            <p>{UI.EMPTY_SELECT_DESC}</p>
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
                                            {UI.BTN_QUICK_PACKAGE}
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
                                        + {UI.BTN_ADD_CODE}
                                    </MGButton>
                                </div>
                            </div>
                            {selectedGroup.description && (
                                <p className="mg-codes-description">{selectedGroup.description}</p>
                            )}

                            {loading ? (
                                <div className="mg-v2-ad-b0kla__detail-empty">
                                    <p>{UI.LOADING}</p>
                                </div>
                            ) : codes.length === 0 ? (
                                <div className="mg-v2-ad-b0kla__detail-empty">
                                    <p>{UI.EMPTY_NO_CODES}</p>
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
                                        {UI.BTN_FIRST_ADD}
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
                                                            {toDisplayString(code.codeValue, UI.DISPLAY_DASH)}
                                                        </code>
                                                        <h4 className="mg-code-name">
                                                            {toDisplayString(code.koreanName || code.codeLabel, UI.DISPLAY_DASH)}
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
                                                        {code.isActive ? UI.STATUS_ACTIVE : UI.STATUS_INACTIVE}
                                                    </MGButton>
                                                </div>
                                                <div className="mg-code-card__content">
                                                    {showSubcategoryParent && (
                                                        <div className="mg-code-card__field">
                                                            <span className="mg-code-card__label">{UI.FIELD_PARENT_CATEGORY}</span>
                                                            <span className="mg-code-card__value">{resolveParentLabel(code)}</span>
                                                        </div>
                                                    )}
                                                    {code.codeDescription && (
                                                        <div className="mg-code-card__field">
                                                            <span className="mg-code-card__label">{UI.FIELD_DESCRIPTION}</span>
                                                            <p className="mg-code-card__value">
                                                                {toDisplayString(code.codeDescription, UI.DISPLAY_DASH)}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {(selectedGroup.groupName === 'CONSULTATION_PACKAGE'
                                                        || selectedGroup.groupName === 'ASSESSMENT_TYPE') && (
                                                        <div className="mg-code-card__field">
                                                            <span className="mg-code-card__label">{UI.FIELD_AMOUNT}</span>
                                                            <span className="mg-code-card__value">
                                                                {extraData?.price
                                                                    ? `${extraData.price.toLocaleString()}${UI.CURRENCY_WON_SUFFIX}`
                                                                    : UI.AMOUNT_EMPTY}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="mg-code-card__field">
                                                        <span className="mg-code-card__label">{UI.FIELD_SORT_ORDER}</span>
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
                                                        {UI.BTN_EDIT}
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
                                                        {UI.BTN_DELETE}
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
                title={modalMode === 'create' ? UI.MODAL_TITLE_CREATE : UI.MODAL_TITLE_EDIT}
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
                            {UI.MODAL_BTN_CANCEL}
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
                            {modalMode === 'create' ? UI.MODAL_BTN_SUBMIT_CREATE : UI.MODAL_BTN_SUBMIT_EDIT}
                        </MGButton>
                    </>
                )}
            >
                <form id={TENANT_COMMON_CODE_FORM_ID} onSubmit={onFormSubmit}>
                    <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
                        <label htmlFor="tenant-code-group" className="mg-v2-ad-b0kla__form-label">{UI.FORM_LABEL_CODE_GROUP}</label>
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
                            <label htmlFor="tenant-code-value" className="mg-v2-ad-b0kla__form-label">{UI.FORM_LABEL_CODE_VALUE}</label>
                            <input
                                id="tenant-code-value"
                                type="text"
                                value={formData.codeValue}
                                onChange={(e) => onFormChange({ ...formData, codeValue: e.target.value })}
                                disabled={modalMode === 'edit'}
                                required
                                className="mg-v2-ad-b0kla__form-input"
                                placeholder={UI.FORM_PLACEHOLDER_CODE_VALUE}
                            />
                        </div>
                        <div className="mg-v2-ad-b0kla__form-group">
                            <label htmlFor="tenant-code-label" className="mg-v2-ad-b0kla__form-label">{UI.FORM_LABEL_CODE_NAME}</label>
                            <input
                                id="tenant-code-label"
                                type="text"
                                value={formData.codeLabel}
                                onChange={(e) => onFormChange({ ...formData, codeLabel: e.target.value })}
                                required
                                className="mg-v2-ad-b0kla__form-input"
                                placeholder={UI.FORM_PLACEHOLDER_CODE_NAME}
                            />
                        </div>
                    </div>
                    {showParentInModal && (
                        <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
                            <label htmlFor="tenant-parent-category" className="mg-v2-ad-b0kla__form-label">
                                {UI.FORM_LABEL_PARENT_CATEGORY}
                            </label>
                            <CustomSelect
                                options={parentCategoryOptions}
                                value={formData.parentCodeValue || ''}
                                onChange={(v) => onFormChange({
                                    ...formData,
                                    parentCodeGroup: getParentCodeGroupForSubcategory(formData.codeGroup) || '',
                                    parentCodeValue: v
                                })}
                                placeholder={UI.FORM_PLACEHOLDER_PARENT}
                                disabled={parentOptionsLoading || parentCategoryOptions.length === 0}
                                loading={parentOptionsLoading}
                            />
                        </div>
                    )}
                    <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
                        <label htmlFor="tenant-korean-name" className="mg-v2-ad-b0kla__form-label">{UI.FORM_LABEL_KOREAN_NAME}</label>
                        <input
                            id="tenant-korean-name"
                            type="text"
                            value={formData.koreanName}
                            onChange={(e) => onFormChange({ ...formData, koreanName: e.target.value })}
                            className="mg-v2-ad-b0kla__form-input"
                            placeholder={UI.FORM_PLACEHOLDER_KOREAN}
                        />
                    </div>
                    <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
                        <label htmlFor="tenant-code-desc" className="mg-v2-ad-b0kla__form-label">{UI.FORM_LABEL_DESCRIPTION}</label>
                        <textarea
                            id="tenant-code-desc"
                            value={formData.codeDescription}
                            onChange={(e) => onFormChange({ ...formData, codeDescription: e.target.value })}
                            className="mg-v2-ad-b0kla__form-textarea"
                            rows={3}
                            placeholder={UI.FORM_PLACEHOLDER_DESCRIPTION}
                        />
                    </div>
                    <div className="mg-v2-ad-b0kla__form-row">
                        <div className="mg-v2-ad-b0kla__form-group">
                            <label htmlFor="tenant-sort-order" className="mg-v2-ad-b0kla__form-label">{UI.FORM_LABEL_SORT_ORDER}</label>
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
                            <label htmlFor="tenant-active" className="mg-v2-ad-b0kla__form-label">{UI.FORM_LABEL_ACTIVE}</label>
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
                        <label htmlFor="tenant-extra-json" className="mg-v2-ad-b0kla__form-label">{UI.FORM_LABEL_EXTRA_JSON}</label>
                        <textarea
                            id="tenant-extra-json"
                            value={formData.extraData}
                            onChange={(e) => onFormChange({ ...formData, extraData: e.target.value })}
                            className="mg-v2-ad-b0kla__form-textarea"
                            rows={3}
                            placeholder='{"price": 100000, "duration": 50, "sessions": 10}'
                        />
                        <small className="mg-v2-ad-b0kla__form-hint">{UI.FORM_HELP_EXTRA_JSON}</small>
                    </div>
                </form>
            </UnifiedModal>
        </div>
    );
};

export default TenantCommonCodeManagerUI;
