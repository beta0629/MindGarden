import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import StandardizedApi from '../../utils/standardizedApi';
import { SALARY_API_ENDPOINTS, getConsultantGradeUpdateUrl } from '../../constants/salaryConstants';
import { showNotification } from '../../utils/notification';
import { getGradeSalaryMap, getGradeKoreanName } from '../../utils/commonCodeUtils';
import UnifiedModal from '../common/modals/UnifiedModal';
import BadgeSelect from '../common/BadgeSelect';
import MGButton from '../common/MGButton';
import './SalaryProfileFormModal.css';
import { ErpSafeText, ErpSafeNumber, ERP_NUMBER_FORMAT } from './common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
import { toDisplayString } from '../../utils/safeDisplay';
import {
  SPFM,
  SPFM_GRADE_KO_FALLBACK,
  SPFM_GRADE_TABLE_FALLBACK_ROWS,
  SPFM_OPTION_TYPE_FALLBACK,
  SPFM_OPTION_TYPE_LABELS,
  SPFM_SALARY_TYPE_FALLBACK
} from '../../constants/salaryProfileFormModalStrings';

const getProfileUrl = (consultantId) => `${SALARY_API_ENDPOINTS.PROFILES}/${consultantId}`;

const getOptionTypeLabel = (opt) => (opt && (opt.codeLabel || opt.codeName || SPFM_OPTION_TYPE_LABELS[opt.codeValue])) || (opt && opt.codeValue ? SPFM_OPTION_TYPE_LABELS[opt.codeValue] || opt.codeValue : SPFM.OPTION_TYPE_PLACEHOLDER);

const SalaryProfileFormModal = ({ 
    isOpen, 
    onClose, 
    consultant, 
    onSave 
}) => {
    const [formData, setFormData] = useState({
        consultantId: null,
        salaryType: 'FREELANCE', // FREELANCE or REGULAR
        baseSalary: 0,
        contractTerms: '',
        isActive: true,
        grade: '', // 상담사 등급 (User 쪽, API 미포함)
        isBusinessRegistered: false,
        businessRegistrationNumber: '',
        businessName: ''
    });

    const [salaryTypes, setSalaryTypes] = useState([]);
    const [optionTypes, setOptionTypes] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState([]);
    /** 공통코드 등 초기 폼 데이터 로드 */
    const [initialLoading, setInitialLoading] = useState(false);
    /** 저장 요청 중 (버튼 로딩만 사용) */
    const [saving, setSaving] = useState(false);
    const [gradeTableData, setGradeTableData] = useState([]);
    /** 등급 한글명(표시용). async 결과만 넣어 React #31 방지 */
    const [gradeLabel, setGradeLabel] = useState('');
    /** 기본 급여 표시용. async 결과만 넣어 React #31 방지 */
    const [displayBaseSalary, setDisplayBaseSalary] = useState(null);
    /** 기존 프로필 ID (수정 시 PUT 사용) */
    const [existingProfileId, setExistingProfileId] = useState(null);

    // 등급을 한글로 변환 (공통 코드에서 동적 조회)
    const convertGradeToKorean = async(grade) => {
        try {
            return await getGradeKoreanName(grade);
        } catch (error) {
            console.error('등급 한글명 조회 실패:', error);
            // 기본값 반환
            return SPFM_GRADE_KO_FALLBACK[grade] || grade;
        }
    };

    // 등급별 기본 급여 설정 (공통 코드에서 동적 조회)
    const getGradeBaseSalary = async(grade) => {
        try {
            const gradeSalaryMap = await getGradeSalaryMap();
            return gradeSalaryMap[grade] || 30000;
        } catch (error) {
            console.error('등급별 급여 조회 실패:', error);
            return 30000; // 오류 시 기본값
        }
    };

    // 등급별 옵션 자동 추가
    const getGradeOptions = (grade) => {
        const baseOptions = [
            { type: 'FAMILY_CONSULTATION', amount: 3000, name: SPFM_OPTION_TYPE_LABELS.FAMILY_CONSULTATION },
            { type: 'INITIAL_CONSULTATION', amount: 5000, name: SPFM_OPTION_TYPE_LABELS.INITIAL_CONSULTATION }
        ];

        const gradeMultiplier = {
            'CONSULTANT_JUNIOR': 1,
            'CONSULTANT_SENIOR': 2,
            'CONSULTANT_EXPERT': 3,
            'CONSULTANT_MASTER': 4
        };

        const multiplier = gradeMultiplier[grade] || 1;
        
        return baseOptions.map(option => ({
            ...option,
            amount: option.amount + (multiplier - 1) * 2000
        }));
    };

    // 등급별 옵션 설명 생성
    const getGradeOptionsDescription = (grade) => {
        const gradeMultiplier = {
            'CONSULTANT_JUNIOR': 1,
            'CONSULTANT_SENIOR': 2,
            'CONSULTANT_EXPERT': 3,
            'CONSULTANT_MASTER': 4
        };

        const multiplier = gradeMultiplier[grade] || 1;
        const additionalAmount = (multiplier - 1) * 2000;
        
        if (additionalAmount > 0) {
            return SPFM.GRADE_OPTION_DESC_EXTRA(additionalAmount);
        }
        return SPFM.GRADE_OPTION_DESC_BASE;
    };

    // 공통 코드에서 등급 정보 로드 (API 응답: { data: { codes: [...] } } 또는 { codes: [...] } 또는 배열)
    const loadGradeTableData = async() => {
        try {
            const response = await StandardizedApi.get('/api/v1/common-codes', {
              codeGroup: 'CONSULTANT_GRADE'
            });
            const rawList = (response && response.data && response.data.codes) || (response && response.codes) || (Array.isArray(response) ? response : null);
            const list = Array.isArray(rawList) ? rawList : null;
            if (list && list.length > 0) {
                const baseOptions = [
                    { type: 'FAMILY_CONSULTATION', name: SPFM_OPTION_TYPE_LABELS.FAMILY_CONSULTATION, baseAmount: 3000 },
                    { type: 'INITIAL_CONSULTATION', name: SPFM_OPTION_TYPE_LABELS.INITIAL_CONSULTATION, baseAmount: 5000 }
                ];
                const mapped = list.map(grade => {
                    const extraData = (() => { try { return JSON.parse(grade.extraData || '{}'); } catch { return {}; } })();
                    const level = extraData.level || 1;
                    const multiplier = extraData.multiplier || 1.0;
                    const options = baseOptions.map(option => ({
                        ...option,
                        amount: Math.round(option.baseAmount * multiplier)
                    }));
                    return {
                        code: grade.codeValue,
                        name: grade.codeLabel || grade.codeValue,
                        baseSalary: 30000 + (level - 1) * 5000,
                        multiplier: level,
                        options,
                        level,
                        multiplier
                    };
                });
                // codeValue 기준 중복 제거 (테넌트+코어 동시 반환 시 동일 등급이 두 번 나오는 것 방지)
                const seen = new Set();
                const gradeData = mapped.filter(g => {
                    if (seen.has(g.code)) return false;
                    seen.add(g.code);
                    return true;
                });
                setGradeTableData(gradeData);
                return;
            }
            // API가 빈 목록이거나 응답 형식이 다르면 폴백 사용
            setGradeTableData(SPFM_GRADE_TABLE_FALLBACK_ROWS);
        } catch (error) {
            console.error('등급 정보 로드 실패:', error);
            setGradeTableData(SPFM_GRADE_TABLE_FALLBACK_ROWS);
        }
    };

    // 모달 오픈 시: 기존 프로필 조회 후 폼 세팅(수정) 또는 신규 초기화
    const loadProfileAndInitForm = async() => {
        if (!consultant) return;
        try {
            const res = await StandardizedApi.get(getProfileUrl(consultant.id));
            const raw = (res && typeof res === 'object' && (res.data !== undefined ? res.data : res)) && !Array.isArray(res) ? (res.data !== undefined ? res.data : res) : null;
            const profile = raw && (raw.id != null || raw.consultantId != null) ? raw : null;
            if (profile && profile.id) {
                setExistingProfileId(profile.id);
                const baseSalary = await getGradeBaseSalary(consultant.grade || profile.grade);
                const gradeOpts = getGradeOptions(consultant.grade || profile.grade);
                setFormData({
                    consultantId: consultant.id,
                    salaryType: profile.salaryType || 'FREELANCE',
                    baseSalary: profile.baseSalary != null ? Number(profile.baseSalary) : (typeof baseSalary === 'number' ? baseSalary : 0),
                    contractTerms: profile.contractTerms || '',
                    isActive: profile.isActive !== false,
                    grade: consultant.grade || profile.grade || '',
                    isBusinessRegistered: profile.isBusinessRegistered === true,
                    businessRegistrationNumber: profile.businessRegistrationNumber || '',
                    businessName: profile.businessName || ''
                });
                setSelectedOptions(Array.isArray(profile.optionTypes) && profile.optionTypes.length > 0
                    ? profile.optionTypes.map(o => ({ type: o.type || o.optionType, amount: Number(o.amount || o.optionAmount) || 0, name: o.name || o.optionName || '' }))
                    : gradeOpts);
            } else {
                setExistingProfileId(null);
                await initializeFormData();
            }
        } catch (e) {
            console.error('급여 프로필 조회 실패:', e);
            setExistingProfileId(null);
            await initializeFormData();
        }
    };

    useEffect(() => {
        if (isOpen && consultant) {
            loadInitialData();
            loadGradeTableData();
            loadProfileAndInitForm();
        }
    }, [isOpen, consultant]);

    // consultant/formData.grade 변경 시 등급 한글명·기본급 표시용 state 갱신 (async 결과만 state에 넣어 React #31 방지)
    useEffect(() => {
        if (!consultant) {
            setGradeLabel('');
            setDisplayBaseSalary(null);
            return;
        }
        const grade = formData.grade || consultant.grade;
        if (!grade) {
            setGradeLabel('');
            setDisplayBaseSalary(null);
            return;
        }
        let cancelled = false;
        (async() => {
            try {
                const [label, salary] = await Promise.all([
                    convertGradeToKorean(grade),
                    getGradeBaseSalary(grade)
                ]);
                if (!cancelled) {
                    setGradeLabel(label);
                    setDisplayBaseSalary(typeof salary === 'number' ? salary : null);
                }
            } catch (e) {
                if (!cancelled) {
                    setGradeLabel('');
                    setDisplayBaseSalary(null);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [consultant, formData.grade]);

    const loadInitialData = async() => {
        try {
            setInitialLoading(true);
            console.log('🔍 급여 프로필 폼 초기 데이터 로드 시작');
            
            // 급여 유형 로드 (공통코드 응답: { data: { codes: [...] } } 또는 { codes: [...] } 또는 배열)
            const salaryTypeResponse = await StandardizedApi.get('/api/v1/common-codes', {
              codeGroup: 'SALARY_TYPE'
            });
            const salaryTypeList = (salaryTypeResponse?.data?.codes) ?? (salaryTypeResponse?.codes) ?? (Array.isArray(salaryTypeResponse) ? salaryTypeResponse : null);
            if (Array.isArray(salaryTypeList) && salaryTypeList.length > 0) {
                setSalaryTypes(salaryTypeList);
            } else {
                setSalaryTypes(SPFM_SALARY_TYPE_FALLBACK);
            }

            // 옵션 유형 로드 (동일 응답 형식)
            const optionTypeResponse = await StandardizedApi.get('/api/v1/common-codes', {
              codeGroup: 'SALARY_OPTION_TYPE'
            });
            const optionTypeList = (optionTypeResponse?.data?.codes) ?? (optionTypeResponse?.codes) ?? (Array.isArray(optionTypeResponse) ? optionTypeResponse : null);
            if (Array.isArray(optionTypeList) && optionTypeList.length > 0) {
                setOptionTypes(optionTypeList);
            } else {
                setOptionTypes(SPFM_OPTION_TYPE_FALLBACK);
            }
        } catch (error) {
            console.error('초기 데이터 로드 실패:', error);
            showNotification(SPFM.TOAST_LOAD_FAILED, 'error');
        } finally {
            setInitialLoading(false);
        }
    };

    const initializeFormData = async() => {
        if (!consultant) return;

        const baseSalary = await getGradeBaseSalary(consultant.grade);
        const gradeOptions = getGradeOptions(consultant.grade);

        setFormData({
            consultantId: consultant.id,
            salaryType: 'FREELANCE',
            baseSalary: typeof baseSalary === 'number' ? baseSalary : 0,
            contractTerms: '',
            isActive: true,
            grade: consultant.grade
        });

        setSelectedOptions(gradeOptions);
    };

    // 등급 변경 시 기본 급여와 옵션 업데이트
    const handleGradeChange = async(newGrade) => {
        const baseSalary = await getGradeBaseSalary(newGrade);
        const gradeOptions = getGradeOptions(newGrade);

        setFormData(prev => ({
            ...prev,
            grade: newGrade,
            baseSalary: typeof baseSalary === 'number' ? baseSalary : 0
        }));

        setSelectedOptions(gradeOptions);

        // 등급이 비어 있으면(placeholder 선택) API 호출하지 않음
        if (!newGrade || String(newGrade).trim() === '') {
            return;
        }
        // 상담사 등급 업데이트
        try {
            const response = await StandardizedApi.put(
              getConsultantGradeUpdateUrl(consultant.id),
              { grade: newGrade }
            );
            const ok = response && (response.success === true || (response.data != null && response.success !== false));
            if (ok) {
                showNotification(SPFM.TOAST_GRADE_UPDATED, 'success');
                consultant.grade = newGrade;
            } else {
                const msg = (response && response.message) ? response.message : SPFM.TOAST_GRADE_UPDATE_FAILED;
                showNotification(msg, 'error');
            }
        } catch (error) {
            console.error('등급 업데이트 실패:', error);
            const msg = error?.response?.data?.message || error?.message || SPFM.TOAST_GRADE_UPDATE_FAILED;
            showNotification(msg, 'error');
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleOptionChange = (index, field, value) => {
        const updatedOptions = [...selectedOptions];
        updatedOptions[index] = {
            ...updatedOptions[index],
            [field]: value
        };
        setSelectedOptions(updatedOptions);
    };

    const addOption = () => {
        setSelectedOptions(prev => [...prev, {
            type: '',
            amount: 0,
            name: ''
        }]);
    };

    const removeOption = (index) => {
        setSelectedOptions(prev => prev.filter((_, i) => i !== index));
    };

    // 사업자 등록번호 유효성 검사
    const validateBusinessRegistrationNumber = (number) => {
        // 123-45-67890 형식 검사
        const pattern = /^\d{3}-\d{2}-\d{5}$/;
        return pattern.test(number);
    };

    const handleSave = async() => {
        try {
            setSaving(true);

            // 사업자 등록 시 필수 필드 검사
            if (formData.isBusinessRegistered) {
                if (!formData.businessRegistrationNumber) {
                    showNotification(SPFM.TOAST_BIZ_NO_REQUIRED, 'error');
                    setSaving(false);
                    return;
                }
                
                if (!validateBusinessRegistrationNumber(formData.businessRegistrationNumber)) {
                    showNotification(SPFM.TOAST_BIZ_NO_INVALID, 'error');
                    setSaving(false);
                    return;
                }
                
                if (!formData.businessName) {
                    showNotification(SPFM.TOAST_BIZ_NAME_REQUIRED, 'error');
                    setSaving(false);
                    return;
                }
            }

            const profileData = {
                ...formData,
                options: selectedOptions.filter(opt => opt.type && opt.amount > 0)
            };

            const isUpdate = Boolean(existingProfileId);
            const response = isUpdate
                ? await StandardizedApi.put(SALARY_API_ENDPOINTS.getProfileUpdateUrl(existingProfileId), profileData)
                : await StandardizedApi.post(SALARY_API_ENDPOINTS.PROFILES, profileData);

            if (response && response.success) {
                showNotification(isUpdate ? SPFM.TOAST_PROFILE_UPDATED : SPFM.TOAST_PROFILE_CREATED, 'success');
                onSave(response.data);
                onClose();
            } else {
                showNotification(response?.message || (isUpdate ? SPFM.TOAST_PROFILE_UPDATE_FAILED : SPFM.TOAST_PROFILE_CREATE_FAILED), 'error');
            }
        } catch (error) {
            console.error(existingProfileId ? '급여 프로필 수정 실패' : '급여 프로필 생성 실패', error);
            showNotification(existingProfileId ? SPFM.TOAST_PROFILE_UPDATE_FAILED : SPFM.TOAST_PROFILE_CREATE_FAILED, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !consultant) return null;

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={onClose}
            title={toDisplayString(
                existingProfileId
                    ? `${SPFM.MODAL_TITLE_EDIT_PREFIX}${consultant.name}`
                    : `${SPFM.MODAL_TITLE_CREATE_PREFIX}${consultant.name}`
            )}
            size="large"
            className="mg-v2-ad-b0kla salary-profile-modal-content"
        >
            <div className="salary-profile-form">
                {initialLoading ? (
                    <div role="status" aria-live="polite" aria-busy="true">
                      <UnifiedLoading type="inline" text={SPFM.LOADING_INLINE} />
                    </div>
                ) : (
                <>
                {/* 기본 정보 */}
                <div className="salary-profile-form__section consultant-info-section">
                        <h4 className="consultant-info-title">{SPFM.SECTION_CONSULTANT_INFO}</h4>
                        <p className="consultant-info-item"><strong>{SPFM.LABEL_NAME}</strong> <ErpSafeText value={consultant.name} /></p>
                        <p className="consultant-info-item"><strong>{SPFM.LABEL_CURRENT_GRADE}</strong> <ErpSafeText value={gradeLabel || ((formData.grade || consultant.grade) ? SPFM.GRADE_LOADING : '')} /></p>
                        <p className="consultant-info-item">
                            <strong>{SPFM.LABEL_BASE_SALARY_INFO}</strong>{' '}
                            {displayBaseSalary != null ? (
                                <ErpSafeNumber value={displayBaseSalary} formatType={ERP_NUMBER_FORMAT.CURRENCY} />
                            ) : (
                                <ErpSafeText value={SPFM.EM_DASH} />
                            )}
                        </p>
                    </div>

                    {/* 상담사 등급 선택 */}
                    <div className="salary-profile-form__section consultant-profile-form-item">
                        <label className="consultant-profile-form-label">{SPFM.LABEL_CONSULTANT_GRADE}</label>
                        <BadgeSelect
                            className="mg-v2-form-badge-select consultant-profile-form-select"
                            value={formData.grade}
                            onChange={(val) => handleGradeChange(val)}
                            options={[
                                { value: '', label: SPFM.GRADE_SELECT_LABEL },
                                ...gradeTableData.map(grade => ({
                                    value: grade.code,
                                    label: `${toDisplayString(grade.name)} (${grade.baseSalary.toLocaleString()}${SPFM.CURRENCY_UNIT})`
                                }))
                            ]}
                            placeholder={SPFM.GRADE_SELECT_LABEL}
                        />
                        <p className="consultant-profile-form-help">
                            {SPFM.GRADE_CHANGE_HELP}
                        </p>
                    </div>

                    {/* 등급표 */}
                    <div className="salary-profile-form__section consultant-profile-form-item">
                        <label className="consultant-profile-form-label">{SPFM.LABEL_GRADE_TABLE}</label>
                        <div className="grade-table-container">
                            <div className="grade-table-header">
                                <div>{SPFM.TABLE_COL_GRADE}</div>
                                <div className="grade-table-cell--right">{SPFM.TABLE_COL_BASE_SALARY}</div>
                                <div className="grade-table-cell--right">{SPFM.TABLE_COL_FAMILY}</div>
                                <div className="grade-table-cell--right">{SPFM.TABLE_COL_INITIAL}</div>
                                <div className="grade-table-cell--right">{SPFM.TABLE_COL_EXTRA}</div>
                            </div>
                            
                            {gradeTableData.map((grade, index) => (
                                <div key={grade.code} className="grade-table-row">
                                    <div className="grade-table-cell grade-table-cell--name">
                                        <ErpSafeText value={grade.name} />
                                        {grade.code === formData.grade && (
                                            <span className="grade-selected-badge">
                                                {SPFM.BADGE_SELECTED}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grade-table-cell--right">
                                        <ErpSafeNumber value={grade.baseSalary} formatType={ERP_NUMBER_FORMAT.CURRENCY} />
                                    </div>
                                    <div className="grade-table-cell--right">
                                        <ErpSafeNumber
                                            value={grade.options && grade.options[0] ? grade.options[0].amount : 0}
                                            formatType={ERP_NUMBER_FORMAT.CURRENCY}
                                        />
                                    </div>
                                    <div className="grade-table-cell--right">
                                        <ErpSafeNumber
                                            value={grade.options && grade.options[1] ? grade.options[1].amount : 0}
                                            formatType={ERP_NUMBER_FORMAT.CURRENCY}
                                        />
                                    </div>
                                    <div className={`grade-table-cell--right ${grade.multiplier > 1 ? 'grade-table-cell--highlight' : ''}`}>
                                        {grade.multiplier > 1 ? (
                                            <ErpSafeText value={`+${((grade.multiplier - 1) * 2000).toLocaleString()}${SPFM.CURRENCY_UNIT}`} />
                                        ) : (
                                            <ErpSafeText value="-" />
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            <div className="grade-table-notice">
                                <strong>{SPFM.GRADE_NOTICE_TITLE}</strong><br/>
                                {SPFM.GRADE_NOTICE_LINE1}<br/>
                                {SPFM.GRADE_NOTICE_LINE2}<br/>
                                {SPFM.GRADE_NOTICE_LINE3}<br/>
                                {SPFM.GRADE_NOTICE_LINE4}
                            </div>
                        </div>
                    </div>

                    {/* 급여 유형 */}
                    <div className="salary-profile-form__section consultant-profile-form-item">
                        <label className="consultant-profile-form-label">{SPFM.LABEL_SALARY_TYPE}</label>
                        <BadgeSelect
                            className="mg-v2-form-badge-select consultant-profile-form-select"
                            value={formData.salaryType}
                            onChange={(val) => handleInputChange('salaryType', val)}
                            options={[
                                { value: '', label: SPFM.SALARY_TYPE_PLACEHOLDER },
                                ...salaryTypes.map(type => ({
                                    value: type.codeValue,
                                    label: toDisplayString(type.codeLabel || type.codeValue)
                                }))
                            ]}
                            placeholder={SPFM.SALARY_TYPE_PLACEHOLDER}
                        />
                    </div>

                    {/* 기본 급여 */}
                    <div className="salary-profile-form__section consultant-profile-form-item">
                        <label className="consultant-profile-form-label">{SPFM.LABEL_BASE_SALARY_INPUT}</label>
                        <input
                            type="number"
                            className="consultant-profile-form-input"
                            value={formData.baseSalary}
                            onChange={(e) => handleInputChange('baseSalary', parseInt(e.target.value) || 0)}
                            placeholder={SPFM.PLACEHOLDER_BASE_SALARY}
                        />
                    </div>

                    {/* 사업자 등록 여부 (프리랜서만) */}
                    {formData.salaryType === 'FREELANCE' && (
                        <div className="salary-profile-form__section consultant-profile-form-item">
                            <label className="consultant-profile-form-label">{SPFM.LABEL_BUSINESS_REG}</label>
                            <BadgeSelect
                                className="mg-v2-form-badge-select consultant-profile-form-select"
                                value={formData.isBusinessRegistered ? 'true' : 'false'}
                                onChange={(val) => handleInputChange('isBusinessRegistered', val === 'true')}
                                options={[
                                    { value: 'false', label: SPFM.BUSINESS_REG_OPTION_GENERAL },
                                    { value: 'true', label: SPFM.BUSINESS_REG_OPTION_REGISTERED }
                                ]}
                                placeholder={SPFM.PLACEHOLDER_SELECT}
                            />
                            <div className="tax-info-text">
                                {SPFM.TAX_INFO_GENERAL_LINE}<br/>
                                {SPFM.TAX_INFO_BUSINESS_LINE}
                            </div>
                        </div>
                    )}

                    {/* 사업자 등록 시 추가 필드 */}
                    {formData.salaryType === 'FREELANCE' && formData.isBusinessRegistered && (
                        <>
                            <div className="salary-profile-form__section consultant-profile-form-item">
                                <label className="consultant-profile-form-label">{SPFM.LABEL_BIZ_REG_NO}</label>
                                <input
                                    type="text"
                                    className="consultant-profile-form-input"
                                    value={formData.businessRegistrationNumber}
                                    onChange={(e) => handleInputChange('businessRegistrationNumber', e.target.value)}
                                    placeholder={SPFM.PLACEHOLDER_BIZ_REG_NO}
                                />
                                <div className="tax-info-text">
                                    {SPFM.HELP_BIZ_REG_NO}
                                </div>
                            </div>
                            <div className="salary-profile-form__section consultant-profile-form-item">
                                <label className="consultant-profile-form-label">{SPFM.LABEL_BIZ_NAME}</label>
                                <input
                                    type="text"
                                    className="consultant-profile-form-input"
                                    value={formData.businessName}
                                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                                    placeholder={SPFM.PLACEHOLDER_BIZ_NAME}
                                />
                                <div className="tax-info-text">
                                    {SPFM.HELP_BIZ_NAME}
                                </div>
                            </div>
                        </>
                    )}

                    {/* 계약 조건 */}
                    <div className="salary-profile-form__section consultant-profile-form-item consultant-profile-form-item--full-width">
                        <label className="consultant-profile-form-label">{SPFM.LABEL_CONTRACT}</label>
                        <textarea
                            className="consultant-profile-form-textarea"
                            value={formData.contractTerms}
                            onChange={(e) => handleInputChange('contractTerms', e.target.value)}
                            placeholder={SPFM.PLACEHOLDER_CONTRACT}
                            rows="3"
                        />
                    </div>

                    {/* 급여 옵션 */}
                    <div className="salary-profile-form__section consultant-profile-form-item consultant-profile-form-item--full-width">
                        <div className="option-header">
                            <label className="consultant-profile-form-label">{SPFM.LABEL_SALARY_OPTIONS}</label>
                            <MGButton
                                type="button"
                                variant="secondary"
                                size="small"
                                className={`${buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })} option-add-btn`}
                                loading={false}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={addOption}
                            >
                                {SPFM.BTN_ADD_OPTION}
                            </MGButton>
                        </div>
                        <p className="option-description">
                            <ErpSafeText value={getGradeOptionsDescription(formData.grade || consultant.grade)} />
                        </p>
                        
                        {selectedOptions.map((option, index) => (
                            <div key={index} className="option-item">
                                <div className="option-item-field">
                                    <BadgeSelect
                                        className="mg-v2-form-badge-select consultant-profile-form-select"
                                        value={option.type}
                                        onChange={(val) => handleOptionChange(index, 'type', val)}
                                        options={[
                                            { value: '', label: SPFM.OPTION_TYPE_PLACEHOLDER },
                                            ...optionTypes.map(opt => ({
                                                value: opt.codeValue,
                                                label: toDisplayString(getOptionTypeLabel(opt))
                                            }))
                                        ]}
                                        placeholder={SPFM.OPTION_TYPE_PLACEHOLDER}
                                    />
                                </div>
                                <div className="option-item-field">
                                    <input
                                        type="number"
                                        className="consultant-profile-form-input"
                                        value={option.amount}
                                        onChange={(e) => handleOptionChange(index, 'amount', parseInt(e.target.value) || 0)}
                                        placeholder={SPFM.PLACEHOLDER_AMOUNT}
                                    />
                                </div>
                                <div className="option-item-field">
                                    <input
                                        type="text"
                                        className="consultant-profile-form-input"
                                        value={option.name}
                                        onChange={(e) => handleOptionChange(index, 'name', e.target.value)}
                                        placeholder={SPFM.PLACEHOLDER_OPTION_NAME}
                                    />
                                </div>
                                <MGButton
                                    type="button"
                                    variant="danger"
                                    size="small"
                                    className={`${buildErpMgButtonClassName({ variant: 'danger', size: 'sm', loading: false })} option-remove-btn`}
                                    loading={false}
                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                    onClick={() => removeOption(index)}
                                >
                                    {SPFM.BTN_DELETE}
                                </MGButton>
                            </div>
                        ))}
                    </div>

                <div className="salary-profile-form__actions consultant-profile-form-actions">
                    <MGButton
                        type="button"
                        variant="outline"
                        className={buildErpMgButtonClassName({ variant: 'outline', loading: false })}
                        loading={false}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={onClose}
                        disabled={saving || initialLoading}
                    >
                        {SPFM.BTN_CANCEL}
                    </MGButton>
                    <MGButton
                        type="button"
                        variant="primary"
                        className={buildErpMgButtonClassName({ variant: 'primary', loading: saving })}
                        onClick={handleSave}
                        disabled={saving || initialLoading}
                        loading={saving}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    >
                        {SPFM.BTN_SAVE}
                    </MGButton>
                </div>
                </>
                )}
            </div>
        </UnifiedModal>
    );
};

export default SalaryProfileFormModal;
