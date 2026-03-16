import React, { useState, useEffect } from 'react';
import StandardizedApi from '../../utils/standardizedApi';
import { SALARY_API_ENDPOINTS } from '../../constants/salaryConstants';
import { getGradeSalaryMap, getGradeKoreanName } from '../../utils/commonCodeUtils';
import ErpModal from './common/ErpModal';
import './ConsultantProfileModal.css';
import notificationManager from '../../utils/notification';

const ConsultantProfileModal = ({ 
    isOpen, 
    onClose, 
    consultant
}) => {
    const [salaryProfile, setSalaryProfile] = useState(null);
    const [showSalaryForm, setShowSalaryForm] = useState(false);
    const [loading, setLoading] = useState(false);
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

    // 급여 프로필 조회
    const loadSalaryProfile = async () => {
        try {
            setLoading(true);
            const response = await StandardizedApi.get(
              `${SALARY_API_ENDPOINTS.PROFILES}/${consultant.id}`
            );
            const profile = response && typeof response === 'object' && (response.data ?? response) && !Array.isArray(response)
                ? (response.data ?? response)
                : null;
            const grade = (response && response.consultant?.grade) || profile?.grade || '';
            if (profile && (profile.salaryType != null || profile.baseSalary != null || profile.consultantId != null)) {
                const profileWithGrade = { ...profile, grade };
                setSalaryProfile(profileWithGrade);
                setSalaryFormData({
                    salaryType: profile.salaryType || 'FREELANCE',
                    contractTerms: profile.contractTerms || '',
                    grade,
                    baseSalary: profile.baseSalary || '',
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
                    grade: '',
                    baseSalary: '',
                    optionTypes: [],
                    isBusinessRegistered: false
                });
            }
        } catch (error) {
            console.error('급여 프로필 조회 실패:', error);
            setSalaryProfile(null);
            setSalaryFormData({
                salaryType: 'FREELANCE',
                contractTerms: '',
                grade: '',
                baseSalary: '',
                optionTypes: [],
                isBusinessRegistered: false,
                businessRegistrationNumber: '',
                businessName: ''
            });
        } finally {
            setLoading(false);
        }
    };

    // 옵션 유형 조회
    const loadOptionTypes = async () => {
        try {
            const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.OPTION_TYPES);
            // apiGet이 unwrap하여 배열 또는 객체 반환
            if (Array.isArray(response)) {
                setOptionTypes(response);
            } else if (response && response.data) {
                setOptionTypes(response.data);
            } else {
                console.warn('옵션 유형 데이터 형식이 예상과 다릅니다:', response);
                setOptionTypes([]);
            }
        } catch (error) {
            console.error('옵션 유형 조회 실패:', error);
            setOptionTypes([]);
        }
    };

    // 등급 조회
    const loadGrades = async () => {
        try {
            const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.GRADES);
            if (Array.isArray(response)) {
                setGrades(response);
            } else if (response?.data) {
                setGrades(Array.isArray(response.data) ? response.data : []);
            } else {
                setGrades([]);
            }
        } catch (error) {
            console.error('등급 조회 실패:', error);
            setGrades([]);
        }
    };

    // 등급별 기본급여 계산 (공통 코드에서 동적 조회)
    const calculateBaseSalaryByGrade = async (grade) => {
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
    const loadSalaryTypes = async () => {
        try {
            const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.CODES);
            const salaryTypesList = response?.salaryTypes ?? response?.data?.salaryTypes;
            if (Array.isArray(salaryTypesList)) {
                setSalaryTypes(salaryTypesList);
            } else {
                setSalaryTypes([]);
            }
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

    // 급여 프로필 생성/수정
    const handleSalaryProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            // 사업자 등록 시 필수 필드 검사
            if (salaryFormData.isBusinessRegistered) {
                if (!salaryFormData.businessRegistrationNumber) {
                    notificationManager.show('사업자 등록번호를 입력해주세요.', 'info');
                    setLoading(false);
                    return;
                }
                
                if (!validateBusinessRegistrationNumber(salaryFormData.businessRegistrationNumber)) {
                    notificationManager.show('사업자 등록번호 형식이 올바르지 않습니다. (예: 123-45-67890)', 'info');
                    setLoading(false);
                    return;
                }
                
                if (!salaryFormData.businessName) {
                    notificationManager.show('사업자명을 입력해주세요.', 'info');
                    setLoading(false);
                    return;
                }
            }
            
            // 등급에 따른 기본 급여 계산 (이미 계산된 값 사용)
            const calculatedBaseSalary = salaryFormData.baseSalary || calculateBaseSalaryByGrade(salaryFormData.grade);
            
            const profileData = {
                consultantId: consultant.id,
                salaryType: salaryFormData.salaryType,
                baseSalary: calculatedBaseSalary,
                contractTerms: salaryFormData.contractTerms,
                grade: salaryFormData.grade,
                optionTypes: salaryFormData.optionTypes,
                isBusinessRegistered: salaryFormData.isBusinessRegistered,
                businessRegistrationNumber: salaryFormData.businessRegistrationNumber,
                businessName: salaryFormData.businessName
            };

            const response = await StandardizedApi.post(SALARY_API_ENDPOINTS.PROFILES, profileData);
            if (response != null && typeof response === 'object' && response.success === false) {
                notificationManager.show('급여 프로필 저장에 실패했습니다: ' + (response.message || ''), 'error');
            } else {
                notificationManager.show('급여 프로필이 성공적으로 저장되었습니다.', 'info');
                setShowSalaryForm(false);
                loadSalaryProfile();
            }
        } catch (error) {
            console.error('급여 프로필 저장 실패:', error);
            notificationManager.show('급여 프로필 저장 중 오류가 발생했습니다.', 'info');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !consultant) return null;

    return (
        <ErpModal
            isOpen={isOpen}
            onClose={onClose}
            title={`급여 프로필 - ${consultant.name}`}
            size="large"
            className="mg-v2-ad-b0kla consultant-profile-modal-content"
        >
            <div className="consultant-profile-modal-body">
                <div className="consultant-profile-info-section salary-management__profile-view">
                    <div className="consultant-profile-info-header">
                        <h4 className="consultant-profile-info-title">급여 프로필</h4>
                        {!showSalaryForm && (
                            <button
                                type="button"
                                className="mg-v2-button mg-v2-button--primary consultant-profile-edit-btn"
                                onClick={() => setShowSalaryForm(true)}
                            >
                                {salaryProfile ? '수정' : '생성'}
                            </button>
                        )}
                    </div>
                        
                        {loading ? (
                            <div className="consultant-profile-loading">로딩 중...</div>
                        ) : salaryProfile ? (
                            <div className="consultant-profile-info-grid">
                                <div className="consultant-profile-info-item">
                                    <label className="consultant-profile-info-label">급여 유형</label>
                                    <span className="consultant-profile-info-value">
                                        {salaryProfile.salaryType === 'FREELANCE' ? '프리랜서' : 
                                         salaryProfile.salaryType === 'REGULAR' ? '정규직' : salaryProfile.salaryType}
                                    </span>
                                </div>
                                <div className="consultant-profile-info-item">
                                    <label className="consultant-profile-info-label">상담사 등급</label>
                                    <span className="consultant-profile-info-value">
                                        {grades.find(g => g.codeValue === salaryProfile.grade)?.codeLabel || salaryProfile.grade || '미설정'}
                                    </span>
                                </div>
                                <div className="consultant-profile-info-item">
                                    <label className="consultant-profile-info-label">기본 급여</label>
                                    <span className="consultant-profile-info-value">
                                        {salaryProfile.baseSalary ? new Intl.NumberFormat('ko-KR').format(salaryProfile.baseSalary) + '원' : '미설정'}
                                    </span>
                                </div>
                                <div className="consultant-profile-info-item">
                                    <label className="consultant-profile-info-label">사업자 등록</label>
                                    <span className="consultant-profile-info-value">
                                        {salaryProfile.isBusinessRegistered ? 
                                            '사업자 등록 (부가세 10% + 원천징수 3.3%)' : 
                                            '일반 프리랜서 (원천징수 3.3%만)'
                                        }
                                    </span>
                                </div>
                                <div className="consultant-profile-info-item">
                                    <label className="consultant-profile-info-label">옵션 유형</label>
                                    <span className="consultant-profile-info-value">
                                        상담 완료 시 자동 적용
                                    </span>
                                </div>
                                <div className="consultant-profile-info-item consultant-profile-info-item--full-width">
                                    <label className="consultant-profile-info-label">계약 조건</label>
                                    <span className="consultant-profile-info-value">{salaryProfile.contractTerms || '정보 없음'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="consultant-profile-empty">
                                급여 프로필이 없습니다. 생성 버튼을 클릭해주세요.
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
                                            onChange={(e) => setSalaryFormData({...salaryFormData, salaryType: e.target.value})}
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
                                        {console.log('현재 선택된 등급:', salaryFormData.grade)}
                                        <select
                                            value={salaryFormData.grade || ''}
                                            onChange={(e) => {
                                                const handleGradeChange = async () => {
                                                    const selectedGrade = e.target.value;
                                                    console.log('선택된 등급:', selectedGrade);
                                                    console.log('현재 등급 목록:', grades);
                                                    
                                                    // 등급에 따른 기본급여 계산
                                                    const calculatedBaseSalary = calculateBaseSalaryByGrade(selectedGrade);
                                                    console.log('계산된 기본급여:', calculatedBaseSalary);
                                                    
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
                                            {grades.map((grade, index) => {
                                                console.log('등급 옵션:', grade.codeValue, grade.codeLabel);
                                                return (
                                                    <option key={`grade-${grade.codeValue}-${index}`} value={grade.codeValue}>
                                                        {grade.codeLabel}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div className="consultant-profile-form-item">
                                        <label className="consultant-profile-form-label">기본 급여</label>
                                        <div className="consultant-profile-form-readonly">
                                            {salaryFormData.baseSalary ? 
                                                `${new Intl.NumberFormat('ko-KR').format(salaryFormData.baseSalary)}원` : 
                                                '등급을 선택하세요'
                                            }
                                        </div>
                                    </div>
                                    <div className="consultant-profile-form-item">
                                        <label className="consultant-profile-form-label">사업자 등록 여부</label>
                                        <select
                                            value={salaryFormData.isBusinessRegistered ? 'true' : 'false'}
                                            onChange={(e) => setSalaryFormData({...salaryFormData, isBusinessRegistered: e.target.value === 'true'})}
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
                                                    onChange={(e) => setSalaryFormData({...salaryFormData, businessRegistrationNumber: e.target.value})}
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
                                                    onChange={(e) => setSalaryFormData({...salaryFormData, businessName: e.target.value})}
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
                                            onChange={(e) => setSalaryFormData({...salaryFormData, contractTerms: e.target.value})}
                                            placeholder="계약 조건을 입력하세요"
                                            className="consultant-profile-form-textarea"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                                <div className="salary-profile-form__actions consultant-profile-form-actions">
                                    <button
                                        type="button"
                                        className="mg-v2-button mg-v2-button--outline"
                                        onClick={() => setShowSalaryForm(false)}
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        className="mg-v2-button mg-v2-button--primary"
                                        disabled={loading}
                                    >
                                        {loading ? '저장 중...' : '저장'}
                                    </button>
                                </div>
                            </form>
                        )}
                </div>
            </div>

            <div className="consultant-profile-modal-footer">
                <button
                    type="button"
                    className="mg-v2-button mg-v2-button--outline"
                    onClick={onClose}
                >
                    닫기
                </button>
            </div>
        </ErpModal>
    );
};

export default ConsultantProfileModal;
