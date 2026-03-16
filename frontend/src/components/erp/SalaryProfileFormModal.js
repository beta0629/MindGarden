import React, { useState, useEffect } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import StandardizedApi from '../../utils/standardizedApi';
import { SALARY_API_ENDPOINTS, getConsultantGradeUpdateUrl } from '../../constants/salaryConstants';
import { showNotification } from '../../utils/notification';
import { getGradeSalaryMap, getGradeKoreanName } from '../../utils/commonCodeUtils';
import ErpModal from './common/ErpModal';
import BadgeSelect from '../common/BadgeSelect';
import './SalaryProfileFormModal.css';

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
        grade: '', // 상담사 등급
        isBusinessRegistered: false, // 사업자 등록 여부
        businessRegistrationNumber: '', // 사업자 등록번호
        businessName: '' // 사업자명
    });
    
    const [salaryTypes, setSalaryTypes] = useState([]);
    const [optionTypes, setOptionTypes] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [gradeTableData, setGradeTableData] = useState([]);
    /** 등급 한글명(표시용). async 결과만 넣어 React #31 방지 */
    const [gradeLabel, setGradeLabel] = useState('');
    /** 기본 급여 표시용. async 결과만 넣어 React #31 방지 */
    const [displayBaseSalary, setDisplayBaseSalary] = useState(null);

    // 등급을 한글로 변환 (공통 코드에서 동적 조회)
    const convertGradeToKorean = async (grade) => {
        try {
            return await getGradeKoreanName(grade);
        } catch (error) {
            console.error('등급 한글명 조회 실패:', error);
            // 기본값 반환
            const defaultMap = {
                'CONSULTANT_JUNIOR': '주니어 상담사',
                'CONSULTANT_SENIOR': '시니어 상담사',
                'CONSULTANT_EXPERT': '엑스퍼트 상담사',
                'CONSULTANT_MASTER': '마스터 상담사'
            };
            return defaultMap[grade] || grade;
        }
    };

    // 등급별 기본 급여 설정 (공통 코드에서 동적 조회)
    const getGradeBaseSalary = async (grade) => {
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
            { type: 'FAMILY_CONSULTATION', amount: 3000, name: '가족상담' },
            { type: 'INITIAL_CONSULTATION', amount: 5000, name: '초기상담' }
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
            return `등급별 추가 금액: +${additionalAmount.toLocaleString()}원 (기본 + ${additionalAmount}원)`;
        }
        return '기본 옵션 금액';
    };

    // 공통 코드에서 등급 정보 로드
    const loadGradeTableData = async () => {
        try {
            const response = await StandardizedApi.get('/api/v1/common-codes', {
              codeGroup: 'CONSULTANT_GRADE'
            });
            if (Array.isArray(response)) {
                const baseOptions = [
                    { type: 'FAMILY_CONSULTATION', name: '가족상담', baseAmount: 3000 },
                    { type: 'INITIAL_CONSULTATION', name: '초기상담', baseAmount: 5000 }
                ];

                const gradeData = response.map(grade => {
                    const extraData = JSON.parse(grade.extraData || '{}');
                    const level = extraData.level || 1;
                    const multiplier = extraData.multiplier || 1.0;
                    
                    const options = baseOptions.map(option => ({
                        ...option,
                        amount: Math.round(option.baseAmount * multiplier)
                    }));

                    return {
                        code: grade.codeValue,
                        name: grade.codeLabel,
                        baseSalary: 30000 + (level - 1) * 5000, // 프리랜서 기본 상담료
                        multiplier: level,
                        options: options,
                        level: level,
                        multiplier: multiplier
                    };
                });
                setGradeTableData(gradeData);
            }
        } catch (error) {
            console.error('등급 정보 로드 실패:', error);
            // 폴백 데이터
            const fallbackData = [
                { code: 'CONSULTANT_JUNIOR', name: '주니어', baseSalary: 30000, multiplier: 1, level: 1, options: [{ type: 'FAMILY_CONSULTATION', name: '가족상담', amount: 3000 }, { type: 'INITIAL_CONSULTATION', name: '초기상담', amount: 5000 }] },
                { code: 'CONSULTANT_SENIOR', name: '시니어', baseSalary: 35000, multiplier: 2, level: 2, options: [{ type: 'FAMILY_CONSULTATION', name: '가족상담', amount: 3600 }, { type: 'INITIAL_CONSULTATION', name: '초기상담', amount: 6000 }] },
                { code: 'CONSULTANT_EXPERT', name: '엑스퍼트', baseSalary: 40000, multiplier: 3, level: 3, options: [{ type: 'FAMILY_CONSULTATION', name: '가족상담', amount: 4200 }, { type: 'INITIAL_CONSULTATION', name: '초기상담', amount: 7000 }] },
                { code: 'CONSULTANT_MASTER', name: '마스터', baseSalary: 45000, multiplier: 4, level: 4, options: [{ type: 'FAMILY_CONSULTATION', name: '가족상담', amount: 4800 }, { type: 'INITIAL_CONSULTATION', name: '초기상담', amount: 8000 }] }
            ];
            setGradeTableData(fallbackData);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        if (isOpen && consultant) {
            loadInitialData();
            loadGradeTableData();
            (async () => { await initializeFormData(); })();
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
        (async () => {
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

    const loadInitialData = async () => {
        try {
            setLoading(true);
            console.log('🔍 급여 프로필 폼 초기 데이터 로드 시작');
            
            // 급여 유형 로드
            const salaryTypeResponse = await StandardizedApi.get('/api/v1/common-codes', {
              codeGroup: 'SALARY_TYPE'
            });
            console.log('📊 급여 유형 응답:', salaryTypeResponse);
            if (Array.isArray(salaryTypeResponse)) {
                setSalaryTypes(salaryTypeResponse);
            }

            // 옵션 유형 로드
            const optionTypeResponse = await StandardizedApi.get('/api/v1/common-codes', {
              codeGroup: 'SALARY_OPTION_TYPE'
            });
            console.log('📊 옵션 유형 응답:', optionTypeResponse);
            if (Array.isArray(optionTypeResponse)) {
                setOptionTypes(optionTypeResponse);
            } else {
                // 하드코딩된 옵션 유형 추가 (임시)
                const hardcodedOptions = [
                    { codeValue: 'FAMILY_CONSULTATION', codeName: '가족상담', codeDescription: '가족상담 시 추가 급여' },
                    { codeValue: 'INITIAL_CONSULTATION', codeName: '초기상담', codeDescription: '초기상담 시 추가 급여' },
                    { codeValue: 'WEEKEND_CONSULTATION', codeName: '주말상담', codeDescription: '주말상담 시 추가 급여' },
                    { codeValue: 'ONLINE_CONSULTATION', codeName: '온라인상담', codeDescription: '온라인상담 시 추가 급여' },
                    { codeValue: 'PHONE_CONSULTATION', codeName: '전화상담', codeDescription: '전화상담 시 추가 급여' },
                    { codeValue: 'TRAUMA_CONSULTATION', codeName: '트라우마상담', codeDescription: '트라우마상담 시 추가 급여' }
                ];
                setOptionTypes(hardcodedOptions);
                console.log('📊 하드코딩된 옵션 유형 설정:', hardcodedOptions);
            }
        } catch (error) {
            console.error('초기 데이터 로드 실패:', error);
            showNotification('데이터를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const initializeFormData = async () => {
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
    const handleGradeChange = async (newGrade) => {
        const baseSalary = await getGradeBaseSalary(newGrade);
        const gradeOptions = getGradeOptions(newGrade);

        setFormData(prev => ({
            ...prev,
            grade: newGrade,
            baseSalary: typeof baseSalary === 'number' ? baseSalary : 0
        }));

        setSelectedOptions(gradeOptions);
        
        // 상담사 등급 업데이트
        try {
            const response = await StandardizedApi.put(
              getConsultantGradeUpdateUrl(consultant.id),
              { grade: newGrade }
            );

            if (response && response.success) {
                showNotification('상담사 등급이 업데이트되었습니다.', 'success');
                // 상담사 정보도 업데이트
                consultant.grade = newGrade;
            } else {
                showNotification('등급 업데이트에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('등급 업데이트 실패:', error);
            showNotification('등급 업데이트에 실패했습니다.', 'error');
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

    const handleSave = async () => {
        try {
            setLoading(true);

            // 사업자 등록 시 필수 필드 검사
            if (formData.isBusinessRegistered) {
                if (!formData.businessRegistrationNumber) {
                    showNotification('사업자 등록번호를 입력해주세요.', 'error');
                    setLoading(false);
                    return;
                }
                
                if (!validateBusinessRegistrationNumber(formData.businessRegistrationNumber)) {
                    showNotification('사업자 등록번호 형식이 올바르지 않습니다. (예: 123-45-67890)', 'error');
                    setLoading(false);
                    return;
                }
                
                if (!formData.businessName) {
                    showNotification('사업자명을 입력해주세요.', 'error');
                    setLoading(false);
                    return;
                }
            }

            const profileData = {
                ...formData,
                options: selectedOptions.filter(opt => opt.type && opt.amount > 0)
            };

            const response = await StandardizedApi.post(SALARY_API_ENDPOINTS.PROFILES, profileData);
            
            if (response && response.success) {
                showNotification('급여 프로필이 성공적으로 생성되었습니다.', 'success');
                onSave(response.data);
                onClose();
            } else {
                showNotification(response?.message || '급여 프로필 생성에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('급여 프로필 생성 실패:', error);
            showNotification('급여 프로필 생성에 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !consultant) return null;

    return (
        <ErpModal
            isOpen={isOpen}
            onClose={onClose}
            title={`급여 프로필 생성 - ${consultant.name}`}
            size="large"
            className="salary-profile-modal-content mg-v2-ad-b0kla"
        >
            <div className="salary-profile-form">
                {/* 기본 정보 */}
                <div className="salary-profile-form__section consultant-info-section">
                        <h4 className="consultant-info-title">상담사 정보</h4>
                        <p className="consultant-info-item"><strong>이름:</strong> {consultant.name}</p>
                        <p className="consultant-info-item"><strong>현재 등급:</strong> {gradeLabel || ((formData.grade || consultant.grade) ? '조회 중...' : '')}</p>
                        <p className="consultant-info-item"><strong>기본 급여:</strong> {displayBaseSalary != null ? displayBaseSalary.toLocaleString() : '—'}원</p>
                    </div>

                    {/* 상담사 등급 선택 */}
                    <div className="salary-profile-form__section consultant-profile-form-item">
                        <label className="consultant-profile-form-label">상담사 등급</label>
                        <BadgeSelect
                            className="mg-v2-form-badge-select consultant-profile-form-select"
                            value={formData.grade}
                            onChange={(val) => handleGradeChange(val)}
                            options={[
                                { value: '', label: '상담사 등급 선택' },
                                ...gradeTableData.map(grade => ({
                                    value: grade.code,
                                    label: `${grade.name} (${grade.baseSalary.toLocaleString()}원)`
                                }))
                            ]}
                            placeholder="상담사 등급 선택"
                        />
                        <p className="consultant-profile-form-help">
                            등급을 변경하면 기본 급여와 옵션 금액이 자동으로 업데이트됩니다.
                        </p>
                    </div>

                    {/* 등급표 */}
                    <div className="salary-profile-form__section consultant-profile-form-item">
                        <label className="consultant-profile-form-label">상담사 등급표</label>
                        <div className="grade-table-container">
                            <div className="grade-table-header">
                                <div>등급</div>
                                <div className="grade-table-cell--right">기본급여</div>
                                <div className="grade-table-cell--right">가족상담</div>
                                <div className="grade-table-cell--right">초기상담</div>
                                <div className="grade-table-cell--right">추가금액</div>
                            </div>
                            
                            {gradeTableData.map((grade, index) => (
                                <div key={grade.code} className="grade-table-row">
                                    <div className="grade-table-cell grade-table-cell--name">
                                        {grade.name}
                                        {grade.code === formData.grade && (
                                            <span className="grade-selected-badge">
                                                선택됨
                                            </span>
                                        )}
                                    </div>
                                    <div className="grade-table-cell--right">
                                        {grade.baseSalary.toLocaleString()}원
                                    </div>
                                    <div className="grade-table-cell--right">
                                        {grade.options && grade.options[0] ? grade.options[0].amount.toLocaleString() : '0'}원
                                    </div>
                                    <div className="grade-table-cell--right">
                                        {grade.options && grade.options[1] ? grade.options[1].amount.toLocaleString() : '0'}원
                                    </div>
                                    <div className={`grade-table-cell--right ${grade.multiplier > 1 ? 'grade-table-cell--highlight' : ''}`}>
                                        {grade.multiplier > 1 ? `+${((grade.multiplier - 1) * 2000).toLocaleString()}원` : '-'}
                                    </div>
                                </div>
                            ))}
                            
                            <div className="grade-table-notice">
                                <strong>등급별 급여 체계:</strong><br/>
                                • 기본 급여: 등급별 차등 지급<br/>
                                • 옵션 금액: 등급이 올라갈수록 2,000원씩 추가<br/>
                                • 주니어: 기본 옵션 금액<br/>
                                • 시니어 이상: 기본 + (등급-1) × 2,000원
                            </div>
                        </div>
                    </div>

                    {/* 급여 유형 */}
                    <div className="salary-profile-form__section consultant-profile-form-item">
                        <label className="consultant-profile-form-label">급여 유형</label>
                        <BadgeSelect
                            className="mg-v2-form-badge-select consultant-profile-form-select"
                            value={formData.salaryType}
                            onChange={(val) => handleInputChange('salaryType', val)}
                            options={[
                                { value: '', label: '급여 유형 선택' },
                                ...salaryTypes.map(type => ({
                                    value: type.codeValue,
                                    label: type.codeLabel || type.codeValue
                                }))
                            ]}
                            placeholder="급여 유형 선택"
                        />
                    </div>

                    {/* 기본 급여 */}
                    <div className="salary-profile-form__section consultant-profile-form-item">
                        <label className="consultant-profile-form-label">기본 급여 (원)</label>
                        <input
                            type="number"
                            className="consultant-profile-form-input"
                            value={formData.baseSalary}
                            onChange={(e) => handleInputChange('baseSalary', parseInt(e.target.value) || 0)}
                            placeholder="기본 급여를 입력하세요"
                        />
                    </div>

                    {/* 사업자 등록 여부 (프리랜서만) */}
                    {formData.salaryType === 'FREELANCE' && (
                        <div className="salary-profile-form__section consultant-profile-form-item">
                            <label className="consultant-profile-form-label">사업자 등록 여부</label>
                            <BadgeSelect
                                className="mg-v2-form-badge-select consultant-profile-form-select"
                                value={formData.isBusinessRegistered ? 'true' : 'false'}
                                onChange={(val) => handleInputChange('isBusinessRegistered', val === 'true')}
                                options={[
                                    { value: 'false', label: '일반 프리랜서 (3.3% 원천징수만)' },
                                    { value: 'true', label: '사업자 등록 프리랜서 (3.3% 원천징수 + 10% 부가세)' }
                                ]}
                                placeholder="선택하세요"
                            />
                            <div className="tax-info-text">
                                • 일반 프리랜서: 원천징수 3.3%만 적용<br/>
                                • 사업자 등록: 원천징수 3.3% + 부가세 10% 적용
                            </div>
                        </div>
                    )}

                    {/* 사업자 등록 시 추가 필드 */}
                    {formData.salaryType === 'FREELANCE' && formData.isBusinessRegistered && (
                        <>
                            <div className="salary-profile-form__section consultant-profile-form-item">
                                <label className="consultant-profile-form-label">사업자 등록번호 *</label>
                                <input
                                    type="text"
                                    className="consultant-profile-form-input"
                                    value={formData.businessRegistrationNumber}
                                    onChange={(e) => handleInputChange('businessRegistrationNumber', e.target.value)}
                                    placeholder="123-45-67890"
                                />
                                <div className="tax-info-text">
                                    사업자 등록번호를 입력하세요 (예: 123-45-67890)
                                </div>
                            </div>
                            <div className="salary-profile-form__section consultant-profile-form-item">
                                <label className="consultant-profile-form-label">사업자명 *</label>
                                <input
                                    type="text"
                                    className="consultant-profile-form-input"
                                    value={formData.businessName}
                                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                                    placeholder="사업자명을 입력하세요"
                                />
                                <div className="tax-info-text">
                                    사업자 등록증에 기재된 사업자명을 입력하세요
                                </div>
                            </div>
                        </>
                    )}

                    {/* 계약 조건 */}
                    <div className="salary-profile-form__section consultant-profile-form-item consultant-profile-form-item--full-width">
                        <label className="consultant-profile-form-label">계약 조건</label>
                        <textarea
                            className="consultant-profile-form-textarea"
                            value={formData.contractTerms}
                            onChange={(e) => handleInputChange('contractTerms', e.target.value)}
                            placeholder="계약 조건을 입력하세요"
                            rows="3"
                        />
                    </div>

                    {/* 급여 옵션 */}
                    <div className="salary-profile-form__section consultant-profile-form-item consultant-profile-form-item--full-width">
                        <div className="option-header">
                            <label className="consultant-profile-form-label">급여 옵션 (등급별 자동 추가됨)</label>
                            <button className="mg-btn mg-btn--success option-add-btn" onClick={addOption}>
                                + 옵션 추가
                            </button>
                        </div>
                        <p className="option-description">
                            {getGradeOptionsDescription(formData.grade || consultant.grade)}
                        </p>
                        
                        {selectedOptions.map((option, index) => (
                            <div key={index} className="option-item">
                                <div className="option-item-field">
                                    <BadgeSelect
                                        className="mg-v2-form-badge-select consultant-profile-form-select"
                                        value={option.type}
                                        onChange={(val) => handleOptionChange(index, 'type', val)}
                                        options={[
                                            { value: '', label: '옵션 유형 선택' },
                                            ...optionTypes.map(opt => ({
                                                value: opt.codeValue,
                                                label: opt.codeLabel || opt.codeValue
                                            }))
                                        ]}
                                        placeholder="옵션 유형 선택"
                                    />
                                </div>
                                <div className="option-item-field">
                                    <input
                                        type="number"
                                        className="consultant-profile-form-input"
                                        value={option.amount}
                                        onChange={(e) => handleOptionChange(index, 'amount', parseInt(e.target.value) || 0)}
                                        placeholder="금액"
                                    />
                                </div>
                                <div className="option-item-field">
                                    <input
                                        type="text"
                                        className="consultant-profile-form-input"
                                        value={option.name}
                                        onChange={(e) => handleOptionChange(index, 'name', e.target.value)}
                                        placeholder="옵션명"
                                    />
                                </div>
                                <button 
                                    className="mg-btn mg-btn--danger option-remove-btn"
                                    onClick={() => removeOption(index)}
                                >
                                    삭제
                                </button>
                            </div>
                        ))}
                    </div>

                <div className="salary-profile-form__actions consultant-profile-form-actions">
                    <button
                        type="button"
                        className="mg-v2-button mg-v2-button--outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        className="mg-v2-button mg-v2-button--primary"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </ErpModal>
    );
};

export default SalaryProfileFormModal;
