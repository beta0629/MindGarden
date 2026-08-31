import React, { useState, useEffect, useCallback } from 'react';
import StandardizedApi from '../../../utils/standardizedApi';
import { toDisplayString } from '../../../utils/safeDisplay';
import UnifiedModal from '../../common/modals/UnifiedModal';
import ModalFormActions from '../../common/modals/ModalFormActions';
import SettingSwitchRow from '../../common/molecules/SettingSwitchRow';
import './CommonCodeForm.css';
import { useTranslation } from 'react-i18next';
import { supportsAutoCodeValue } from '../../../constants/tenantCodeConstants';
import {
    getParentCodeGroupForSubcategory,
    isSubcategoryCodeGroup
} from '../../../utils/commonCodeParentGroups';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_COMMON_CODES = '/api/v1/common-codes';

/** 최소 등록 UX: 비용·수입 카테고리 (표시이름 + parent만) */
const isMinimalExpenseIncomeGroup = (codeGroup) =>
    supportsAutoCodeValue(codeGroup) && codeGroup !== 'CONSULTATION_PACKAGE';

/** @type {string} 폼·actions submit 연결용 id (DOM 한 곳) */
const COMMON_CODE_FORM_DOM_ID = 'common-code-form-root';

/**
 * 공통코드 폼 컴포넌트 — 공통코드 생성/수정용 모달 폼
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2024-12-19
 */
const CommonCodeForm = ({
    code,
    codeGroups = [],
    onSubmit,
    onClose,
    isOpen = true,
    title: titleProp
}) => {
    const { t } = useTranslation();
    const resolvedTitle = titleProp != null && titleProp !== ''
        ? titleProp
        : (code ? '공통코드 수정' : '새 공통코드 추가');

    const [formData, setFormData] = useState({
        codeGroup: '',
        codeValue: '',
        codeLabel: '',
        codeDescription: '',
        sortOrder: 0,
        isActive: true,
        parentCodeGroup: '',
        parentCodeValue: '',
        extraData: '',
        icon: '',
        colorCode: ''
    });

    const [packageSessions, setPackageSessions] = useState(20);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [commonCodeGroupOptions, setCommonCodeGroupOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    const [parentCategoryOptions, setParentCategoryOptions] = useState([]);
    const [parentOptionsLoading, setParentOptionsLoading] = useState(false);

    const minimalFields = isMinimalExpenseIncomeGroup(formData.codeGroup || '');
    const showParentField = isSubcategoryCodeGroup(formData.codeGroup || '');
    const autoCodeOnCreate = !code && supportsAutoCodeValue(formData.codeGroup);

    const loadCommonCodeGroupOptions = useCallback(async() => {
        try {
            setLoadingCodes(true);
            const response = await StandardizedApi.get(API_COMMON_CODES, { codeGroup: 'COMMON_CODE_GROUP' });
            if (response && response.length > 0) {
                setCommonCodeGroupOptions(response.map(code => ({
                    value: code.codeValue,
                    label: code.codeLabel,
                    icon: code.icon,
                    color: code.colorCode,
                    description: code.description
                })));
            }
        } catch (error) {
            console.error('공통 코드 그룹 옵션 로드 실패:', error);
            setCommonCodeGroupOptions([
                { value: 'PACKAGE_TYPE', label: '패키지 유형', icon: '📦', color: 'var(--mg-primary-500)', description: '상담 패키지 유형' },
                { value: 'PAYMENT_METHOD', label: '결제 방법', icon: '💳', color: 'var(--mg-success-500)', description: '결제 수단' },
                { value: 'RESPONSIBILITY', label: '책임', color: 'var(--mg-warning-500)', description: '책임 및 역할' },
                { value: 'CONSULTATION_TYPE', label: '상담 유형', icon: '💬', color: 'var(--mg-purple-500)', description: '상담의 유형' },
                { value: 'GENDER', label: '성별', icon: '⚧', color: 'var(--mg-error-500)', description: '사용자 성별' },
                { value: 'ROLE', label: '역할', icon: '👑', color: 'var(--mg-info-500)', description: '사용자 역할' },
                { value: 'STATUS', label: '상태', icon: '🔄', color: 'var(--mg-warning-500)', description: '일반적인 상태' },
                { value: 'PRIORITY', label: '우선순위', icon: '⚡', color: 'var(--mg-error-500)', description: '우선순위 구분' },
                { value: 'NOTIFICATION_TYPE', label: '알림 유형', icon: '🔔', color: 'var(--mg-primary-500)', description: '알림의 유형' },
                { value: 'STATUS', label: '일정 상태', color: 'var(--mg-success-500)', description: '일정의 상태' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    useEffect(() => {
        if (code) {
            setFormData({
                codeGroup: code.codeGroup || '',
                codeValue: code.codeValue || '',
                codeLabel: code.codeLabel || '',
                codeDescription: code.codeDescription || '',
                sortOrder: code.sortOrder || 0,
                isActive: code.isActive !== undefined ? code.isActive : true,
                parentCodeGroup: code.parentCodeGroup || '',
                parentCodeValue: code.parentCodeValue || '',
                extraData: code.extraData || ''
            });

            if (code.codeGroup === 'CONSULTATION_PACKAGE' && code.extraData) {
                try {
                    const extraData = JSON.parse(code.extraData);
                    setPackageSessions(extraData.sessions || 20);
                } catch (e) {
                    console.warn('extraData 파싱 실패:', e);
                    setPackageSessions(20);
                }
            }
        }
    }, [code]);

    useEffect(() => {
        loadCommonCodeGroupOptions();
    }, [loadCommonCodeGroupOptions]);

    useEffect(() => {
        const parentGroup = getParentCodeGroupForSubcategory(formData.codeGroup);
        if (!parentGroup) {
            setParentCategoryOptions([]);
            return undefined;
        }
        let cancelled = false;
        const loadParents = async () => {
            try {
                setParentOptionsLoading(true);
                const response = await StandardizedApi.get(API_COMMON_CODES, { codeGroup: parentGroup });
                if (cancelled) {
                    return;
                }
                const rows = Array.isArray(response) ? response : [];
                setParentCategoryOptions(rows
                    .filter((row) => row && row.isActive !== false)
                    .map((row) => ({
                        value: row.codeValue,
                        label: row.codeLabel || row.koreanName || row.codeValue
                    })));
            } catch (error) {
                console.error('상위 카테고리 옵션 로드 실패:', error);
                if (!cancelled) {
                    setParentCategoryOptions([]);
                }
            } finally {
                if (!cancelled) {
                    setParentOptionsLoading(false);
                }
            }
        };
        loadParents();
        return () => {
            cancelled = true;
        };
    }, [formData.codeGroup]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const next = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };
            if (name === 'codeGroup') {
                const parentGroup = getParentCodeGroupForSubcategory(value) || '';
                next.parentCodeGroup = parentGroup;
                next.parentCodeValue = '';
            }
            if (name === 'codeLabel' && isMinimalExpenseIncomeGroup(next.codeGroup)) {
                next.koreanName = value;
            }
            return next;
        });

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const autoCode = !code && supportsAutoCodeValue(formData.codeGroup);

        if (!formData.codeGroup.trim()) {
            newErrors.codeGroup = '코드 그룹을 입력해주세요.';
        }

        if (!autoCode) {
            if (!formData.codeValue.trim()) {
                newErrors.codeValue = '코드 값을 입력해주세요.';
            } else if (!/^[A-Z0-9_]+$/.test(formData.codeValue)) {
                newErrors.codeValue = '코드 값은 대문자, 숫자, 언더스코어만 사용할 수 있습니다.';
            }
        }

        if (!formData.codeLabel.trim()) {
            newErrors.codeLabel = '표시 이름을 입력해주세요.';
        }

        if (showParentField && !(formData.parentCodeValue || '').trim()) {
            newErrors.parentCodeValue = '상위 카테고리를 선택해주세요.';
        }

        if (!minimalFields && formData.sortOrder < 0) {
            newErrors.sortOrder = '정렬 순서는 0 이상이어야 합니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async(e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const autoCode = !code && supportsAutoCodeValue(formData.codeGroup);
            let submitData = formData.codeGroup === 'CONSULTATION_PACKAGE'
                ? { ...formData, extraData: JSON.stringify({ sessions: packageSessions }) }
                : { ...formData };
            if (autoCode) {
                submitData = { ...submitData, codeValue: '' };
            }
            if (minimalFields) {
                submitData = {
                    ...submitData,
                    koreanName: submitData.codeLabel,
                    codeDescription: submitData.codeDescription || '',
                    sortOrder: submitData.sortOrder != null ? submitData.sortOrder : 0,
                    isActive: submitData.isActive !== false,
                    extraData: submitData.extraData || ''
                };
            }
            if (showParentField) {
                submitData = {
                    ...submitData,
                    parentCodeGroup: getParentCodeGroupForSubcategory(formData.codeGroup) || '',
                    parentCodeValue: formData.parentCodeValue
                };
            }

            await onSubmit(submitData);
        } catch (error) {
            console.error('폼 제출 오류:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formBusy = loadingCodes || isSubmitting;

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={onClose}
            title={resolvedTitle}
            size="large"
            variant="form"
            className="mg-v2-ad-b0kla"
            backdropClick={!isSubmitting}
            showCloseButton
            loading={isSubmitting}
            actions={(
                <ModalFormActions
                    cancelText={t('admin.actions.cancel')}
                    submitText={code ? '수정' : '생성'}
                    onCancel={onClose}
                    loading={isSubmitting}
                    submitFormId={COMMON_CODE_FORM_DOM_ID}
                    cancelVariant="ghost"
                    submitVariant="primary"
                />
            )}
        >
            <div className="mg-v2-modal-body">
                <form
                    id={COMMON_CODE_FORM_DOM_ID}
                    onSubmit={handleSubmit}
                    className="common-code-form"
                    aria-busy={formBusy}
                    aria-live="polite"
                >
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="codeGroup">
                                코드 그룹 <span className="required">*</span>
                            </label>
                            <select
                                id="codeGroup"
                                name="codeGroup"
                                value={formData.codeGroup}
                                onChange={handleChange}
                                className={`form-select ${errors.codeGroup ? 'is-invalid' : ''}`}
                                required
                            >
                                <option value="">코드 그룹을 선택하세요</option>
                                {loadingCodes ? (
                                    <option disabled>코드 그룹을 불러오는 중...</option>
                                ) : (
                                    <>
                                        {commonCodeGroupOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {[toDisplayString(option.icon, ''), toDisplayString(option.label)]
                                                    .filter((s) => s !== '')
                                                    .join(' ')}
                                            </option>
                                        ))}
                                        {codeGroups.filter(group => !commonCodeGroupOptions.some(opt => opt.value === group)).map(group => (
                                            <option key={group} value={group}>
                                                {toDisplayString(group)}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                            {errors.codeGroup && (
                                <div className="invalid-feedback">
                                    {errors.codeGroup}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="codeValue">
                                코드 값 {autoCodeOnCreate ? null : <span className="required">*</span>}
                            </label>
                            <input
                                type="text"
                                id="codeValue"
                                name="codeValue"
                                value={autoCodeOnCreate ? '' : formData.codeValue}
                                onChange={handleChange}
                                className={`form-control ${errors.codeValue ? 'is-invalid' : ''}`}
                                placeholder={
                                  autoCodeOnCreate
                                    ? '저장 시 자동으로 발급됩니다'
                                    : '예: BASIC_10, CARD, MENTAL_HEALTH'
                                }
                                required={!autoCodeOnCreate}
                                disabled={autoCodeOnCreate}
                            />
                            {errors.codeValue && (
                                <div className="invalid-feedback">
                                    {errors.codeValue}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="codeLabel">
                            {minimalFields ? '표시 이름' : '코드 라벨'} <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="codeLabel"
                            name="codeLabel"
                            value={formData.codeLabel}
                            onChange={handleChange}
                            className={`form-control ${errors.codeLabel ? 'is-invalid' : ''}`}
                            placeholder={minimalFields ? '예: 식대, 사무용품' : '예: 기본 10회기 패키지, 신용카드, 정신건강 상담'}
                            required
                        />
                        {errors.codeLabel && (
                            <div className="invalid-feedback">
                                {errors.codeLabel}
                            </div>
                        )}
                    </div>

                    {showParentField && (
                        <div className="form-group">
                            <label htmlFor="parentCodeValue">
                                상위 카테고리 <span className="required">*</span>
                            </label>
                            <select
                                id="parentCodeValue"
                                name="parentCodeValue"
                                value={formData.parentCodeValue}
                                onChange={handleChange}
                                className={`form-select ${errors.parentCodeValue ? 'is-invalid' : ''}`}
                                required
                                disabled={parentOptionsLoading || parentCategoryOptions.length === 0}
                            >
                                <option value="">
                                    {parentOptionsLoading ? '상위 카테고리 불러오는 중...' : '상위 카테고리를 선택하세요'}
                                </option>
                                {parentCategoryOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {toDisplayString(opt.label)}
                                    </option>
                                ))}
                            </select>
                            {errors.parentCodeValue && (
                                <div className="invalid-feedback">
                                    {errors.parentCodeValue}
                                </div>
                            )}
                        </div>
                    )}

                    {!minimalFields && (
                    <div className="form-group">
                        <label htmlFor="codeDescription">{t('common.labels.description')}</label>
                        <textarea
                            id="codeDescription"
                            name="codeDescription"
                            value={formData.codeDescription}
                            onChange={handleChange}
                            className="form-control"
                            rows="3"
                            placeholder="코드에 대한 상세 설명을 입력하세요"
                        />
                    </div>
                    )}

                    {!minimalFields && (
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="sortOrder">정렬 순서</label>
                            <input
                                type="number"
                                id="sortOrder"
                                name="sortOrder"
                                value={formData.sortOrder}
                                onChange={handleChange}
                                className={`form-control ${errors.sortOrder ? 'is-invalid' : ''}`}
                                min="0"
                            />
                            {errors.sortOrder && (
                                <div className="invalid-feedback">
                                    {errors.sortOrder}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="icon">아이콘</label>
                            <input
                                type="text"
                                id="icon"
                                name="icon"
                                value={formData.icon}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="예: Check, Calendar, Star"
                                maxLength="10"
                            />
                            <small className="form-text text-muted">
                                이모지나 유니코드 문자를 입력하세요 (최대 10자)
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="colorCodePicker">색상 코드</label>
                            <div className="color-input-group">
                                <input
                                    type="color"
                                    id="colorCodePicker"
                                    value={/^#[0-9A-Fa-f]{6}$/i.test(formData.colorCode || '') ? formData.colorCode : 'var(--mg-color-text-secondary)'}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, colorCode: e.target.value }));
                                    }}
                                    className="form-control color-picker"
                                />
                                <input
                                    type="text"
                                    id="colorCode"
                                    name="colorCode"
                                    value={formData.colorCode}
                                    onChange={handleChange}
                                    className="form-control color-text"
                                    placeholder="var(--mg-gray-500) 또는 #hex"
                                    pattern="^#[0-9A-Fa-f]{6}$"
                                />
                            </div>
                            <small className="form-text text-muted">
                                HEX 색상 코드를 입력하거나 색상 선택기를 사용하세요
                            </small>
                        </div>

                        <div className="form-group">
                            <SettingSwitchRow
                                id="isActive"
                                label="활성 상태"
                                checked={!!formData.isActive}
                                onCheckedChange={(next) => setFormData((prev) => ({ ...prev, isActive: next }))}
                                ariaLabel="활성 상태"
                            />
                        </div>
                    </div>
                    )}

                    {!minimalFields && !showParentField && (
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="parentCodeGroup">상위 코드 그룹</label>
                            <input
                                type="text"
                                id="parentCodeGroup"
                                name="parentCodeGroup"
                                value={formData.parentCodeGroup}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="계층 구조용 상위 그룹"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="parentCodeValueFree">상위 코드 값</label>
                            <input
                                type="text"
                                id="parentCodeValueFree"
                                name="parentCodeValue"
                                value={formData.parentCodeValue}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="계층 구조용 상위 값"
                            />
                        </div>
                    </div>
                    )}

                    {formData.codeGroup === 'CONSULTATION_PACKAGE' && (
                        <div className="form-group">
                            <label htmlFor="packageSessions">회기 수</label>
                            <input
                                type="number"
                                id="packageSessions"
                                value={packageSessions}
                                onChange={(e) => setPackageSessions(parseInt(e.target.value, 10) || 20)}
                                className="form-control"
                                min="1"
                                max="100"
                                placeholder="20"
                            />
                            <small className="form-text text-muted">
                                패키지에 포함된 상담 회기 수를 입력하세요.
                            </small>
                        </div>
                    )}

                    {!minimalFields && (
                    <div className="form-group">
                        <label htmlFor="extraData">추가 데이터 (JSON)</label>
                        <textarea
                            id="extraData"
                            name="extraData"
                            value={formData.extraData}
                            onChange={handleChange}
                            className="form-control"
                            rows="2"
                            placeholder='{"sessions": 10, "price": 500000}'
                            disabled={formData.codeGroup === 'CONSULTATION_PACKAGE'}
                        />
                        {formData.codeGroup === 'CONSULTATION_PACKAGE' && (
                            <small className="form-text text-muted">
                                패키지 그룹의 경우 회기 수 필드를 사용하세요.
                            </small>
                        )}
                    </div>
                    )}
                </form>
            </div>
        </UnifiedModal>
    );
};

export default CommonCodeForm;
