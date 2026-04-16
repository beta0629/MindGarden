import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import StandardizedApi from '../../utils/standardizedApi';
import { SALARY_API_ENDPOINTS, getConsultantGradeUpdateUrl } from '../../constants/salaryConstants';
import { getGradeSalaryMap, getGradeKoreanName } from '../../utils/commonCodeUtils';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import './ConsultantProfileModal.css';
import notificationManager from '../../utils/notification';
import { ErpSafeText, ErpSafeNumber, ERP_NUMBER_FORMAT } from './common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
import { toDisplayString } from '../../utils/safeDisplay';

/**
 * 급여 유형·등급·옵션 API 항목을 폼에서 쓰는 codeValue/codeLabel 형태로 맞춘다.
 * (StandardizedApi unwrap 후 value/label 만 오는 응답도 지원)
 *
 * @param {*} item - API 원본 항목
 * @returns {{ codeValue: string, codeLabel: string }}
 * @author CoreSolution
 * @since 2026-04-14
 */
const normalizeSalaryDropdownItem = (item) => {
    if (item == null || typeof item !== 'object') {
        return { codeValue: '', codeLabel: '' };
    }
    const rawValue = item.codeValue ?? item.value;
    const rawLabel = item.codeLabel ?? item.label;
    return {
        codeValue: rawValue == null ? '' : String(rawValue),
        codeLabel: toDisplayString(rawLabel, '')
    };
};

const ConsultantProfileModal = ({ 
    isOpen, 
    onClose, 
    consultant,
    onSuccess
}) => {
    const [salaryProfile, setSalaryProfile] = useState(null);
    const [showSalaryForm, setShowSalaryForm] = useState(false);
    /** 급여 프로필 조회 중 */
    const [profileLoading, setProfileLoading] = useState(false);
    /** 폼 저장 요청 중 */
    const [saving, setSaving] = useState(false);
    const [salaryFormData, setSalaryFormData] = useState({
        salaryType: 'FREELANCE',
        contractTerms: '',
        grade: '',
        baseSalary: '',
        optionTypes: [],
        isBusinessRegistered: false,
        businessRegistrationNumber: '',
        businessName: ''
    });
    const [optionTypes, setOptionTypes] = useState([]);
    const [grades, setGrades] = useState([]);
    const [salaryTypes, setSalaryTypes] = useState([]);

    // 모달이 열릴 때 급여 프로필 조회
    useEffect(() => {
        if (isOpen && consultant) {
            loadSalaryProfile();
            loadOptionTypes();
            loadGrades();
            loadSalaryTypes();
        }
    }, [isOpen, consultant]);

    /**
     * GET 급여 프로필: ajax는 ApiResponse에서 data만 주지만, data가 null이면 전체 래퍼를 반환한다.
     * 래퍼를 프로필 객체로 오인하면 salaryType 등이 없어 항상 "없음" UI가 된다.
     */
    const unwrapSalaryProfilePayload = (response) => {
        if (response == null) {
            return null;
        }
        if (typeof response === 'object' && !Array.isArray(response) && 'success' in response && 'data' in response) {
            return response.data;
        }
        return response;
    };

    const isPresentSalaryProfileDto = (p) => p != null && typeof p === 'object' && !Array.isArray(p)
        && (p.id != null || p.consultantId != null || p.salaryType != null || p.baseSalary != null);

    // 급여 프로필 조회
    const loadSalaryProfile = async() => {
        try {
            setProfileLoading(true);
            const response = await StandardizedApi.get(
              `${SALARY_API_ENDPOINTS.PROFILES}/${consultant.id}`
            );
            const payload = unwrapSalaryProfilePayload(response);
            const profile = isPresentSalaryProfileDto(payload) ? payload : null;
            const grade = profile?.grade
                || (response && response.consultant && response.consultant.grade)
                || consultant?.grade
                || '';
            if (profile) {
                const profileWithGrade = { ...profile, grade };
                setSalaryProfile(profileWithGrade);
                setSalaryFormData({
                    salaryType: profile.salaryType || 'FREELANCE',
                    contractTerms: profile.contractTerms || '',
                    grade,
                    baseSalary: profile.baseSalary != null && profile.baseSalary !== '' ? profile.baseSalary : '',
                    optionTypes: profile.optionTypes || [],
                    isBusinessRegistered: profile.isBusinessRegistered || false,
                    businessRegistrationNumber: profile.businessRegistrationNumber || '',
                    businessName: profile.businessName || ''
                });
            } else {
                setSalaryProfile(null);
                setSalaryFormData({
                    salaryType: 'FREELANCE',
                    contractTerms: '',
                    grade: consultant?.grade || '',
                    baseSalary: '',
                    optionTypes: [],
                    isBusinessRegistered: false,
                    businessRegistrationNumber: '',
                    businessName: ''
                });
            }
        } catch (error) {
            console.error('급여 프로필 조회 실패:', error);
            setSalaryProfile(null);
            setSalaryFormData({
                salaryType: 'FREELANCE',
                contractTerms: '',
                grade: consultant?.grade || '',
                baseSalary: '',
                optionTypes: [],
                isBusinessRegistered: false,
                businessRegistrationNumber: '',
                businessName: ''
            });
        } finally {
            setProfileLoading(false);
        }
    };

    // 옵션 유형 조회
    const loadOptionTypes = async() => {
        try {
            const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.OPTION_TYPES);
            let list = [];
            if (Array.isArray(response)) {
                list = response;
            } else if (response && Array.isArray(response.data)) {
                list = response.data;
            } else {
                console.warn('옵션 유형 데이터 형식이 예상과 다릅니다:', response);
                list = [];
            }
            setOptionTypes(list.map(normalizeSalaryDropdownItem));
        } catch (error) {
            console.error('옵션 유형 조회 실패:', error);
            setOptionTypes([]);
        }
    };

    // 등급 조회
    const loadGrades = async() => {
        try {
            const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.GRADES);
            let list = [];
            if (Array.isArray(response)) {
                list = response;
            } else if (response?.data && Array.isArray(response.data)) {
                list = response.data;
            }
            setGrades(list.map(normalizeSalaryDropdownItem));
        } catch (error) {
            console.error('등급 조회 실패:', error);
            setGrades([]);
        }
    };

    // 등급별 기본급여 계산 (공통 코드에서 동적 조회)
    const calculateBaseSalaryByGrade = async(grade) => {
        if (!grade) return '';
        
        try {
            const gradeSalaryMap = await getGradeSalaryMap();
            return gradeSalaryMap[grade] || 30000; // 기본값 30,000원
        } catch (error) {
            console.error('등급별 급여 조회 실패:', error);
            return 30000; // 오류 시 기본값
        }
    };

    // 급여 유형 조회
    const loadSalaryTypes = async() => {
        try {
            const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.CODES);
            let list = [];
            if (Array.isArray(response)) {
                list = response;
            } else if (response && typeof response === 'object') {
                const wrapped = response.salaryTypes ?? response.data?.salaryTypes;
                if (Array.isArray(wrapped)) {
                    list = wrapped;
                }
            }
            setSalaryTypes(list.map(normalizeSalaryDropdownItem));
        } catch (error) {
            console.error('급여 유형 조회 실패:', error);
            setSalaryTypes([]);
        }
    };

    // 사업자 등록번호 유효성 검사
    const validateBusinessRegistrationNumber = (number) => {
        // 123-45-67890 형식 검사
        const pattern = /^\d{3}-\d{2}-\d{5}$/;
        return pattern.test(number);
    };

    const normalizeGradeValue = (g) => {
        if (g == null || g === '') {
            return '';
        }
        return String(g).trim();
    };

    /**
     * 급여 폼의 등급이 User(상담사) 엔티티와 다를 때만 등급 API를 호출한다.
     * 프로필이 있으면 조회된 프로필 등급을, 없으면 부모에서 넘어온 consultant.grade를 기준으로 한다.
     */
    const syncConsultantGradeIfChanged = async() => {
        const baselineGrade = salaryProfile != null
            ? normalizeGradeValue(salaryProfile.grade)
            : normalizeGradeValue(consultant?.grade);
        const targetGrade = normalizeGradeValue(salaryFormData.grade);
        if (!targetGrade || targetGrade === baselineGrade) {
            return { ok: true, skipped: true };
        }
        try {
            const gradeResponse = await StandardizedApi.put(
                getConsultantGradeUpdateUrl(consultant.id),
                { grade: targetGrade }
            );
            const gradeOk = gradeResponse && (gradeResponse.success === true
                || (gradeResponse.data != null && gradeResponse.success !== false));
            if (!gradeOk) {
                const msg = (gradeResponse && gradeResponse.message)
                    ? gradeResponse.message
                    : '상담사 등급 업데이트에 실패했습니다.';
                return { ok: false, message: msg };
            }
            if (consultant && typeof consultant === 'object') {
                consultant.grade = targetGrade;
            }
            return { ok: true, skipped: false };
        } catch (err) {
            console.error('상담사 등급 업데이트 실패:', err);
            const msg = err?.response?.data?.message || err?.message || '상담사 등급 업데이트에 실패했습니다.';
            return { ok: false, message: msg };
        }
    };

    // 급여 프로필 생성/수정
    const handleSalaryProfileSubmit = async(e) => {
        e.preventDefault();
        try {
            setSaving(true);
            
            // 사업자 등록 시 필수 필드 검사
            if (salaryFormData.isBusinessRegistered) {
                if (!salaryFormData.businessRegistrationNumber) {
                    notificationManager.show('사업자 등록번호를 입력해주세요.', 'info');
                    setSaving(false);
                    return;
                }
                
                if (!validateBusinessRegistrationNumber(salaryFormData.businessRegistrationNumber)) {
                    notificationManager.show('사업자 등록번호 형식이 올바르지 않습니다. (예: 123-45-67890)', 'info');
                    setSaving(false);
                    return;
                }
                
                if (!salaryFormData.businessName) {
                    notificationManager.show('사업자명을 입력해주세요.', 'info');
                    setSaving(false);
                    return;
                }
            }
            
            let calculatedBaseSalary = salaryFormData.baseSalary;
            const missingBase =
                calculatedBaseSalary === '' || calculatedBaseSalary == null;
            if (missingBase && salaryFormData.grade) {
                calculatedBaseSalary = await calculateBaseSalaryByGrade(salaryFormData.grade);
            }
            
            const optionsPayload = Array.isArray(salaryFormData.optionTypes)
                ? salaryFormData.optionTypes
                    .map((o) => (typeof o === 'string'
                        ? { type: o, amount: 0, name: '' }
                        : {
                            type: o.type || o.optionType,
                            amount: Number(o.amount || o.optionAmount) || 0,
                            name: o.name || o.optionName || ''
                        }))
                    .filter((opt) => opt.type && opt.amount > 0)
                : [];

            const gradeSync = await syncConsultantGradeIfChanged();
            if (!gradeSync.ok) {
                notificationManager.show(gradeSync.message, 'error');
                return;
            }

            const profileData = {
                consultantId: consultant.id,
                salaryType: salaryFormData.salaryType,
                baseSalary: calculatedBaseSalary,
                contractTerms: salaryFormData.contractTerms,
                isBusinessRegistered: salaryFormData.isBusinessRegistered,
                businessRegistrationNumber: salaryFormData.businessRegistrationNumber,
                businessName: salaryFormData.businessName,
                isActive: salaryProfile?.isActive !== false,
                options: optionsPayload
            };

            const existingProfileId =
                salaryProfile && salaryProfile.id != null ? salaryProfile.id : null;
            const response = existingProfileId != null
                ? await StandardizedApi.put(
                    SALARY_API_ENDPOINTS.getProfileUpdateUrl(existingProfileId),
                    profileData
                  )
                : await StandardizedApi.post(SALARY_API_ENDPOINTS.PROFILES, profileData);
            if (response != null && typeof response === 'object' && response.success === false) {
                notificationManager.show(`급여 프로필 저장에 실패했습니다: ${response.message || ''}`, 'error');
            } else {
                notificationManager.show('급여 프로필이 성공적으로 저장되었습니다.', 'info');
                setShowSalaryForm(false);
                await loadSalaryProfile();
                onSuccess?.(response);
            }
        } catch (error) {
            console.error('급여 프로필 저장 실패:', error);
            notificationManager.show('급여 프로필 저장 중 오류가 발생했습니다.', 'info');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !consultant) return null;

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={onClose}
            title={toDisplayString(`급여 프로필 - ${consultant.name}`)}
            size="large"
            className="mg-v2-ad-b0kla consultant-profile-modal-content"
        >
            <div className="consultant-profile-modal-body" aria-busy={profileLoading || saving}>
                <div className="consultant-profile-info-section salary-management__profile-view">
                    <div className="consultant-profile-info-header">
                        <h4 className="consultant-profile-info-title">급여 프로필</h4>
                        {!showSalaryForm && (
                            <MGButton
                                type="button"
                                variant="primary"
                                size="medium"
                                className={buildErpMgButtonClassName({
                                    variant: 'primary',
                                    loading: false,
                                    className: 'consultant-profile-edit-btn'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                disabled={profileLoading}
                                onClick={() => setShowSalaryForm(true)}
                            >
                                {salaryProfile ? '수정' : '생성'}
                            </MGButton>
                        )}
                    </div>
                        
                        {profileLoading ? (
                            <UnifiedLoading type="inline" text="데이터를 불러오는 중..." />
                        ) : salaryProfile ? (
                            <div className="consultant-profile-info-grid">
                                <div className="consultant-profile-info-item">
                                    <label className="consultant-profile-info-label">급여 유형</label>
                                    <span className="consultant-profile-info-value">
                                        <ErpSafeText
                                            value={
                                                salaryProfile.salaryType === 'FREELANCE' ? '프리랜서'
                                                    : salaryProfile.salaryType === 'REGULAR' ? '정규직' : salaryProfile.salaryType
                                            }
                                        />
                                    </span>
                                </div>
                                <div className="consultant-profile-info-item">
                                    <label className="consultant-profile-info-label">상담사 등급</label>
                                    <span className="consultant-profile-info-value">
                                        <ErpSafeText
                                            value={
                                                grades.find((g) => g.codeValue === salaryProfile.grade)?.codeLabel
                                                || salaryProfile.grade || '미설정'
                                            }
                                        />
                                    </span>
                                </div>
                                <div className="consultant-profile-info-item">
                                    <label className="consultant-profile-info-label">기본 급여</label>
                                    <span className="consultant-profile-info-value">
                                        {salaryProfile.baseSalary ? (
                                            <ErpSafeNumber value={salaryProfile.baseSalary} formatType={ERP_NUMBER_FORMAT.CURRENCY} />
                                        ) : (
                                            <ErpSafeText value="미설정" />
                                        )}
                                    </span>
                                </div>
                                <div className="consultant-profile-info-item">
                                    <label className="consultant-profile-info-label">사업자 등록</label>
                                    <span className="consultant-profile-info-value">
                                        <ErpSafeText
                                            value={
                                                salaryProfile.isBusinessRegistered
                                                    ? '사업자 등록 (부가세 10% + 원천징수 3.3%)'
                                                    : '일반 프리랜서 (원천징수 3.3%만)'
                                            }
                                        />
                                    </span>
                                </div>
                                <div className="consultant-profile-info-item">
                                    <label className="consultant-profile-info-label">옵션 유형</label>
                                    <span className="consultant-profile-info-value">
                                        <ErpSafeText value="상담 완료 시 자동 적용" />
                                    </span>
                                </div>
                                <div className="consultant-profile-info-item consultant-profile-info-item--full-width">
                                    <label className="consultant-profile-info-label">계약 조건</label>
                                    <span className="consultant-profile-info-value">
                                        <ErpSafeText value={salaryProfile.contractTerms || '정보 없음'} />
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="consultant-profile-empty">
                                <ErpSafeText value="급여 프로필이 없습니다. 생성 버튼을 클릭해주세요." />
                            </div>
                        )}

                        {/* 급여 프로필 폼 */}
                        {showSalaryForm && (
                            <form onSubmit={handleSalaryProfileSubmit} className="salary-profile-form consultant-profile-form">
                                <div className="consultant-profile-form-notice">
                                    <h5 className="consultant-profile-form-notice-title">💡 안내사항</h5>
                                    <ul className="consultant-profile-form-notice-list">
                                        <li>상담사 등급에 따라 기본 급여가 자동으로 설정됩니다</li>
                                        <li>등급이 올라갈수록 2,000원씩 증가합니다</li>
                                        <li>기본 설정값은 계약서에 따라 다를 수 있습니다</li>
                                        <li>수퍼 관리자가 직접 선택할 수 있습니다</li>
                                    </ul>
                                </div>

                                <div className="consultant-profile-form-grid">
                                    <div className="consultant-profile-form-item">
                                        <label className="consultant-profile-form-label">급여 유형 *</label>
                                        <select
                                            value={salaryFormData.salaryType}
                                            onChange={(e) => setSalaryFormData({ ...salaryFormData, salaryType: e.target.value })}
                                            className="consultant-profile-form-select"
                                            required
                                        >
                                            <option key="salary-type-default" value="">급여 유형 선택</option>
                                            {salaryTypes.map((type, index) => (
                                                <option key={`salary-type-${type.codeValue}-${index}`} value={type.codeValue}>
                                                    {type.codeLabel}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="consultant-profile-form-item">
                                        <label className="consultant-profile-form-label">상담사 등급 *</label>
                                        <select
                                            value={salaryFormData.grade || ''}
                                            onChange={(e) => {
                                                const handleGradeChange = async() => {
                                                    const selectedGrade = e.target.value;
                                                    const calculatedBaseSalary = await calculateBaseSalaryByGrade(selectedGrade);
                                                    setSalaryFormData({
                                                        ...salaryFormData,
                                                        grade: selectedGrade,
                                                        baseSalary: calculatedBaseSalary
                                                    });
                                                };
                                                handleGradeChange();
                                            }}
                                            className="consultant-profile-form-select"
                                            required
                                        >
                                            <option key="grade-default" value="">등급 선택</option>
                                            {grades.map((grade, index) => (
                                                <option key={`grade-${grade.codeValue}-${index}`} value={grade.codeValue}>
                                                    {grade.codeLabel}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="consultant-profile-form-item">
                                        <label className="consultant-profile-form-label">기본 급여</label>
                                        <div className="consultant-profile-form-readonly">
                                            {salaryFormData.baseSalary ? (
                                                <ErpSafeNumber value={salaryFormData.baseSalary} formatType={ERP_NUMBER_FORMAT.CURRENCY} />
                                            ) : (
                                                <ErpSafeText value="등급을 선택하세요" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="consultant-profile-form-item">
                                        <label className="consultant-profile-form-label">사업자 등록 여부</label>
                                        <select
                                            value={salaryFormData.isBusinessRegistered ? 'true' : 'false'}
                                            onChange={(e) => setSalaryFormData({ ...salaryFormData, isBusinessRegistered: e.target.value === 'true' })}
                                            className="consultant-profile-form-select"
                                        >
                                            <option key="false" value="false">일반 프리랜서 (3.3% 원천징수만)</option>
                                            <option key="true" value="true">사업자 등록 (부가세 10% + 원천징수 3.3%)</option>
                                        </select>
                                        <small className="consultant-profile-form-help">
                                            사업자 등록 여부에 따라 세금 계산이 달라집니다
                                        </small>
                                    </div>
                                    
                                    {/* 사업자 등록 시 추가 필드 */}
                                    {salaryFormData.isBusinessRegistered && (
                                        <>
                                            <div className="consultant-profile-form-item">
                                                <label className="consultant-profile-form-label">사업자 등록번호 *</label>
                                                <input
                                                    type="text"
                                                    value={salaryFormData.businessRegistrationNumber}
                                                    onChange={(e) => setSalaryFormData({ ...salaryFormData, businessRegistrationNumber: e.target.value })}
                                                    placeholder="123-45-67890"
                                                    className="consultant-profile-form-input"
                                                />
                                                <small className="consultant-profile-form-help">
                                                    사업자 등록번호를 입력하세요 (예: 123-45-67890)
                                                </small>
                                            </div>
                                            <div className="consultant-profile-form-item">
                                                <label className="consultant-profile-form-label">사업자명 *</label>
                                                <input
                                                    type="text"
                                                    value={salaryFormData.businessName}
                                                    onChange={(e) => setSalaryFormData({ ...salaryFormData, businessName: e.target.value })}
                                                    placeholder="사업자명을 입력하세요"
                                                    className="consultant-profile-form-input"
                                                />
                                                <small className="consultant-profile-form-help">
                                                    사업자 등록증에 기재된 사업자명을 입력하세요
                                                </small>
                                            </div>
                                        </>
                                    )}
                                    <div className="consultant-profile-form-item">
                                        <label className="consultant-profile-form-label">옵션 유형</label>
                                        <div className="consultant-profile-form-readonly">
                                            💡 옵션 유형은 상담 완료 시 자동으로 적용됩니다
                                            <br />
                                            <small className="consultant-profile-form-help">
                                                • 초기상담: +5,000원<br />
                                                • 가족상담: +3,000원<br />
                                                • 기타 상담 유형에 따라 자동 계산
                                            </small>
                                        </div>
                                    </div>
                                    <div className="consultant-profile-form-item consultant-profile-form-item--full-width">
                                        <label className="consultant-profile-form-label">계약 조건</label>
                                        <textarea
                                            value={salaryFormData.contractTerms}
                                            onChange={(e) => setSalaryFormData({ ...salaryFormData, contractTerms: e.target.value })}
                                            placeholder="계약 조건을 입력하세요"
                                            className="consultant-profile-form-textarea"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                                <div className="salary-profile-form__actions consultant-profile-form-actions">
                                    <MGButton
                                        type="button"
                                        variant="outline"
                                        size="medium"
                                        className={buildErpMgButtonClassName({ variant: 'outline', loading: false })}
                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                        onClick={() => setShowSalaryForm(false)}
                                        disabled={saving}
                                    >
                                        취소
                                    </MGButton>
                                    <MGButton
                                        type="submit"
                                        variant="primary"
                                        size="medium"
                                        className={buildErpMgButtonClassName({ variant: 'primary', loading: saving })}
                                        disabled={saving}
                                        loading={saving}
                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                    >
                                        저장
                                    </MGButton>
                                </div>
                            </form>
                        )}
                </div>
            </div>

            <div className="consultant-profile-modal-footer">
                <MGButton
                    type="button"
                    variant="outline"
                    size="medium"
                    className={buildErpMgButtonClassName({ variant: 'outline', loading: false })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={onClose}
                    disabled={saving}
                >
                    닫기
                </MGButton>
            </div>
        </UnifiedModal>
    );
};

export default ConsultantProfileModal;
