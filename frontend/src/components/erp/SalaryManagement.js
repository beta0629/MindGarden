import React, { useState, useEffect } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import { apiGet, apiPost } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import ConsultantProfileModal from './ConsultantProfileModal';
import SalaryProfileFormModal from './SalaryProfileFormModal';
import TaxDetailsModal from '../common/TaxDetailsModal';
import SalaryExportModal from '../common/SalaryExportModal';
import SalaryPrintComponent from '../common/SalaryPrintComponent';
import { SALARY_CSS_CLASSES, SALARY_MESSAGES } from '../../constants/salaryConstants';
import './SalaryManagement.css';

const SalaryManagement = () => {
    const [consultants, setConsultants] = useState([]);
    const [salaryProfiles, setSalaryProfiles] = useState([]);
    const [salaryCalculations, setSalaryCalculations] = useState([]);
    const [taxCalculations, setTaxCalculations] = useState([]);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
    const [isTaxDetailsOpen, setIsTaxDetailsOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [selectedPayDay, setSelectedPayDay] = useState('TENTH');
    const [payDayOptions, setPayDayOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('calculations');
    const [selectedCalculation, setSelectedCalculation] = useState(null);

    // 상담사 목록 로드
    const loadConsultants = async () => {
        try {
            console.log('🔍 상담사 목록 로드 시작');
            setLoading(true);
            const response = await apiGet('/api/admin/salary/consultants');
            console.log('📊 상담사 목록 응답:', response);
            if (response && response.success) {
                console.log('✅ 상담사 목록 로드 성공:', response.data.length, '명');
                setConsultants(response.data);
            } else {
                console.error('❌ 상담사 목록 응답 실패:', response);
            }
        } catch (error) {
            console.error('❌ 상담사 목록 로드 실패:', error);
            showNotification('상담사 목록을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 급여 프로필 로드
    const loadSalaryProfiles = async () => {
        try {
            setLoading(true);
            const response = await apiGet('/api/admin/salary/profiles');
            if (response && response.success) {
                setSalaryProfiles(response.data);
            }
        } catch (error) {
            console.error('급여 프로필 로드 실패:', error);
            showNotification('급여 프로필을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 급여일 옵션 로드
    const loadPayDayOptions = async () => {
        try {
        const response = await apiGet('/api/admin/common-codes/values?groupCode=SALARY_PAY_DAY');
        if (response && Array.isArray(response)) {
            setPayDayOptions(response);
        }
        } catch (error) {
            console.error('급여일 옵션 로드 실패:', error);
        }
    };

    // 급여 계산 실행
    const executeSalaryCalculation = async () => {
        if (!selectedConsultant || !selectedPeriod) {
            showNotification('상담사와 기간을 선택해주세요.', 'warning');
            return;
        }

        try {
            setLoading(true);
            const requestData = {
                consultantId: selectedConsultant.id,
                period: selectedPeriod,
                payDayCode: selectedPayDay
            };

            const response = await apiPost('/api/admin/salary/calculate', requestData);
            if (response && response.success) {
                showNotification('급여 계산이 완료되었습니다.', 'success');
                // 계산 완료 후 내역 다시 로드
                loadSalaryCalculations(selectedConsultant.id);
            } else {
                showNotification(response?.message || '급여 계산에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('급여 계산 실행 실패:', error);
            showNotification('급여 계산 실행에 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 모달 열기
    const openModal = (consultant) => {
        setSelectedConsultant(consultant);
        setIsModalOpen(true);
    };

    // 모달 닫기
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedConsultant(null);
    };

    // 급여 프로필 생성
    const handleCreateProfile = (consultant) => {
        console.log('급여 프로필 생성:', consultant);
        setSelectedConsultant(consultant);
        setIsProfileFormOpen(true);
    };

    // 급여 프로필 저장 완료
    const handleProfileSaved = (profileData) => {
        console.log('급여 프로필 저장 완료:', profileData);
        showNotification('급여 프로필이 성공적으로 생성되었습니다.', 'success');
        loadSalaryProfiles(); // 프로필 목록 새로고침
    };

    // 급여 프로필 폼 모달 닫기
    const closeProfileForm = () => {
        setIsProfileFormOpen(false);
        setSelectedConsultant(null);
    };

    // 급여 계산 내역 로드
    const loadSalaryCalculations = async (consultantId) => {
        try {
            setLoading(true);
            const response = await apiGet(`/api/admin/salary/calculations/${consultantId}`);
            if (response && response.success) {
                setSalaryCalculations(response.data);
            }
        } catch (error) {
            console.error('급여 계산 내역 로드 실패:', error);
            showNotification('급여 계산 내역을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 세금 계산 내역 로드
    const loadTaxCalculations = async (calculationId) => {
        try {
            setLoading(true);
            const response = await apiGet(`/api/admin/salary/tax/${calculationId}`);
            if (response && response.success) {
                setTaxCalculations(response.data);
            }
        } catch (error) {
            console.error('세금 계산 내역 로드 실패:', error);
            showNotification('세금 계산 내역을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 급여 계산 실행
    const calculateSalary = async (consultantId, period, salaryType) => {
        try {
            setLoading(true);
            const requestData = {
                consultantId,
                period,
                salaryType
            };

            const endpoint = salaryType === 'FREELANCE' 
                ? '/api/admin/salary/calculate/freelance'
                : '/api/admin/salary/calculate/regular';

            const response = await apiPost(endpoint, requestData);
            if (response && response.success) {
                showNotification('급여 계산이 완료되었습니다.', 'success');
                loadSalaryCalculations(consultantId);
            }
        } catch (error) {
            console.error('급여 계산 실패:', error);
            showNotification('급여 계산에 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 세금 통계 로드
    const loadTaxStatistics = async (period) => {
        try {
            setLoading(true);
            const response = await apiGet(`/api/admin/salary/tax/statistics?period=${period}`);
            if (response && response.success) {
                setTaxCalculations(response.data);
            }
        } catch (error) {
            console.error('세금 통계 로드 실패:', error);
            showNotification('세금 통계를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConsultants();
        loadSalaryProfiles();
        loadPayDayOptions();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ko-KR');
    };

    return (
        <SimpleLayout>
            <div className="salary-management">
            <div className="salary-header">
                <h2>급여 관리</h2>
                <div className="header-actions">
                    <select 
                        value={selectedPeriod} 
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="period-select"
                    >
                        <option value="">기간 선택</option>
                        <option value="2025-01">2025년 1월</option>
                        <option value="2025-02">2025년 2월</option>
                        <option value="2025-03">2025년 3월</option>
                    </select>
                </div>
            </div>

            <div className="salary-tabs">
                <button 
                    className={`tab-button ${activeTab === 'profiles' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profiles')}
                >
                    급여 프로필
                </button>
                <button 
                    className={`tab-button ${activeTab === 'calculations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calculations')}
                >
                    급여 계산
                </button>
                <button 
                    className={`tab-button ${activeTab === 'tax' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tax')}
                >
                    세금 관리
                </button>
            </div>

            {activeTab === 'profiles' && (
                <div className="profiles-section">
                    <div className="section-header">
                        <h3>상담사 급여 프로필</h3>
                        <button className="btn-primary">새 프로필 생성</button>
                    </div>
                    
                    <div className="profiles-grid">
                        {console.log('🔍 렌더링 - 상담사 수:', consultants.length)}
                        {consultants.length === 0 ? (
                            <div className="no-data">
                                <p>상담사 데이터를 불러오는 중...</p>
                            </div>
                        ) : (
                            consultants.map(consultant => {
                                console.log('🔍 상담사 카드 렌더링:', consultant.name);
                                return (
                                    <div key={consultant.id} className="profile-card">
                                        <div className="profile-info">
                                            <h4>{consultant.name}</h4>
                                            <p>{consultant.email}</p>
                                            <p>등급: {consultant.grade}</p>
                                        </div>
                                        <div className="profile-actions">
                                            <button 
                                                className="btn-secondary"
                                                onClick={() => {
                                                    console.log('프로필 조회 클릭:', consultant.name);
                                                    openModal(consultant);
                                                }}
                                            >
                                                프로필 조회
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'calculations' && (
                <div className="calculations-section">
                    <div className="section-header">
                        <h3>급여 계산</h3>
                        <div className="calculation-controls">
                            <div className="control-group">
                                <label>상담사 선택:</label>
                                <select 
                                    value={selectedConsultant?.id || ''} 
                                    onChange={(e) => {
                                        const consultant = consultants.find(c => c.id === parseInt(e.target.value));
                                        setSelectedConsultant(consultant);
                                        if (consultant) {
                                            loadSalaryCalculations(consultant.id);
                                        }
                                    }}
                                    className="consultant-select"
                                >
                                    <option value="">상담사 선택</option>
                                    {consultants.map(consultant => (
                                        <option key={consultant.id} value={consultant.id}>
                                            {consultant.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="control-group">
                                <label>계산 기간:</label>
                                <input 
                                    type="month" 
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="period-input"
                                />
                            </div>
                            
                            <div className="control-group">
                                <label>급여 지급일:</label>
                                <select 
                                    value={selectedPayDay}
                                    onChange={(e) => setSelectedPayDay(e.target.value)}
                                    className="payday-select"
                                >
                                    {payDayOptions.map(option => (
                                        <option key={option.codeValue} value={option.codeValue}>
                                            {option.codeLabel}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <button 
                                className="btn-primary"
                                onClick={executeSalaryCalculation}
                                disabled={loading || !selectedConsultant || !selectedPeriod}
                            >
                                {loading ? '계산 중...' : '급여 계산 실행'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="calculations-history">
                        <h4>급여 계산 내역</h4>
                        <div className="calculations-list">
                        {salaryCalculations.map(calculation => (
                            <div key={calculation.id} className="calculation-card">
                                <div className="calculation-header">
                                    <h4>{calculation.calculationPeriod}</h4>
                                    <span className={`status status-${calculation.status.toLowerCase()}`}>
                                        {calculation.status}
                                    </span>
                                </div>
                                <div className="calculation-details">
                                    <div className="detail-row">
                                        <span>기본 급여:</span>
                                        <span>{formatCurrency(calculation.baseSalary)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>옵션 급여:</span>
                                        <span>{formatCurrency(calculation.optionSalary)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>총 급여 (세전):</span>
                                        <span>{formatCurrency(calculation.baseSalary + calculation.optionSalary)}</span>
                                    </div>
                                    {calculation.taxAmount && (
                                        <div className="detail-row tax-row">
                                            <span>원천징수 (3.3%):</span>
                                            <span style={{color: '#dc3545'}}>-{formatCurrency(calculation.taxAmount)}</span>
                                        </div>
                                    )}
                                    <div className="detail-row total">
                                        <span>실지급액 (세후):</span>
                                        <span style={{color: '#28a745', fontWeight: 'bold'}}>{formatCurrency(calculation.totalSalary - (calculation.taxAmount || 0))}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>상담 건수:</span>
                                        <span>{calculation.consultationCount}건</span>
                                    </div>
                                </div>
                                <div className="calculation-actions">
                                    <button 
                                        className="btn-secondary"
                                        onClick={() => {
                                            setSelectedCalculation(calculation);
                                            setIsTaxDetailsOpen(true);
                                        }}
                                    >
                                        세금 내역 보기
                                    </button>
                                    <button 
                                        className="btn-primary"
                                        onClick={() => {
                                            setSelectedCalculation(calculation);
                                            setIsExportModalOpen(true);
                                        }}
                                    >
                                        출력
                                    </button>
                                    
                                    {/* 프린트 컴포넌트 */}
                                    <SalaryPrintComponent
                                        salaryData={calculation}
                                        consultantName={consultants.find(c => c.id === calculation.consultantId)?.name || '알 수 없음'}
                                        period={calculation.calculationPeriod}
                                        includeTaxDetails={true}
                                        includeCalculationDetails={true}
                                    />
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'tax' && (
                <div className="tax-section">
                    <div className="section-header">
                        <h3>세금 관리</h3>
                        <button 
                            className="btn-primary"
                            onClick={() => loadTaxStatistics(selectedPeriod)}
                        >
                            세금 통계 조회
                        </button>
                    </div>
                    <div className="tax-statistics">
                        {taxCalculations && (
                            <div className="statistics-card">
                                <h4>세금 통계</h4>
                                <div className="statistics-grid">
                                    <div className="stat-item">
                                        <span className="stat-label">총 세금액</span>
                                        <span className="stat-value">
                                            {formatCurrency(taxCalculations.totalTaxAmount || 0)}
                                        </span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">세금 건수</span>
                                        <span className="stat-value">
                                            {taxCalculations.taxCount || 0}건
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                </div>
            )}

            {/* 상담사 프로필 모달 */}
            <ConsultantProfileModal
                isOpen={isModalOpen}
                onClose={closeModal}
                consultant={selectedConsultant}
            />

            {/* 급여 프로필 생성 폼 모달 */}
            <SalaryProfileFormModal
                isOpen={isProfileFormOpen}
                onClose={closeProfileForm}
                consultant={selectedConsultant}
                onSave={handleProfileSaved}
            />

            {/* 세금 내역 모달 */}
            <TaxDetailsModal
                isOpen={isTaxDetailsOpen}
                onClose={() => setIsTaxDetailsOpen(false)}
                calculationId={selectedCalculation?.id}
                consultantName={selectedConsultant?.name}
                period={selectedCalculation?.calculationPeriod}
            />

            {/* 급여 출력 모달 */}
            <SalaryExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                salaryData={selectedCalculation}
                consultantName={selectedConsultant?.name}
                period={selectedCalculation?.calculationPeriod}
            />
            </div>
        </SimpleLayout>
    );
};

export default SalaryManagement;
