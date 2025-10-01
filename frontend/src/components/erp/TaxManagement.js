import React, { useState, useEffect } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import { apiGet, apiPost } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
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
            <div className="tax-management">
            <div className="tax-header">
                <h2>세금 관리</h2>
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

            <div className="tax-tabs">
                <button 
                    className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('statistics')}
                >
                    세금 통계
                </button>
                <button 
                    className={`tab-button ${activeTab === 'calculations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calculations')}
                >
                    세금 내역
                </button>
                <button 
                    className={`tab-button ${activeTab === 'additional' ? 'active' : ''}`}
                    onClick={() => setActiveTab('additional')}
                >
                    추가 세금
                </button>
            </div>

            {activeTab === 'statistics' && (
                <div className="statistics-section">
                    <div className="section-header">
                        <h3>세금 통계</h3>
                        <button 
                            className="btn-primary"
                            onClick={() => loadTaxStatistics(selectedPeriod)}
                            disabled={!selectedPeriod}
                        >
                            통계 조회
                        </button>
                    </div>
                    
                    {taxStatistics && (
                        <div className="statistics-grid">
                            <div className="stat-card">
                                <h4>총 세금액</h4>
                                <div className="stat-value">
                                    {formatCurrency(taxStatistics.totalTaxAmount || 0)}
                                </div>
                            </div>
                            <div className="stat-card">
                                <h4>세금 건수</h4>
                                <div className="stat-value">
                                    {taxStatistics.taxCount || 0}건
                                </div>
                            </div>
                            <div className="stat-card">
                                <h4>기간</h4>
                                <div className="stat-value">
                                    {taxStatistics.period || 'N/A'}
                                </div>
                            </div>
                        </div>
                    )}

                    {taxStatistics && taxStatistics.taxByType && (
                        <div className="tax-type-breakdown">
                            <h4>세금 유형별 내역</h4>
                            <div className="breakdown-grid">
                                {Object.entries(taxStatistics.taxByType).map(([type, amount]) => {
                                    const taxTypeInfo = taxTypes.find(t => t.value === type);
                                    return (
                                        <div key={type} className="breakdown-item">
                                            <div 
                                                className="type-color" 
                                                data-color={taxTypeInfo?.color || '#6c757d'}
                                            ></div>
                                            <div className="type-info">
                                                <span className="type-name">
                                                    {taxTypeInfo?.label || type}
                                                </span>
                                                <span className="type-amount">
                                                    {formatCurrency(amount)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'calculations' && (
                <div className="calculations-section">
                    <div className="section-header">
                        <h3>세금 내역</h3>
                        <div className="calculation-controls">
                            <select 
                                value={selectedTaxType} 
                                onChange={(e) => {
                                    setSelectedTaxType(e.target.value);
                                    if (e.target.value) {
                                        loadTaxCalculationsByType(e.target.value);
                                    }
                                }}
                                className="tax-type-select"
                            >
                                <option value="">세금 유형 선택</option>
                                {taxTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="calculations-list">
                        {taxCalculations.map(calculation => (
                            <div key={calculation.id} className="calculation-card">
                                <div className="calculation-header">
                                    <h4>{calculation.taxName}</h4>
                                    <span 
                                        className="tax-type-badge" 
                                        data-badge-bg={taxTypes.find(t => t.value === calculation.taxType)?.color || '#6c757d'}
                                    >
                                        {calculation.taxType}
                                    </span>
                                </div>
                                <div className="calculation-details">
                                    <div className="detail-row">
                                        <span>세율:</span>
                                        <span>{(calculation.taxRate * 100).toFixed(2)}%</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>과세표준:</span>
                                        <span>{formatCurrency(calculation.taxableAmount)}</span>
                                    </div>
                                    <div className="detail-row total">
                                        <span>세금액:</span>
                                        <span>{formatCurrency(calculation.taxAmount)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>계산일:</span>
                                        <span>{formatDate(calculation.createdAt)}</span>
                                    </div>
                                </div>
                                {calculation.taxDescription && (
                                    <div className="calculation-description">
                                        <p>{calculation.taxDescription}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'additional' && (
                <div className="additional-section">
                    <div className="section-header">
                        <h3>추가 세금 계산</h3>
                    </div>
                    
                    <div className="additional-form">
                        <div className="form-group">
                            <label>급여 계산 ID</label>
                            <input 
                                type="number" 
                                className="form-input"
                                placeholder="급여 계산 ID를 입력하세요"
                            />
                        </div>
                        <div className="form-group">
                            <label>총 급여액</label>
                            <input 
                                type="number" 
                                className="form-input"
                                placeholder="총 급여액을 입력하세요"
                            />
                        </div>
                        <div className="form-group">
                            <label>세금 유형</label>
                            <select className="form-select">
                                <option value="">세금 유형 선택</option>
                                {taxTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>세율 (%)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="form-input"
                                placeholder="세율을 입력하세요 (예: 3.3)"
                            />
                        </div>
                        <button className="btn-primary">
                            세금 계산
                        </button>
                    </div>
                </div>
            )}

            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                </div>
            )}
            </div>
        </SimpleLayout>
    );
};

export default TaxManagement;
