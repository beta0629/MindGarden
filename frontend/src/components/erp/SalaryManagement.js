import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { DollarSign, Settings, FileText, Users, Calculator, Receipt } from 'lucide-react';
import SimpleLayout from '../layout/SimpleLayout';
import StatCard from '../ui/Card/StatCard';
import DashboardSection from '../layout/DashboardSection';
import MGButton from '../../components/common/MGButton'; // 임시 비활성화
import { apiGet, apiPost } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import ConsultantProfileModal from './ConsultantProfileModal';
import SalaryProfileFormModal from './SalaryProfileFormModal';
import TaxDetailsModal from '../common/TaxDetailsModal';
import SalaryExportModal from '../common/SalaryExportModal';
import SalaryPrintComponent from '../common/SalaryPrintComponent';
import SalaryConfigModal from './SalaryConfigModal';
import { SALARY_CSS_CLASSES, SALARY_MESSAGES } from '../../constants/salaryConstants';
import { getStatusLabel } from '../../utils/colorUtils';
import './SalaryManagement.css';

const SalaryManagement = () => {
    const [consultants, setConsultants] = useState([]);
    const [salaryProfiles, setSalaryProfiles] = useState([]);
    const [salaryCalculations, setSalaryCalculations] = useState([]);
    const [taxCalculations, setTaxCalculations] = useState([]);
    const [taxStatistics, setTaxStatistics] = useState(null);
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
    const [previewResult, setPreviewResult] = useState(null);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    // 상담사 목록 로드
    const loadConsultants = async () => {
        try {
            console.log('🔍 상담사 목록 로드 시작');
            setLoading(true);
            const response = await apiGet('/api/admin/salary/consultants');
            console.log('📊 상담사 목록 응답:', response);
            
            // response가 null인 경우 (401 인증 오류 등) 처리
            if (!response) {
                console.warn('⚠️ 상담사 목록 응답이 null입니다 (인증 문제 가능성)');
                setConsultants([]);
                return;
            }
            
            if (response && response.success) {
                console.log('✅ 상담사 목록 로드 성공:', response.data.length, '명');
                setConsultants(response.data || []);
            } else {
                console.error('❌ 상담사 목록 응답 실패:', response);
                setConsultants([]);
                if (response && response.message) {
                    showNotification(response.message, 'error');
                }
            }
        } catch (error) {
            console.error('❌ 상담사 목록 로드 실패:', error);
            setConsultants([]);
            showNotification('상담사 목록을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 급여 프로필 로드
    const loadSalaryProfiles = async () => {
        try {
            console.log('🔍 급여 프로필 로드 시작');
            setLoading(true);
            const response = await apiGet('/api/admin/salary/profiles');
            console.log('📊 급여 프로필 응답:', response);
            
            // response가 null인 경우 (401 인증 오류 등) 처리
            if (!response) {
                console.warn('⚠️ 급여 프로필 응답이 null입니다 (인증 문제 가능성)');
                setSalaryProfiles([]);
                return;
            }
            
            if (response && response.success) {
                console.log('✅ 급여 프로필 로드 성공:', response.data?.length || 0, '개');
                setSalaryProfiles(response.data || []);
            } else {
                console.error('❌ 급여 프로필 응답 실패:', response);
                setSalaryProfiles([]);
                if (response && response.message) {
                    showNotification(response.message, 'error');
                }
            }
        } catch (error) {
            console.error('급여 프로필 로드 실패:', error);
            setSalaryProfiles([]);
            showNotification('급여 프로필을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 급여일 옵션 로드
    const loadPayDayOptions = async () => {
        try {
        const response = await apiGet('/api/v1/common-codes/SALARY_PAY_DAY');
        if (response && Array.isArray(response)) {
            setPayDayOptions(response);
        }
        } catch (error) {
            console.error('급여일 옵션 로드 실패:', error);
        }
    };

    // 급여 계산 실행
    const executeSalaryCalculation = async () => {
        console.log('🚀 급여 계산 실행 시작');
        console.log('📊 현재 상태:', {
            selectedConsultant: selectedConsultant?.name,
            selectedConsultantId: selectedConsultant?.id,
            selectedPeriod,
            salaryProfilesCount: salaryProfiles.length,
            salaryProfiles: salaryProfiles.map(p => ({ id: p.id, consultantId: p.consultantId, consultantName: p.consultantName || 'N/A' }))
        });

        if (!selectedConsultant || !selectedPeriod) {
            console.log('⚠️ 상담사 또는 기간 미선택');
            showNotification('상담사와 기간을 선택해주세요.', 'warning');
            return;
        }

        if (salaryProfiles.length === 0) {
            console.log('⚠️ 급여 프로필 없음 - 유효성 검사 실행');
            showNotification('급여 계산을 위해서는 먼저 급여 프로필을 작성해주세요.\n급여 프로필 탭에서 "새 프로필 생성" 버튼을 클릭하세요.', 'warning');
            setActiveTab('profiles'); // 급여 프로필 탭으로 이동
            return;
        }

        // 선택된 상담사에 해당하는 급여 프로필이 있는지 확인
        const consultantProfile = salaryProfiles.find(profile => profile.consultantId === selectedConsultant.id);
        if (!consultantProfile) {
            console.log('⚠️ 선택된 상담사의 급여 프로필 없음:', { consultantId: selectedConsultant.id, consultantName: selectedConsultant.name });
            showNotification(`${selectedConsultant.name} 상담사의 급여 프로필이 없습니다.\n급여 프로필 탭에서 해당 상담사의 프로필을 먼저 작성해주세요.`, 'warning');
            setActiveTab('profiles'); // 급여 프로필 탭으로 이동
            return;
        }

        console.log('✅ 모든 유효성 검사 통과 - API 호출 시작');

        try {
            setLoading(true);
            
            // period를 LocalDate 형식으로 변환 (예: "2025-09" -> "2025-09-01", "2025-09-30")
            const [year, month] = selectedPeriod.split('-');
            const periodStart = `${year}-${month.padStart(2, '0')}-01`;
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            const periodEnd = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
            
            console.log('📅 계산된 기간:', { periodStart, periodEnd });

            // @RequestParam을 위해 URL 파라미터로 전송
            const queryParams = new URLSearchParams({
                consultantId: selectedConsultant.id,
                periodStart: periodStart,
                periodEnd: periodEnd
            });

            console.log('📤 전송할 URL 파라미터:', queryParams.toString());
            const response = await apiPost(`/api/admin/salary/calculate?${queryParams}`);
            if (response && response.success) {
                showNotification('급여 계산 미리보기가 완료되었습니다.', 'success');
                
                // 미리보기 결과를 상태에 저장하여 화면에 표시
                if (response.data) {
                    setPreviewResult({
                        consultantId: selectedConsultant.id,
                        consultantName: selectedConsultant.name,
                        period: selectedPeriod,
                        grossSalary: response.data.grossSalary || 0,
                        netSalary: response.data.netSalary || 0,
                        taxAmount: response.data.taxAmount || 0,
                        consultationCount: response.data.consultationCount || 0,
                        calculatedAt: new Date().toISOString()
                    });
                }
                
                // 기존 저장된 내역도 다시 로드
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
            
            // 기간이 선택되지 않은 경우 경고
            if (!period || period.trim() === '') {
                showNotification('세금 통계를 조회하려면 기간을 먼저 선택해주세요.', 'warning');
                setLoading(false);
                return;
            }
            
            console.log('🔍 세금 통계 로드 시작:', period);
            const response = await apiGet(`/api/admin/salary/tax/statistics?period=${period}`);
            console.log('📊 세금 통계 응답:', response);
            if (response && response.success) {
                console.log('✅ 세금 통계 데이터:', response.data);
                setTaxStatistics(response.data);
            } else {
                console.error('❌ 세금 통계 응답 실패:', response);
            }
        } catch (error) {
            console.error('❌ 세금 통계 로드 실패:', error);
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
        <SimpleLayout title="급여 관리" loading={loading && consultants.length === 0} loadingText="데이터를 불러오는 중...">
            <div className="mg-dashboard-layout">
                {/* Dashboard Header */}
                <div className="mg-dashboard-header">
                    <div className="mg-dashboard-header-content">
                        <div className="mg-dashboard-header-left">
                            <DollarSign size={32} />
                            <div>
                                <h1 className="mg-dashboard-title">급여 관리</h1>
                                <p className="mg-dashboard-subtitle">상담사 급여 프로필 및 계산 관리</p>
                            </div>
                        </div>
                        <div className="mg-dashboard-header-right">
                            <button className="mg-button"
                                variant="primary"
                                size="small"
                                onClick={() => setIsConfigModalOpen(true)}
                                title="급여 기산일 설정"
                                className="mg-dashboard-icon-btn"
                            >
                                <Settings size={18} />
                            </button>
                            <select 
                                value={selectedPeriod} 
                                onChange={(e) => {
                                    setSelectedPeriod(e.target.value);
                                    // 기간 선택 시 자동으로 세금 통계 로드
                                    if (e.target.value && activeTab === 'tax') {
                                        loadTaxStatistics(e.target.value);
                                    }
                                }}
                                className="mg-v2-select"
                            >
                                <option key="period-default" value="">기간 선택</option>
                                <option key="2025-01" value="2025-01">2025년 1월</option>
                                <option key="2025-02" value="2025-02">2025년 2월</option>
                                <option key="2025-03" value="2025-03">2025년 3월</option>
                                <option key="2025-09" value="2025-09">2025년 9월</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="mg-dashboard-content">
                    <div className="mg-v2-card">
                        {/* 탭 메뉴 */}
                        <div className="mg-tabs">
                            <button 
                                className={`mg-tab ${activeTab === 'profiles' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('profiles')}
                            >
                                <Users size={18} />
                                급여 프로필
                            </button>
                            <button 
                                className={`mg-tab ${activeTab === 'calculations' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('calculations')}
                            >
                                <Calculator size={18} />
                                급여 계산
                            </button>
                            <button 
                                className={`mg-tab ${activeTab === 'tax' ? 'mg-tab-active' : ''}`}
                                onClick={() => {
                                    setActiveTab('tax');
                                    // 세금 관리 탭으로 전환 시 기간이 선택되어 있으면 자동으로 세금 통계 로드
                                    if (selectedPeriod) {
                                        loadTaxStatistics(selectedPeriod);
                                    }
                                }}
                            >
                                <Receipt size={18} />
                                세금 관리
                            </button>
                        </div>

            {activeTab === 'profiles' && (
                <DashboardSection
                    title="상담사 급여 프로필"
                    icon={<Users size={24} />}
                    actions={
                        <button className="mg-button"
                            variant="primary"
                            size="small"
                            onClick={() => setIsProfileFormOpen(true)}
                        >
                            새 프로필 생성
                        </button>
                    }
                >
                    
                    {salaryProfiles.length === 0 && !loading && (
                        <div className="no-profiles-message">
                            <h4 className="salary-no-profiles-title">
                                📋 급여 프로필이 없습니다
                            </h4>
                            <p className="salary-no-profiles-description">
                                급여 계산을 하기 위해서는 먼저 상담사별 급여 프로필을 작성해야 합니다.<br/>
                                위의 "새 프로필 생성" 버튼을 클릭하여 급여 프로필을 작성해주세요.
                            </p>
                            <button className="mg-button"
                                variant="primary"
                                size="medium"
                                onClick={() => setIsProfileFormOpen(true)}
                                className="salary-management-create-btn"
                            >
                                지금 프로필 작성하기
                            </button>
                        </div>
                    )}
                    
                    <div className="profiles-grid">
                        {console.log('🔍 렌더링 - 상담사 수:', consultants.length)}
                        {loading ? (
                            <div className="no-data">
                                <p>데이터를 불러오는 중...</p>
                            </div>
                        ) : consultants.length === 0 ? (
                            <div className="no-data">
                                <p>상담사 데이터가 없습니다.</p>
                            </div>
                        ) : salaryProfiles.length > 0 ? (
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
                                            <button className="mg-button"
                                                variant="secondary"
                                                size="small"
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
                        ) : null}
                    </div>
                </DashboardSection>
            )}

            {activeTab === 'calculations' && (
                <DashboardSection
                    title="급여 계산"
                    icon={<Calculator size={24} />}
                    actions={
                        salaryProfiles.length === 0 && (
                            <div className="profile-warning">
                                ⚠️ 급여 프로필이 작성되지 않았습니다. 
                                <button className="mg-button"
                                    variant="outline"
                                    size="small"
                                    onClick={() => setActiveTab('profiles')}
                                >
                                    지금 작성하기
                                </button>
                            </div>
                        )
                    }
                >
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
                                    <option key="consultant-default" value="">상담사 선택</option>
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
                            
                            <div className="control-group">
                                <button className="mg-button"
                                    variant="primary"
                                    size="medium"
                                    onClick={executeSalaryCalculation}
                                    disabled={loading || !selectedConsultant || !selectedPeriod || salaryProfiles.length === 0}
                                    loading={loading}
                                    loadingText="계산 중..."
                                >
                                    급여 계산 실행
                                </button>
                            </div>
                        </div>
                    
                    <div className="calculations-history">
                        <h4>급여 계산 내역</h4>
                        
                        {/* 미리보기 결과 표시 */}
                        {previewResult && (
                            <div className="preview-result">
                                <div className="salary-preview-header">
                                    <h5 className="salary-preview-title">💰 급여 계산 미리보기</h5>
                                    <span className="salary-preview-timestamp">
                                        미리보기
                                    </span>
                                </div>
                                <div className="salary-preview-grid">
                                    <div>
                                        <strong>상담사:</strong> {previewResult.consultantName}
                                    </div>
                                    <div>
                                        <strong>기간:</strong> {previewResult.period}
                                    </div>
                                    <div>
                                        <strong>상담 건수:</strong> {previewResult.consultationCount}건
                                    </div>
                                    <div>
                                        <strong>총 급여:</strong> ₩{previewResult.grossSalary?.toLocaleString() || 0}
                                    </div>
                                    <div>
                                        <strong>세금:</strong> ₩{previewResult.taxAmount?.toLocaleString() || 0}
                                    </div>
                                    <div>
                                        <strong>실지급액:</strong> ₩{previewResult.netSalary?.toLocaleString() || 0}
                                    </div>
                                </div>
                                <div className="salary-management-preview-section">
                                    ⚠️ 실제 급여는 매월 기산일에 배치로 처리됩니다.
                                </div>
                            </div>
                        )}
                        
                        <div className="calculations-list">
                        {salaryCalculations.map(calculation => (
                            <div key={calculation.id} className="calculation-card">
                                <div className="calculation-header">
                                    <h4>{calculation.calculationPeriod}</h4>
                                    <span className={`status status-${calculation.status.toLowerCase()}`}>
                                        {getStatusLabel(calculation.status)}
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
                                            <span className="salary-management-tax-amount">-{formatCurrency(calculation.taxAmount)}</span>
                                        </div>
                                    )}
                                    <div className="detail-row total">
                                        <span>실지급액 (세후):</span>
                                        <span className="salary-management-net-salary">{formatCurrency(calculation.totalSalary - (calculation.taxAmount || 0))}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>상담 건수:</span>
                                        <span>{calculation.consultationCount}건</span>
                                    </div>
                                </div>
                                <div className="calculation-actions">
                                    <button className="mg-button"
                                        variant="secondary"
                                        size="small"
                                        onClick={() => {
                                            setSelectedCalculation(calculation);
                                            setIsTaxDetailsOpen(true);
                                        }}
                                    >
                                        세금 내역 보기
                                    </button>
                                    <button className="mg-button"
                                        variant="primary"
                                        size="small"
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
                </DashboardSection>
            )}

            {activeTab === 'tax' && (
                <DashboardSection
                    title="세금 관리"
                    icon={<Receipt size={24} />}
                    actions={
                        <button className="mg-button"
                            variant="primary"
                            size="small"
                            onClick={() => loadTaxStatistics(selectedPeriod)}
                        >
                            세금 통계 조회
                        </button>
                    }
                >
                    <div className="tax-calculations-history">
                        <h4>세금 통계 내역</h4>
                        <div className="tax-calculations-list">
                            {taxStatistics ? (
                                <div className="tax-calculation-card">
                                    <div className="calculation-header">
                                        <h4>{selectedPeriod || '2025-09'}</h4>
                                        <span className="status status-calculated">
                                            CALCULATED
                                        </span>
                                    </div>
                                    <div className="calculation-details">
                                        <div className="detail-row">
                                            <span>총 세금액:</span>
                                            <span className="salary-management-total-tax">
                                                {formatCurrency(taxStatistics.totalTaxAmount || 0)}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span>세금 건수:</span>
                                            <span>{taxStatistics.taxCount || 0}건</span>
                                        </div>
                                        {/* 원천징수세 (모든 프리랜서) */}
                                        {(taxStatistics.withholdingTax > 0 || taxStatistics.localIncomeTax > 0) && (
                                            <>
                                                <div className="detail-row">
                                                    <span>원천징수세 (3.3%):</span>
                                                    <span className="salary-management-withholding-tax">
                                                        -{formatCurrency(taxStatistics.withholdingTax || 0)}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span>지방소득세 (0.33%):</span>
                                                    <span className="salary-management-local-tax">
                                                        -{formatCurrency(taxStatistics.localIncomeTax || 0)}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                        
                                        {/* 부가가치세 (사업자 등록 시에만) */}
                                        {taxStatistics.vat > 0 && (
                                            <div className="detail-row">
                                                <span>부가가치세 (10%):</span>
                                                <span className="salary-management-vat">
                                                    -{formatCurrency(taxStatistics.vat || 0)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="detail-row">
                                            <span>국민연금 (4.5%):</span>
                                            <span className="salary-management-national-pension">
                                                -{formatCurrency(taxStatistics.nationalPension || 0)}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span>건강보험 (3.545%):</span>
                                            <span className="salary-management-health-insurance">
                                                -{formatCurrency(taxStatistics.healthInsurance || 0)}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span>장기요양보험 (0.545%):</span>
                                            <span className="salary-management-health-insurance">
                                                -{formatCurrency(taxStatistics.longTermCare || 0)}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span>고용보험 (0.9%):</span>
                                            <span className="salary-management-health-insurance">
                                                -{formatCurrency(taxStatistics.employmentInsurance || 0)}
                                            </span>
                                        </div>
                                        <div className="detail-row total">
                                            <span>총 공제액:</span>
                                            <span className="salary-management-total-deduction">
                                                -{formatCurrency(taxStatistics.totalTaxAmount || 0)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="calculation-actions">
                                        <button className="mg-button"
                                            variant="secondary"
                                            size="small"
                                            onClick={() => {
                                                // 세금 상세 내역 모달 열기
                                                console.log('세금 상세 내역 보기');
                                            }}
                                        >
                                            세금 상세 내역 보기
                                        </button>
                                        <button className="mg-button"
                                            variant="primary"
                                            size="small"
                                            onClick={() => {
                                                // 세금 통계 출력
                                                console.log('세금 통계 출력');
                                            }}
                                        >
                                            출력
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-data">
                                    <p>세금 통계를 조회하려면 "세금 통계 조회" 버튼을 클릭하세요.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DashboardSection>
            )}

            {loading && (
                <div className="salary-management-loading-overlay">
                    <UnifiedLoading type="inline" text="로딩 중..." />
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

            {/* 급여 기산일 설정 모달 */}
            <SalaryConfigModal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                onSave={() => {
                    showNotification('급여 기산일 설정이 저장되었습니다.', 'success');
                    // 설정 저장 후 필요한 경우 데이터 새로고침
                }}
            />
                    </div>
                </div>
            </div>
        </SimpleLayout>
    );
};

export default SalaryManagement;
