import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';

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

    // 등급을 한글로 변환
    const convertGradeToKorean = (grade) => {
        const gradeMap = {
            'CONSULTANT_JUNIOR': '주니어 상담사',
            'CONSULTANT_SENIOR': '시니어 상담사',
            'CONSULTANT_EXPERT': '엑스퍼트 상담사',
            'CONSULTANT_MASTER': '마스터 상담사'
        };
        return gradeMap[grade] || grade;
    };

    // 등급별 기본 급여 설정
    const getGradeBaseSalary = (grade) => {
        const gradeSalaryMap = {
            'CONSULTANT_JUNIOR': 30000,
            'CONSULTANT_SENIOR': 35000,
            'CONSULTANT_EXPERT': 40000,
            'CONSULTANT_MASTER': 45000
        };
        return gradeSalaryMap[grade] || 30000;
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
            const response = await apiGet('/api/admin/common-codes/values?groupCode=CONSULTANT_GRADE');
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
            initializeFormData();
        }
    }, [isOpen, consultant]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            console.log('🔍 급여 프로필 폼 초기 데이터 로드 시작');
            
            // 급여 유형 로드
            const salaryTypeResponse = await apiGet('/api/admin/common-codes/values?groupCode=SALARY_TYPE');
            console.log('📊 급여 유형 응답:', salaryTypeResponse);
            if (Array.isArray(salaryTypeResponse)) {
                setSalaryTypes(salaryTypeResponse);
            }

            // 옵션 유형 로드
            const optionTypeResponse = await apiGet('/api/admin/common-codes/values?groupCode=SALARY_OPTION_TYPE');
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

    const initializeFormData = () => {
        if (!consultant) return;

        const baseSalary = getGradeBaseSalary(consultant.grade);
        const gradeOptions = getGradeOptions(consultant.grade);

        setFormData({
            consultantId: consultant.id,
            salaryType: 'FREELANCE',
            baseSalary: baseSalary,
            contractTerms: '',
            isActive: true,
            grade: consultant.grade
        });

        setSelectedOptions(gradeOptions);
    };

    // 등급 변경 시 기본 급여와 옵션 업데이트
    const handleGradeChange = async (newGrade) => {
        const baseSalary = getGradeBaseSalary(newGrade);
        const gradeOptions = getGradeOptions(newGrade);
        
        setFormData(prev => ({
            ...prev,
            grade: newGrade,
            baseSalary: baseSalary
        }));
        
        setSelectedOptions(gradeOptions);
        
        // 상담사 등급 업데이트
        try {
            const response = await apiPut(`/api/admin/consultants/${consultant.id}/grade`, {
                grade: newGrade
            });
            
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

            const response = await apiPost('/api/admin/salary/profiles', profileData);
            
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

    const modalOverlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001,
        padding: '20px'
    };

    const modalContentStyle = {
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '95vh',
        overflowY: 'auto'
    };

    const modalHeaderStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '1px solid #e9ecef',
        background: '#f8f9fa',
        borderRadius: '12px 12px 0 0'
    };

    const modalBodyStyle = {
        padding: '24px'
    };

    const modalFooterStyle = {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '20px 24px',
        borderTop: '1px solid #e9ecef',
        background: '#f8f9fa',
        borderRadius: '0 0 12px 12px'
    };

    const formGroupStyle = {
        marginBottom: '20px'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '600',
        color: '#495057',
        fontSize: '14px'
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #ced4da',
        borderRadius: '6px',
        fontSize: '14px',
        boxSizing: 'border-box'
    };

    const selectStyle = {
        ...inputStyle,
        backgroundColor: 'white'
    };

    const buttonStyle = {
        padding: '10px 20px',
        borderRadius: '6px',
        fontWeight: '500',
        fontSize: '14px',
        cursor: 'pointer',
        border: 'none',
        minWidth: '100px'
    };

    const primaryButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#007bff',
        color: 'white'
    };

    const secondaryButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#6c757d',
        color: 'white'
    };

    const addButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#28a745',
        color: 'white',
        marginBottom: '16px'
    };

    const removeButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#dc3545',
        color: 'white',
        padding: '5px 10px',
        fontSize: '12px'
    };

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <div style={modalHeaderStyle}>
                    <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '20px', fontWeight: '600' }}>
                        급여 프로필 생성 - {consultant.name}
                    </h3>
                    <button 
                        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>
                
                <div style={modalBodyStyle}>
                    {/* 기본 정보 */}
                    <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>상담사 정보</h4>
                        <p style={{ margin: '4px 0', color: '#6c757d' }}><strong>이름:</strong> {consultant.name}</p>
                        <p style={{ margin: '4px 0', color: '#6c757d' }}><strong>현재 등급:</strong> {convertGradeToKorean(consultant.grade)}</p>
                        <p style={{ margin: '4px 0', color: '#6c757d' }}><strong>기본 급여:</strong> {getGradeBaseSalary(formData.grade || consultant.grade).toLocaleString()}원</p>
                    </div>

                    {/* 상담사 등급 선택 */}
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>상담사 등급</label>
                        <select 
                            style={selectStyle}
                            value={formData.grade}
                            onChange={(e) => handleGradeChange(e.target.value)}
                        >
                            <option value="">상담사 등급 선택</option>
                            {gradeTableData.map(grade => (
                                <option key={grade.code} value={grade.code}>
                                    {grade.name} ({grade.baseSalary.toLocaleString()}원)
                                </option>
                            ))}
                        </select>
                        <p style={{ fontSize: '12px', color: '#6c757d', margin: '4px 0 0 0' }}>
                            등급을 변경하면 기본 급여와 옵션 금액이 자동으로 업데이트됩니다.
                        </p>
                    </div>

                    {/* 등급표 */}
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>상담사 등급표</label>
                        <div style={{ 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '8px', 
                            padding: '16px',
                            border: '1px solid #e9ecef'
                        }}>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '140px 100px 100px 100px 100px', 
                                gap: '8px',
                                marginBottom: '12px',
                                fontWeight: '600',
                                fontSize: '14px',
                                color: '#495057',
                                borderBottom: '2px solid #dee2e6',
                                paddingBottom: '8px'
                            }}>
                                <div>등급</div>
                                <div style={{ textAlign: 'right' }}>기본급여</div>
                                <div style={{ textAlign: 'right' }}>가족상담</div>
                                <div style={{ textAlign: 'right' }}>초기상담</div>
                                <div style={{ textAlign: 'right' }}>추가금액</div>
                            </div>
                            
                            {gradeTableData.map((grade, index) => (
                                <div key={grade.code} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '140px 100px 100px 100px 100px',
                                    gap: '8px',
                                    padding: '8px 0',
                                    borderBottom: index < 3 ? '1px solid #e9ecef' : 'none',
                                    fontSize: '13px',
                                    color: '#6c757d',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ 
                                        fontWeight: '500', 
                                        color: '#495057',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        {grade.name}
                                        {grade.code === formData.grade && (
                                            <span style={{ 
                                                fontSize: '10px', 
                                                backgroundColor: '#007bff', 
                                                color: 'white', 
                                                padding: '2px 6px', 
                                                borderRadius: '10px' 
                                            }}>
                                                선택됨
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {grade.baseSalary.toLocaleString()}원
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {grade.options && grade.options[0] ? grade.options[0].amount.toLocaleString() : '0'}원
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {grade.options && grade.options[1] ? grade.options[1].amount.toLocaleString() : '0'}원
                                    </div>
                                    <div style={{ 
                                        color: grade.multiplier > 1 ? '#28a745' : '#6c757d',
                                        fontWeight: grade.multiplier > 1 ? '500' : 'normal',
                                        textAlign: 'right'
                                    }}>
                                        {grade.multiplier > 1 ? `+${((grade.multiplier - 1) * 2000).toLocaleString()}원` : '-'}
                                    </div>
                                </div>
                            ))}
                            
                            <div style={{ 
                                marginTop: '12px', 
                                padding: '8px', 
                                backgroundColor: '#e3f2fd', 
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: '#1976d2'
                            }}>
                                <strong>💡 등급별 급여 체계:</strong><br/>
                                • 기본 급여: 등급별 차등 지급<br/>
                                • 옵션 금액: 등급이 올라갈수록 2,000원씩 추가<br/>
                                • 주니어: 기본 옵션 금액<br/>
                                • 시니어 이상: 기본 + (등급-1) × 2,000원
                            </div>
                        </div>
                    </div>

                    {/* 급여 유형 */}
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>급여 유형</label>
                        <select 
                            style={selectStyle}
                            value={formData.salaryType}
                            onChange={(e) => handleInputChange('salaryType', e.target.value)}
                        >
                            <option value="">급여 유형 선택</option>
                            {salaryTypes.map(type => (
                                <option key={type.codeValue} value={type.codeValue}>
                                    {type.codeLabel || type.codeValue}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 기본 급여 */}
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>기본 급여 (원)</label>
                        <input
                            type="number"
                            style={inputStyle}
                            value={formData.baseSalary}
                            onChange={(e) => handleInputChange('baseSalary', parseInt(e.target.value) || 0)}
                            placeholder="기본 급여를 입력하세요"
                        />
                    </div>

                    {/* 사업자 등록 여부 (프리랜서만) */}
                    {formData.salaryType === 'FREELANCE' && (
                        <div style={formGroupStyle}>
                            <label style={labelStyle}>사업자 등록 여부</label>
                            <select 
                                style={selectStyle}
                                value={formData.isBusinessRegistered ? 'true' : 'false'}
                                onChange={(e) => handleInputChange('isBusinessRegistered', e.target.value === 'true')}
                            >
                                <option value="false">일반 프리랜서 (3.3% 원천징수만)</option>
                                <option value="true">사업자 등록 프리랜서 (3.3% 원천징수 + 10% 부가세)</option>
                            </select>
                            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                                • 일반 프리랜서: 원천징수 3.3%만 적용<br/>
                                • 사업자 등록: 원천징수 3.3% + 부가세 10% 적용
                            </div>
                        </div>
                    )}

                    {/* 사업자 등록 시 추가 필드 */}
                    {formData.salaryType === 'FREELANCE' && formData.isBusinessRegistered && (
                        <>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>사업자 등록번호 *</label>
                                <input
                                    type="text"
                                    style={inputStyle}
                                    value={formData.businessRegistrationNumber}
                                    onChange={(e) => handleInputChange('businessRegistrationNumber', e.target.value)}
                                    placeholder="123-45-67890"
                                />
                                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                                    사업자 등록번호를 입력하세요 (예: 123-45-67890)
                                </div>
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>사업자명 *</label>
                                <input
                                    type="text"
                                    style={inputStyle}
                                    value={formData.businessName}
                                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                                    placeholder="사업자명을 입력하세요"
                                />
                                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                                    사업자 등록증에 기재된 사업자명을 입력하세요
                                </div>
                            </div>
                        </>
                    )}

                    {/* 계약 조건 */}
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>계약 조건</label>
                        <textarea
                            style={{...inputStyle, height: '80px', resize: 'vertical'}}
                            value={formData.contractTerms}
                            onChange={(e) => handleInputChange('contractTerms', e.target.value)}
                            placeholder="계약 조건을 입력하세요"
                        />
                    </div>

                    {/* 급여 옵션 */}
                    <div style={formGroupStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={labelStyle}>급여 옵션 (등급별 자동 추가됨)</label>
                            <button style={addButtonStyle} onClick={addOption}>
                                + 옵션 추가
                            </button>
                        </div>
                        <p style={{ fontSize: '12px', color: '#6c757d', margin: '0 0 16px 0' }}>
                            {getGradeOptionsDescription(formData.grade || consultant.grade)}
                        </p>
                        
                        {selectedOptions.map((option, index) => (
                            <div key={index} style={{ 
                                display: 'flex', 
                                gap: '12px', 
                                alignItems: 'center', 
                                marginBottom: '12px',
                                padding: '12px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '6px'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <select
                                        style={selectStyle}
                                        value={option.type}
                                        onChange={(e) => handleOptionChange(index, 'type', e.target.value)}
                                    >
                                        <option value="">옵션 유형 선택</option>
                                        {optionTypes.map(opt => (
                                            <option key={opt.codeValue} value={opt.codeValue}>
                                                {opt.codeLabel || opt.codeValue}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input
                                        type="number"
                                        style={inputStyle}
                                        value={option.amount}
                                        onChange={(e) => handleOptionChange(index, 'amount', parseInt(e.target.value) || 0)}
                                        placeholder="금액"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input
                                        type="text"
                                        style={inputStyle}
                                        value={option.name}
                                        onChange={(e) => handleOptionChange(index, 'name', e.target.value)}
                                        placeholder="옵션명"
                                    />
                                </div>
                                <button 
                                    style={removeButtonStyle}
                                    onClick={() => removeOption(index)}
                                >
                                    삭제
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={modalFooterStyle}>
                    <button 
                        style={secondaryButtonStyle}
                        onClick={onClose}
                        disabled={loading}
                    >
                        취소
                    </button>
                    <button 
                        style={primaryButtonStyle}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalaryProfileFormModal;
