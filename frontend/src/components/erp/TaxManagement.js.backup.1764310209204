import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import SimpleLayout from '../layout/SimpleLayout';
import { apiGet, apiPost } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import { Calculator, Receipt, Plus, TrendingUp, FileText, Settings } from 'lucide-react';
import './TaxManagement.css';

const TaxManagement = () => {
    const [taxCalculations, setTaxCalculations] = useState([]);
    const [taxStatistics, setTaxStatistics] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [selectedTaxType, setSelectedTaxType] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('statistics');

    // 세금 통계 로드
    const loadTaxStatistics = async (period) => {
        try {
            setLoading(true);
            const response = await apiGet(`/api/admin/salary/tax/statistics?period=${period}`);
            if (response && response.success) {
                setTaxStatistics(response.data);
            }
        } catch (error) {
            console.error('세금 통계 로드 실패:', error);
            showNotification('세금 통계를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 세금 유형별 내역 로드
    const loadTaxCalculationsByType = async (taxType) => {
        try {
            setLoading(true);
            const response = await apiGet(`/api/admin/salary/tax/type/${taxType}`);
            if (response && response.success) {
                setTaxCalculations(response.data);
            }
        } catch (error) {
            console.error('세금 내역 로드 실패:', error);
            showNotification('세금 내역을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 추가 세금 계산
    const calculateAdditionalTax = async (calculationId, grossAmount, taxType, taxRate) => {
        try {
            setLoading(true);
            const requestData = {
                calculationId,
                grossAmount,
                taxType,
                taxRate
            };

            const response = await apiPost('/api/admin/salary/tax/calculate', requestData);
            if (response && response.success) {
                showNotification('추가 세금이 계산되었습니다.', 'success');
                loadTaxStatistics(selectedPeriod);
            }
        } catch (error) {
            console.error('추가 세금 계산 실패:', error);
            showNotification('추가 세금 계산에 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedPeriod) {
            loadTaxStatistics(selectedPeriod);
        }
    }, [selectedPeriod]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ko-KR');
    };

    const taxTypes = [
        { value: 'WITHHOLDING_TAX', label: '원천징수', color: '#007bff' },
        { value: 'VAT', label: '부가세', color: '#28a745' },
        { value: 'INCOME_TAX', label: '소득세', color: '#dc3545' },
        { value: 'ADDITIONAL_TAX', label: '추가세금', color: '#ffc107' }
    ];

    return (
        <SimpleLayout>
            <div className="mg-dashboard-layout">
                {/* Dashboard Header */}
                <div className="mg-dashboard-header">
                    <div className="mg-dashboard-header-content">
                        <div className="mg-dashboard-header-left">
                            <Calculator className="mg-dashboard-icon" size={28} />
                            <div>
                                <h1 className="mg-dashboard-title">세무 관리</h1>
                                <p className="mg-dashboard-subtitle">세금 계산, 신고, 납부를 체계적으로 관리할 수 있습니다</p>
                            </div>
                        </div>
                        <div className="mg-dashboard-header-right">
                            <select 
                                value={selectedPeriod} 
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="mg-v2-select"
                            >
                                <option key="tax-period-default" value="">기간 선택</option>
                                <option key="2025-01" value="2025-01">2025년 1월</option>
                                <option key="2025-02" value="2025-02">2025년 2월</option>
                                <option key="2025-03" value="2025-03">2025년 3월</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 통계 카드 그리드 */}
                {taxStatistics && (
                    <div className="mg-dashboard-stats">
                        <div className="mg-dashboard-stat-card">
                            <div className="mg-dashboard-stat-icon">
                                <Calculator size={20} />
                            </div>
                            <div className="mg-dashboard-stat-content">
                                <div className="mg-dashboard-stat-value">
                                    {formatCurrency(taxStatistics.totalTaxAmount || 0)}
                                </div>
                                <div className="mg-dashboard-stat-label">총 세금액</div>
                            </div>
                        </div>
                        <div className="mg-dashboard-stat-card">
                            <div className="mg-dashboard-stat-icon">
                                <Receipt size={20} />
                            </div>
                            <div className="mg-dashboard-stat-content">
                                <div className="mg-dashboard-stat-value">
                                    {taxStatistics.taxCount || 0}건
                                </div>
                                <div className="mg-dashboard-stat-label">세금 건수</div>
                            </div>
                        </div>
                        <div className="mg-dashboard-stat-card">
                            <div className="mg-dashboard-stat-icon">
                                <Settings size={20} />
                            </div>
                            <div className="mg-dashboard-stat-content">
                                <div className="mg-dashboard-stat-value">
                                    {taxStatistics.period || 'N/A'}
                                </div>
                                <div className="mg-dashboard-stat-label">기간</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 콘텐츠 그리드 */}
                <div className="mg-dashboard-content">
                    {/* 메인 콘텐츠 */}
                    <div className="mg-dashboard-main">
                        {/* 탭 네비게이션 */}
                        <div className="mg-tabs">
                            <button 
                                className={`mg-tab ${activeTab === 'statistics' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('statistics')}
                            >
                                <TrendingUp size={18} />
                                세금 통계
                            </button>
                            <button 
                                className={`mg-tab ${activeTab === 'calculations' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('calculations')}
                            >
                                <Receipt size={18} />
                                세금 내역
                            </button>
                            <button 
                                className={`mg-tab ${activeTab === 'additional' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('additional')}
                            >
                                <Plus size={18} />
                                추가 세금
                            </button>
                        </div>

                        {/* 탭 콘텐츠 영역 */}
                        <div className="mg-dashboard-section">

                            {/* 세금 통계 탭 */}
                            {activeTab === 'statistics' && (
                                <>
                                    <div className="mg-dashboard-section-header">
                                        <h3 className="mg-dashboard-section-title">세금 유형별 내역</h3>
                                        <button 
                                            className="mg-v2-button mg-v2-button-primary"
                                            onClick={() => loadTaxStatistics(selectedPeriod)}
                                            disabled={!selectedPeriod}
                                        >
                                            <FileText size={16} />
                                            통계 조회
                                        </button>
                                    </div>
                                    
                                    {taxStatistics && taxStatistics.taxByType && (
                                        <div className="mg-dashboard-section-content">
                                            <div className="tax-breakdown-grid">
                                                {Object.entries(taxStatistics.taxByType).map(([type, amount]) => {
                                                    const taxTypeInfo = taxTypes.find(t => t.value === type);
                                                    return (
                                                        <div key={type} className="mg-v2-card tax-breakdown-item">
                                                            <div 
                                                                className="tax-type-indicator" 
                                                                data-color={taxTypeInfo?.color || 'default'}
                                                            ></div>
                                                            <div className="tax-type-info">
                                                                <span className="tax-type-name">
                                                                    {taxTypeInfo?.label || type}
                                                                </span>
                                                                <span className="tax-type-amount">
                                                                    {formatCurrency(amount)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* 세금 내역 탭 */}
                            {activeTab === 'calculations' && (
                                <>
                                    <div className="mg-dashboard-section-header">
                                        <h3 className="mg-dashboard-section-title">세금 내역</h3>
                                        <select 
                                            value={selectedTaxType} 
                                            onChange={(e) => {
                                                setSelectedTaxType(e.target.value);
                                                if (e.target.value) {
                                                    loadTaxCalculationsByType(e.target.value);
                                                }
                                            }}
                                            className="mg-v2-select"
                                        >
                                            <option key="tax-type-default-1" value="">세금 유형 선택</option>
                                            {taxTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="mg-dashboard-section-content">
                                        <div className="tax-calculations-grid">
                                            {taxCalculations.map(calculation => (
                                                <div key={calculation.id} className="mg-v2-card tax-calculation-card">
                                                    <div className="tax-calculation-header">
                                                        <h4 className="tax-calculation-title">{calculation.taxName}</h4>
                                                        <span 
                                                            className="mg-badge tax-type-badge" 
                                                            data-color={taxTypes.find(t => t.value === calculation.taxType)?.color || 'default'}
                                                        >
                                                            {taxTypes.find(t => t.value === calculation.taxType)?.label || calculation.taxType}
                                                        </span>
                                                    </div>
                                                    <div className="tax-calculation-details">
                                                        <div className="mg-info-row">
                                                            <div className="mg-info-item">
                                                                <span className="mg-info-label">세율</span>
                                                                <span className="mg-info-value">{(calculation.taxRate * 100).toFixed(2)}%</span>
                                                            </div>
                                                            <div className="mg-info-item">
                                                                <span className="mg-info-label">과세표준</span>
                                                                <span className="mg-info-value">{formatCurrency(calculation.taxableAmount)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mg-info-row mg-info-row-highlight">
                                                            <div className="mg-info-item">
                                                                <span className="mg-info-label">세금액</span>
                                                                <span className="mg-info-value mg-info-value--highlight">{formatCurrency(calculation.taxAmount)}</span>
                                                            </div>
                                                            <div className="mg-info-item">
                                                                <span className="mg-info-label">계산일</span>
                                                                <span className="mg-info-value">{formatDate(calculation.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {calculation.taxDescription && (
                                                        <div className="tax-calculation-description">
                                                            <p>{calculation.taxDescription}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* 추가 세금 탭 */}
                            {activeTab === 'additional' && (
                                <>
                                    <div className="mg-dashboard-section-header">
                                        <h3 className="mg-dashboard-section-title">추가 세금 계산</h3>
                                    </div>
                                    
                                    <div className="mg-dashboard-section-content">
                                        <div className="mg-v2-card tax-additional-form">
                                            <div className="mg-v2-form">
                                                <div className="mg-v2-form-group">
                                                    <label className="mg-v2-label">급여 계산 ID</label>
                                                    <input 
                                                        type="number" 
                                                        className="mg-v2-input"
                                                        placeholder="급여 계산 ID를 입력하세요"
                                                    />
                                                </div>
                                                <div className="mg-v2-form-group">
                                                    <label className="mg-v2-label">총 급여액</label>
                                                    <input 
                                                        type="number" 
                                                        className="mg-v2-input"
                                                        placeholder="총 급여액을 입력하세요"
                                                    />
                                                </div>
                                                <div className="mg-v2-form-group">
                                                    <label className="mg-v2-label">세금 유형</label>
                                                    <select className="mg-v2-select">
                                                        <option key="tax-type-default-2" value="">세금 유형 선택</option>
                                                        {taxTypes.map(type => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="mg-v2-form-group">
                                                    <label className="mg-v2-label">세율 (%)</label>
                                                    <input 
                                                        type="number" 
                                                        step="0.01"
                                                        className="mg-v2-input"
                                                        placeholder="세율을 입력하세요 (예: 3.3)"
                                                    />
                                                </div>
                                                <div className="mg-v2-form-group">
                                                    <button className="mg-v2-button mg-v2-button-primary mg-v2-button-full">
                                                        <Calculator size={16} />
                                                        세금 계산
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {loading && (
                                <div className="mg-loading-container">
                                    <div className="mg-spinner"></div>
                                    <p>데이터를 불러오는 중...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SimpleLayout>
    );
};

export default TaxManagement;
