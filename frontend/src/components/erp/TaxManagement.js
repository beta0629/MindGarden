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
  TAX_BREAKDOWN_LABELS,
  SALARY_TAX_ROW_TYPE_LABELS
} from '../../constants/salaryConstants';
import { showNotification } from '../../utils/notification';
import { Calculator, Receipt, Settings } from 'lucide-react';
import './TaxManagement.css';
import './ErpCommon.css';
import { ErpSafeText, ErpSafeNumber, ERP_NUMBER_FORMAT, ErpFilterToolbar } from './common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
import MGButton from '../common/MGButton';
import { useTranslation } from 'react-i18next';

const TaxManagement = () => {
    const { t } = useTranslation();
    const [taxCalculations, setTaxCalculations] = useState([]);
    const [taxStatistics, setTaxStatistics] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [selectedTaxType, setSelectedTaxType] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('statistics');

    // 세금 통계 로드
    const loadTaxStatistics = async(period) => {
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
    const loadTaxCalculationsByType = async(taxType) => {
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
    const calculateAdditionalTax = async(calculationId, grossAmount, taxType, taxRate) => {
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
        { value: 'WITHHOLDING_TAX', label: SALARY_TAX_ROW_TYPE_LABELS.WITHHOLDING_TAX, colorKey: 'primary' },
        { value: 'VAT', label: SALARY_TAX_ROW_TYPE_LABELS.VAT, colorKey: 'success' },
        { value: 'INCOME_TAX', label: SALARY_TAX_ROW_TYPE_LABELS.INCOME_TAX, colorKey: 'error' },
        { value: 'FOUR_INSURANCE', label: SALARY_TAX_ROW_TYPE_LABELS.FOUR_INSURANCE, colorKey: 'info' },
        { value: 'LOCAL_INCOME_TAX', label: SALARY_TAX_ROW_TYPE_LABELS.LOCAL_INCOME_TAX, colorKey: 'neutral' },
        { value: 'ADDITIONAL_TAX', label: SALARY_TAX_ROW_TYPE_LABELS.ADDITIONAL_TAX, colorKey: 'warning' }
    ];

    return (
        <AdminCommonLayout title={t('erp:TaxManagement.t_780e38c6')}>
            <ContentHeader
                title={t('erp:TaxManagement.t_7d278dea')}
                subtitle="세금 계산, 신고, 납부를 체계적으로 관리할 수 있습니다"
            />
            <ContentArea className="erp-system mg-dashboard-layout" ariaLabel="세금 관리 콘텐츠">
                <div className="mg-w-full mg-mb-md">
                <ErpFilterToolbar
                    ariaLabel="세금 조회 필터"
                    primaryRow={(
                        <div className="mg-v2-filter-grid mg-v2-filter-grid--row1">
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="mg-v2-select mg-v2-erp-filter-toolbar__period-select"
                                aria-label={t('erp:TaxManagement.t_49470825')}
                            >
                                <option key="tax-period-default" value="">{t('erp:TaxManagement.t_49470825')}</option>
                                <option key="2025-01" value="2025-01">{t('erp:TaxManagement.t_b50dddd4')}</option>
                                <option key="2025-02" value="2025-02">{t('erp:TaxManagement.t_21b2dfe8')}</option>
                                <option key="2025-03" value="2025-03">{t('erp:TaxManagement.t_89bd2e25')}</option>
                            </select>
                        </div>
                    )}
                />
                </div>
                {loading ? (
                    <div className="erp-initial-fetch-inline" role="status" aria-live="polite" aria-busy="true">
                        <UnifiedLoading type="inline" text={t('erp:TaxManagement.t_098245ce')} />
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
                                <div className="mg-dashboard-stat-label">{t('erp:TaxManagement.t_f338f53f')}</div>
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
                                <div className="mg-dashboard-stat-label">{t('erp:TaxManagement.t_b9a382d3')}</div>
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
                                <div className="mg-dashboard-stat-label">{t('erp:TaxManagement.t_2622331e')}</div>
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
                                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} mg-tab ${activeTab === 'statistics' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('statistics')}
                                preventDoubleClick={false}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            >
                                {t('erp:TaxManagement.t_5708430f')}
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="outline"
                                size="medium"
                                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} mg-tab ${activeTab === 'calculations' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('calculations')}
                                preventDoubleClick={false}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            >
                                {t('erp:TaxManagement.t_6932db18')}
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="outline"
                                size="medium"
                                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} mg-tab ${activeTab === 'additional' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('additional')}
                                preventDoubleClick={false}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            >
                                {t('erp:TaxManagement.t_e2b0a017')}
                            </MGButton>
                        </div>

                        {/* 탭 콘텐츠 영역 */}
                        <div className="mg-dashboard-section">

                            {/* 세금 통계 탭 */}
                            {activeTab === 'statistics' && (
                                <>
                                    <div className="mg-dashboard-section-header">
                                        <h3 className="mg-dashboard-section-title">{t('erp:TaxManagement.t_577e127e')}</h3>
                                        <MGButton
                                            variant="primary"
                                            size="medium"
                                            type="button"
                                            className={buildErpMgButtonClassName({ variant: 'primary', loading })}
                                            loading={loading}
                                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                            onClick={() => loadTaxStatistics(selectedPeriod)}
                                            disabled={!selectedPeriod}
                                        >
                                            {t('erp:TaxManagement.t_2f7a3772')}
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
                                        <h3 className="mg-dashboard-section-title">{t('erp:TaxManagement.t_6932db18')}</h3>
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
                                            <option key="tax-type-default-1" value="">{t('erp:TaxManagement.t_073fcb6d')}</option>
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
                                                                <span className="mg-info-label">{t('erp:TaxManagement.t_71173785')}</span>
                                                                <span className="mg-info-value">
                                                                    <ErpSafeNumber
                                                                        value={Number(calculation.taxRate) * 100}
                                                                        formatType={ERP_NUMBER_FORMAT.PERCENT}
                                                                    />
                                                                </span>
                                                            </div>
                                                            <div className="mg-info-item">
                                                                <span className="mg-info-label">{t('erp:TaxManagement.t_0e9fb38f')}</span>
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
                                                                <span className="mg-info-label">{t('erp:TaxManagement.t_0fc71915')}</span>
                                                                <span className="mg-info-value mg-info-value--highlight">
                                                                    <ErpSafeNumber
                                                                        value={calculation.taxAmount}
                                                                        formatType={ERP_NUMBER_FORMAT.CURRENCY}
                                                                    />
                                                                </span>
                                                            </div>
                                                            <div className="mg-info-item">
                                                                <span className="mg-info-label">{t('erp:TaxManagement.t_7758c8fd')}</span>
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
                                        <h3 className="mg-dashboard-section-title">{t('erp:TaxManagement.t_a2085381')}</h3>
                                    </div>
                                    
                                    <div className="mg-dashboard-section-content">
                                        <div className="mg-v2-card tax-additional-form">
                                            <div className="mg-v2-form">
                                                <div className="mg-v2-form-group">
                                                    <label className="mg-v2-label">{t('erp:TaxManagement.t_79572313')}</label>
                                                    <input 
                                                        type="number" 
                                                        className="mg-v2-input"
                                                        placeholder={t('erp:TaxManagement.t_baf8a1ed')}
                                                    />
                                                </div>
                                                <div className="mg-v2-form-group">
                                                    <label className="mg-v2-label">{t('erp:TaxManagement.t_57af763a')}</label>
                                                    <input 
                                                        type="number" 
                                                        className="mg-v2-input"
                                                        placeholder={t('erp:TaxManagement.t_7047935e')}
                                                    />
                                                </div>
                                                <div className="mg-v2-form-group">
                                                    <label className="mg-v2-label">{t('erp:TaxManagement.t_7140eb65')}</label>
                                                    <select className="mg-v2-select">
                                                        <option key="tax-type-default-2" value="">{t('erp:TaxManagement.t_073fcb6d')}</option>
                                                        {taxTypes.map(type => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="mg-v2-form-group">
                                                    <label className="mg-v2-label">{t('erp:TaxManagement.t_af5a9902')}</label>
                                                    <input 
                                                        type="number" 
                                                        step="0.01"
                                                        className="mg-v2-input"
                                                        placeholder={t('erp:TaxManagement.t_013a1071')}
                                                    />
                                                </div>
                                                <div className="mg-v2-form-group">
                                                    <MGButton
                                                        variant="primary"
                                                        size="medium"
                                                        type="button"
                                                        fullWidth
                                                        className={`${buildErpMgButtonClassName({ variant: 'primary', loading })} mg-v2-button-full`}
                                                        loading={loading}
                                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                    >
                                                        {t('erp:TaxManagement.t_6df7a2a5')}
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
