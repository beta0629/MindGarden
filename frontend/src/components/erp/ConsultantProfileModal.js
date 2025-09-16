import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import { getGradeSalaryMap, getGradeKoreanName } from '../../utils/commonCodeUtils';

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
            const response = await apiGet(`/api/admin/salary/profiles/${consultant.id}`);
            console.log('급여 프로필 조회 응답:', response);
            if (response.success && response.data) {
                // 급여 프로필에 등급 정보 추가
                const grade = response.consultant?.grade || '';
                const profileWithGrade = {
                    ...response.data,
                    grade: grade
                };
                setSalaryProfile(profileWithGrade);
                
                // 폼 데이터 초기화
                console.log('설정할 등급:', grade);
                setSalaryFormData({
                    salaryType: response.data.salaryType || 'FREELANCE',
                    contractTerms: response.data.contractTerms || '',
                    grade: grade,
                    baseSalary: response.data.baseSalary || '',
                    optionTypes: response.data.optionTypes || [],
                    isBusinessRegistered: response.data.isBusinessRegistered || false,
                    businessRegistrationNumber: response.data.businessRegistrationNumber || '',
                    businessName: response.data.businessName || ''
                });
            } else {
                setSalaryProfile(null);
                // 기본값으로 초기화
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
            const response = await apiGet('/api/admin/salary/option-types');
            console.log('옵션 유형 조회 응답:', response);
            // API가 직접 배열을 반환하므로 response 자체가 배열인지 확인
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
            const response = await apiGet('/api/admin/salary/grades');
            console.log('등급 조회 응답:', response);
            // API가 직접 배열을 반환하므로 response 자체가 배열인지 확인
            if (Array.isArray(response)) {
                setGrades(response);
                console.log('등급 목록 설정 완료:', response.length, '개');
            } else if (response && response.data) {
                setGrades(response.data);
                console.log('등급 목록 설정 완료:', response.data.length, '개');
            } else {
                console.warn('등급 데이터 형식이 예상과 다릅니다:', response);
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
            const response = await apiGet('/api/admin/salary/codes');
            console.log('급여 유형 조회 응답:', response);
            if (response && response.data && response.data.salaryTypes) {
                setSalaryTypes(response.data.salaryTypes);
            } else {
                console.warn('급여 유형 데이터를 찾을 수 없습니다:', response);
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
                    alert('사업자 등록번호를 입력해주세요.');
                    setLoading(false);
                    return;
                }
                
                if (!validateBusinessRegistrationNumber(salaryFormData.businessRegistrationNumber)) {
                    alert('사업자 등록번호 형식이 올바르지 않습니다. (예: 123-45-67890)');
                    setLoading(false);
                    return;
                }
                
                if (!salaryFormData.businessName) {
                    alert('사업자명을 입력해주세요.');
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

            const response = await apiPost('/api/admin/salary/profiles', profileData);
            
            if (response.success) {
                alert('급여 프로필이 성공적으로 저장되었습니다.');
                setShowSalaryForm(false);
                loadSalaryProfile(); // 프로필 다시 조회
            } else {
                alert('급여 프로필 저장에 실패했습니다: ' + response.message);
            }
        } catch (error) {
            console.error('급여 프로필 저장 실패:', error);
            alert('급여 프로필 저장 중 오류가 발생했습니다.');
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
        zIndex: 1000,
        padding: '20px'
    };

    const modalContentStyle = {
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
        animation: 'modalSlideIn 0.3s ease-out'
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


    const infoSectionStyle = {
        background: '#f8f9fa',
        borderRadius: '8px',
        padding: '20px',
        borderLeft: '4px solid #007bff'
    };

    const infoGridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
    };

    const infoItemStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    };

    const labelStyle = {
        fontWeight: '600',
        color: '#6c757d',
        fontSize: '14px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    };

    const spanStyle = {
        color: '#2c3e50',
        fontSize: '15px',
        padding: '8px 0',
        borderBottom: '1px solid #e9ecef'
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

    const closeButtonStyle = {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        color: '#6c757d',
        cursor: 'pointer',
        padding: '0',
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'all 0.2s ease'
    };

    const btnPrimaryStyle = {
        padding: '10px 20px',
        borderRadius: '6px',
        fontWeight: '500',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: 'none',
        minWidth: '100px',
        backgroundColor: '#007bff',
        color: 'white'
    };

    const btnSecondaryStyle = {
        padding: '10px 20px',
        borderRadius: '6px',
        fontWeight: '500',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: 'none',
        minWidth: '100px',
        backgroundColor: '#6c757d',
        color: 'white'
    };

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <div style={modalHeaderStyle}>
                    <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '20px', fontWeight: '600' }}>
                        급여 프로필 생성 - {consultant.name}
                    </h3>
                    <button style={closeButtonStyle} onClick={onClose}>
                        ×
                    </button>
                </div>
                
                <div style={modalBodyStyle}>
                    <div style={infoSectionStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ margin: 0, color: '#495057', fontSize: '16px', fontWeight: '600' }}>급여 프로필</h4>
                            {(() => {
                                console.log('수정 버튼 표시 조건 확인:');
                                console.log('- salaryProfile:', !!salaryProfile);
                                console.log('- showSalaryForm:', showSalaryForm);
                                console.log('- 수정 버튼 표시 여부:', !showSalaryForm);
                                return !showSalaryForm;
                            })() && (
                                <button 
                                    style={{
                                        ...btnPrimaryStyle,
                                        padding: '8px 16px',
                                        fontSize: '12px',
                                        minWidth: 'auto'
                                    }}
                                    onClick={() => setShowSalaryForm(true)}
                                >
                                    {salaryProfile ? '수정' : '생성'}
                                </button>
                            )}
                        </div>
                        
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>로딩 중...</div>
                        ) : salaryProfile ? (
                            <div style={infoGridStyle}>
                                <div style={infoItemStyle}>
                                    <label style={labelStyle}>급여 유형</label>
                                    <span style={spanStyle}>
                                        {salaryProfile.salaryType === 'FREELANCE' ? '프리랜서' : 
                                         salaryProfile.salaryType === 'REGULAR' ? '정규직' : salaryProfile.salaryType}
                                    </span>
                                </div>
                                <div style={infoItemStyle}>
                                    <label style={labelStyle}>상담사 등급</label>
                                    <span style={spanStyle}>
                                        {(() => {
                                            console.log('salaryProfile:', salaryProfile);
                                            console.log('salaryProfile.grade:', salaryProfile.grade);
                                            console.log('grades:', grades);
                                            const foundGrade = grades.find(g => g.codeValue === salaryProfile.grade);
                                            console.log('foundGrade:', foundGrade);
                                            return foundGrade?.codeLabel || salaryProfile.grade || '미설정';
                                        })()}
                                    </span>
                                </div>
                                <div style={infoItemStyle}>
                                    <label style={labelStyle}>기본 급여</label>
                                    <span style={spanStyle}>
                                        {salaryProfile.baseSalary ? new Intl.NumberFormat('ko-KR').format(salaryProfile.baseSalary) + '원' : '미설정'}
                                    </span>
                                </div>
                                <div style={infoItemStyle}>
                                    <label style={labelStyle}>사업자 등록</label>
                                    <span style={spanStyle}>
                                        {salaryProfile.isBusinessRegistered ? 
                                            '사업자 등록 (부가세 10% + 원천징수 3.3%)' : 
                                            '일반 프리랜서 (원천징수 3.3%만)'
                                        }
                                    </span>
                                </div>
                                <div style={infoItemStyle}>
                                    <label style={labelStyle}>옵션 유형</label>
                                    <span style={spanStyle}>
                                        상담 완료 시 자동 적용
                                    </span>
                                </div>
                                <div style={{...infoItemStyle, gridColumn: '1 / -1'}}>
                                    <label style={labelStyle}>계약 조건</label>
                                    <span style={spanStyle}>{salaryProfile.contractTerms || '정보 없음'}</span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                                급여 프로필이 없습니다. 생성 버튼을 클릭해주세요.
                            </div>
                        )}

                        {/* 급여 프로필 폼 */}
                        {showSalaryForm && (
                            <form onSubmit={handleSalaryProfileSubmit} style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '6px', borderLeft: '4px solid #2196f3' }}>
                                    <h5 style={{ margin: '0 0 10px 0', color: '#1976d2', fontSize: '14px', fontWeight: '600' }}>💡 안내사항</h5>
                                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#424242', lineHeight: '1.5' }}>
                                        <li>상담사 등급에 따라 기본 급여가 자동으로 설정됩니다</li>
                                        <li>등급이 올라갈수록 2,000원씩 증가합니다</li>
                                        <li>기본 설정값은 계약서에 따라 다를 수 있습니다</li>
                                        <li>수퍼 관리자가 직접 선택할 수 있습니다</li>
                                    </ul>
                                </div>

                                <div style={infoGridStyle}>
                                    <div style={infoItemStyle}>
                                        <label style={labelStyle}>급여 유형 *</label>
                                        <select
                                            value={salaryFormData.salaryType}
                                            onChange={(e) => setSalaryFormData({...salaryFormData, salaryType: e.target.value})}
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                            required
                                        >
                                            <option value="">급여 유형 선택</option>
                                            {salaryTypes.map((type) => (
                                                <option key={type.codeValue} value={type.codeValue}>
                                                    {type.codeLabel}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={infoItemStyle}>
                                        <label style={labelStyle}>상담사 등급 *</label>
                                        {console.log('현재 선택된 등급:', salaryFormData.grade)}
                                        <select
                                            value={salaryFormData.grade || ''}
                                            onChange={async (e) => {
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
                                                
                                                // 등급 변경 시 자동 저장
                                                if (selectedGrade && consultant.id) {
                                                    try {
                                                        await apiPut(`/api/admin/consultants/${consultant.id}/grade`, { grade: selectedGrade });
                                                        console.log('등급 자동 저장 완료:', selectedGrade);
                                                        console.log('기본급여 자동 계산:', calculatedBaseSalary);
                                                    } catch (error) {
                                                        console.error('등급 자동 저장 실패:', error);
                                                    }
                                                }
                                            }}
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                            required
                                        >
                                            <option value="">등급 선택</option>
                                            {grades.map(grade => {
                                                console.log('등급 옵션:', grade.codeValue, grade.codeLabel);
                                                return (
                                                    <option key={grade.codeValue} value={grade.codeValue}>
                                                        {grade.codeLabel}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div style={infoItemStyle}>
                                        <label style={labelStyle}>기본 급여</label>
                                        <div style={{ 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd', 
                                            fontSize: '14px',
                                            backgroundColor: '#f8f9fa',
                                            color: '#495057'
                                        }}>
                                            {salaryFormData.baseSalary ? 
                                                `${new Intl.NumberFormat('ko-KR').format(salaryFormData.baseSalary)}원` : 
                                                '등급을 선택하세요'
                                            }
                                        </div>
                                    </div>
                                    <div style={infoItemStyle}>
                                        <label style={labelStyle}>사업자 등록 여부</label>
                                        <select
                                            value={salaryFormData.isBusinessRegistered ? 'true' : 'false'}
                                            onChange={(e) => setSalaryFormData({...salaryFormData, isBusinessRegistered: e.target.value === 'true'})}
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                        >
                                            <option value="false">일반 프리랜서 (3.3% 원천징수만)</option>
                                            <option value="true">사업자 등록 (부가세 10% + 원천징수 3.3%)</option>
                                        </select>
                                        <small style={{ color: '#6c757d', fontSize: '12px' }}>
                                            사업자 등록 여부에 따라 세금 계산이 달라집니다
                                        </small>
                                    </div>
                                    
                                    {/* 사업자 등록 시 추가 필드 */}
                                    {salaryFormData.isBusinessRegistered && (
                                        <>
                                            <div style={infoItemStyle}>
                                                <label style={labelStyle}>사업자 등록번호 *</label>
                                                <input
                                                    type="text"
                                                    value={salaryFormData.businessRegistrationNumber}
                                                    onChange={(e) => setSalaryFormData({...salaryFormData, businessRegistrationNumber: e.target.value})}
                                                    placeholder="123-45-67890"
                                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                                />
                                                <small style={{ color: '#6c757d', fontSize: '12px' }}>
                                                    사업자 등록번호를 입력하세요 (예: 123-45-67890)
                                                </small>
                                            </div>
                                            <div style={infoItemStyle}>
                                                <label style={labelStyle}>사업자명 *</label>
                                                <input
                                                    type="text"
                                                    value={salaryFormData.businessName}
                                                    onChange={(e) => setSalaryFormData({...salaryFormData, businessName: e.target.value})}
                                                    placeholder="사업자명을 입력하세요"
                                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                                />
                                                <small style={{ color: '#6c757d', fontSize: '12px' }}>
                                                    사업자 등록증에 기재된 사업자명을 입력하세요
                                                </small>
                                            </div>
                                        </>
                                    )}
                                    <div style={infoItemStyle}>
                                        <label style={labelStyle}>옵션 유형</label>
                                        <div style={{ 
                                            padding: '12px', 
                                            backgroundColor: '#f8f9fa', 
                                            borderRadius: '4px', 
                                            border: '1px solid #e9ecef',
                                            fontSize: '14px',
                                            color: '#6c757d'
                                        }}>
                                            💡 옵션 유형은 상담 완료 시 자동으로 적용됩니다
                                            <br />
                                            <small style={{ fontSize: '12px' }}>
                                                • 초기상담: +5,000원<br />
                                                • 가족상담: +3,000원<br />
                                                • 기타 상담 유형에 따라 자동 계산
                                            </small>
                                        </div>
                                    </div>
                                    <div style={{...infoItemStyle, gridColumn: '1 / -1'}}>
                                        <label style={labelStyle}>계약 조건</label>
                                        <textarea
                                            value={salaryFormData.contractTerms}
                                            onChange={(e) => setSalaryFormData({...salaryFormData, contractTerms: e.target.value})}
                                            placeholder="계약 조건을 입력하세요"
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', minHeight: '60px', width: '100%' }}
                                            rows="3"
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        style={btnSecondaryStyle}
                                        onClick={() => setShowSalaryForm(false)}
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        style={btnPrimaryStyle}
                                        disabled={loading}
                                    >
                                        {loading ? '저장 중...' : '저장'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                <div style={modalFooterStyle}>
                    <button 
                        style={btnSecondaryStyle}
                        onClick={onClose}
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsultantProfileModal;
