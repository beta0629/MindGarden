/**
 * @deprecated 2026-03-16 App.js에서 `/erp/tax`는 `<Navigate to="/erp/salary?tab=tax" replace />`로만 연결됨.
 * 실제 세무 UI는 SalaryManagement(급여 화면 tax 탭) 쪽에서 제공. 본 파일은 레거시·참고용.
 */
import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentHeader, ContentArea } from '../dashboard-v2/content';
import StandardizedApi from '../../utils/standardizedApi';
import {
  SALARY_API_ENDPOINTS,
  TAX_BREAKDOWN_ORDER,
  TAX_BREAKDOWN_LABELS
} from '../../constants/salaryConstants';
import { showNotification } from '../../utils/notification';
import { Calculator, Receipt, Plus, TrendingUp, FileText, Settings } from 'lucide-react';
import './TaxManagement.css';
import './ErpCommon.css';
import { ErpSafeText, ErpSafeNumber, ERP_NUMBER_FORMAT, ErpFilterToolbar } from './common';
import MGButton from '../common/MGButton';

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
            const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.TAX_STATISTICS, {
              period
            });
            if (response != null && typeof response === 'object') {
                setTaxStatistics(response.data ?? response);
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
            const response = await StandardizedApi.get(
              `${SALARY_API_ENDPOINTS.TAX_BY_TYPE}/${taxType}`
            );
            if (response != null && typeof response === 'object') {
                setTaxCalculations(response.data ?? response ?? []);
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

            const response = await StandardizedApi.post(
              SALARY_API_ENDPOINTS.TAX_CALCULATE,
              requestData
            );
            if (response != null && (response.success === true || response.data != null)) {
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ko-KR');
    };

    const taxTypes = [
        { value: 'WITHHOLDING_TAX', label: '원천징수', colorKey: 'primary' },
        { value: 'VAT', label: '부가세', colorKey: 'success' },
        { value: 'INCOME_TAX', label: '소득세', colorKey: 'error' },
        { value: 'FOUR_INSURANCE', label: '4대보험', colorKey: 'info' },
        { value: 'LOCAL_INCOME_TAX', label: '지방소득세', colorKey: 'neutral' },
        { value: 'ADDITIONAL_TAX', label: '추가세금', colorKey: 'warning' }
    ];

    return (
        <AdminCommonLayout title="세금 관리">
            <ContentHeader
                title="세무 관리"
                subtitle="세금 계산, 신고, 납부를 체계적으로 관리할 수 있습니다"
            />
            <ContentArea className="erp-system mg-dashboard-layout" ariaLabel="세금 관리 콘텐츠">
                <ErpFilterToolbar
                    ariaLabel="세금 조회 필터"
                    primaryRow={(
                        <div className="mg-v2-filter-grid mg-v2-filter-grid--row1">
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="mg-v2-select mg-v2-erp-filter-toolbar__period-select"
                                aria-label="기간 선택"
                            >
                                <option key="tax-period-default" value="">기간 선택</option>
                                <option key="2025-01" value="2025-01">2025년 1월</option>
                                <option key="2025-02" value="2025-02">2025년 2월</option>
                                <option key="2025-03" value="2025-03">2025년 3월</option>
                            </select>
                        </div>
                    )}
                />
                {loading ? (
                    <div className="erp-initial-fetch-inline" role="status" aria-live="polite">
                        <UnifiedLoading type="inline" text="세금 데이터를 불러오는 중..." />
                    </div>
                ) : (
                    <>
                {/* 통계 카드 그리드 */}
                {taxStatistics && (
                    <div className="mg-dashboard-stats">
                        <div className="mg-dashboard-stat-card">
                            <div className="mg-dashboard-stat-icon">
                                <Calculator size={20} />
                            </div>
                            <div className="mg-dashboard-stat-content">
                                <div className="mg-dashboard-stat-value">
                                    <ErpSafeNumber value={taxStatistics.totalTaxAmount || 0} formatType={ERP_NUMBER_FORMAT.CURRENCY} />
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
                                    <ErpSafeNumber value={taxStatistics.taxCount || 0} formatType={ERP_NUMBER_FORMAT.COUNT} />
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
                                    <ErpSafeText value={taxStatistics.period || 'N/A'} />
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
                            <MGButton
                                type="button"
                                variant="outline"
                                size="medium"
                                className={`mg-tab ${activeTab === 'statistics' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('statistics')}
                                preventDoubleClick={false}
                            >
                                <TrendingUp size={18} aria-hidden />
                                세금 통계
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="outline"
                                size="medium"
                                className={`mg-tab ${activeTab === 'calculations' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('calculations')}
                                preventDoubleClick={false}
                            >
                                <Receipt size={18} aria-hidden />
                                세금 내역
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="outline"
                                size="medium"
                                className={`mg-tab ${activeTab === 'additional' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('additional')}
                                preventDoubleClick={false}
                            >
                                <Plus size={18} aria-hidden />
                                추가 세금
                            </MGButton>
                        </div>

                        {/* 탭 콘텐츠 영역 */}
                        <div className="mg-dashboard-section">

                            {/* 세금 통계 탭 */}
                            {activeTab === 'statistics' && (
                                <>
                                    <div className="mg-dashboard-section-header">
                                        <h3 className="mg-dashboard-section-title">세금 유형별 내역</h3>
                                        <MGButton
                                            variant="primary"
                                            size="medium"
                                            type="button"
                                            className="mg-v2-button mg-v2-button-primary"
                                            onClick={() => loadTaxStatistics(selectedPeriod)}
                                            disabled={!selectedPeriod}
                                        >
                                            <FileText size={16} aria-hidden />
                                            통계 조회
                                        </MGButton>
                                    </div>
                                    
                                    {taxStatistics && (taxStatistics.breakdown || taxStatistics.taxByType) && (
                                        <div className="mg-dashboard-section-content">
                                            <div className="tax-breakdown-grid">
                                                {(taxStatistics.breakdown
                                                    ? TAX_BREAKDOWN_ORDER.map((key) => ({
                                                            key,
                                                            label: TAX_BREAKDOWN_LABELS[key] ?? key,
                                                            amount: taxStatistics.breakdown[key]
                                                      })).filter(({ amount }) => amount != null && Number(amount) !== 0)
                                                    : Object.entries(taxStatistics.taxByType || {}).map(([type, amount]) => ({
                                                            key: type,
                                                            label: taxTypes.find(t => t.value === type)?.label ?? type,
                                                            amount
                                                      }))
                                                ).map(({ key, label, amount }) => (
                                                    <div key={key} className="mg-v2-card tax-breakdown-item">
                                                        <div
                                                            className="tax-type-indicator"
                                                            data-color={taxTypes.find((t) => t.value === key)?.colorKey || 'neutral'}
                                                        />
                                                        <div className="tax-type-info">
                                                            <span className="tax-type-name"><ErpSafeText value={label} /></span>
                                                            <span className="tax-type-amount">
                                                                <ErpSafeNumber value={Number(amount)} formatType={ERP_NUMBER_FORMAT.CURRENCY} />
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
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
                                                        <h4 className="tax-calculation-title"><ErpSafeText value={calculation.taxName} /></h4>
                                                        <span
                                                            className="mg-badge tax-type-badge"
                                                            data-color={taxTypes.find((t) => t.value === calculation.taxType)?.colorKey || 'neutral'}
                                                        >
                                                            <ErpSafeText
                                                                value={
                                                                    taxTypes.find((t) => t.value === calculation.taxType)?.label
                                                                    || calculation.taxType
                                                                }
                                                            />
                                                        </span>
                                                    </div>
                                                    <div className="tax-calculation-details">
                                                        <div className="mg-info-row">
                                                            <div className="mg-info-item">
                                                                <span className="mg-info-label">세율</span>
                                                                <span className="mg-info-value">
                                                                    <ErpSafeNumber
                                                                        value={Number(calculation.taxRate) * 100}
                                                                        formatType={ERP_NUMBER_FORMAT.PERCENT}
                                                                    />
                                                                </span>
                                                            </div>
                                                            <div className="mg-info-item">
                                                                <span className="mg-info-label">과세표준</span>
                                                                <span className="mg-info-value">
                                                                    <ErpSafeNumber
                                                                        value={calculation.taxableAmount}
                                                                        formatType={ERP_NUMBER_FORMAT.CURRENCY}
                                                                    />
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="mg-info-row mg-info-row-highlight">
                                                            <div className="mg-info-item">
                                                                <span className="mg-info-label">세금액</span>
                                                                <span className="mg-info-value mg-info-value--highlight">
                                                                    <ErpSafeNumber
                                                                        value={calculation.taxAmount}
                                                                        formatType={ERP_NUMBER_FORMAT.CURRENCY}
                                                                    />
                                                                </span>
                                                            </div>
                                                            <div className="mg-info-item">
                                                                <span className="mg-info-label">계산일</span>
                                                                <span className="mg-info-value">
                                                                    <ErpSafeText value={formatDate(calculation.createdAt)} />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {calculation.taxDescription && (
                                                        <div className="tax-calculation-description">
                                                            <p><ErpSafeText value={calculation.taxDescription} /></p>
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
                                                    <MGButton
                                                        variant="primary"
                                                        size="medium"
                                                        type="button"
                                                        fullWidth
                                                        className="mg-v2-button mg-v2-button-primary mg-v2-button-full"
                                                    >
                                                        <Calculator size={16} aria-hidden />
                                                        세금 계산
                                                    </MGButton>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                    </>
                )}
            </ContentArea>
        </AdminCommonLayout>
    );
};

export default TaxManagement;
