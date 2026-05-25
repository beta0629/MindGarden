import React, { useState, useEffect } from 'react';
import { ICONS } from '../../constants/icons';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_BRANCHES = '/api/v1/branches';
const API_STATISTICS_RECALCULATE = '/api/v1/statistics/recalculate';


const BarChartIcon = ICONS.BAR_CHART;
const CalendarIcon = ICONS.CALENDAR;
const BuildingIcon = ICONS.BUILDING;
const TargetIcon = ICONS.TARGET;
const DollarSignIcon = ICONS.DOLLAR_SIGN;
import { apiGet, apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import UnifiedModal from '../common/modals/UnifiedModal';
import CustomSelect from '../common/CustomSelect';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { useTranslation } from 'react-i18next';

/**
 * 성과 지표 대시보드 모달 컴포넌트
/**
 * - 실시간 성과 지표 표시
/**
 * - 지표 재계산 기능
/**
 * - 기간별 필터링
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-09-30
 */
const PerformanceMetricsModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation(['statistics']);
    const [loading, setLoading] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [metrics, setMetrics] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [branchCode, setBranchCode] = useState('');
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        if (isOpen) {
            // 현재 월로 초기화
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            setDateRange({
                startDate: firstDay.toISOString().split('T')[0],
                endDate: lastDay.toISOString().split('T')[0]
            });
            
            loadBranches();
            loadMetrics();
        }
    }, [isOpen]);

/**
     * 지점 목록 로드
     */
    const loadBranches = async() => {
        try {
            const response = await apiGet(API_BRANCHES);
            if (response && response.success !== false) {
                setBranches(response.data || []);
            }
        } catch (error) {
            console.error(t('statistics:branch.loadFail'), error);
        }
    };

/**
     * 성과 지표 로드
     */
    const loadMetrics = async() => {
        try {
            setLoading(true);
            
            const params = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
                branchCode: branchCode || ''
            });

            // 임시: 사용 가능한 API 사용
            const response = await apiGet(`/api/admin/statistics/overall?${params}`);
            
            if (response && response.success !== false) {
                setMetrics(response.data);
            } else {
                throw new Error(response?.message || t('statistics:metrics.loadFail'));
            }

        } catch (error) {
            console.error(t('statistics:metrics.loadFail'), error);
            notificationManager.error(error.message || t('statistics:metrics.loadError'));
        } finally {
            setLoading(false);
        }
    };

/**
     * 성과 지표 재계산
     */
    const handleRecalculate = async() => {
        try {
            setRecalculating(true);
            
            const response = await apiPost(API_STATISTICS_RECALCULATE, {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
                branchCode: branchCode || ''
            });
            
            if (response && response.success !== false) {
                notificationManager.success(t('statistics:metrics.recalculated'));
                loadMetrics();
            } else {
                throw new Error(response?.message || t('statistics:metrics.recalculateFail'));
            }

        } catch (error) {
            console.error(t('statistics:metrics.recalculateFail'), error);
            notificationManager.error(error.message || t('statistics:metrics.recalculateError'));
        } finally {
            setRecalculating(false);
        }
    };

/**
     * 필터 변경 처리
     */
    const handleFilterChange = () => {
        loadMetrics();
    };

/**
     * 모달 닫기
     */
    const handleClose = () => {
        if (loading || recalculating) return;
        setMetrics(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={handleClose}
            title={t('statistics:dashboard.title')}
            size="large"
            backdropClick
            showCloseButton
            loading={loading}
        >
                <div className="mg-v2-modal-body">
                    {/* 필터 설정 */}
                    <div className="mg-v2-form-section">
                        <h3 className="mg-v2-section-title">
                            <BarChartIcon size={20} className="mg-v2-section-title-icon" />
                            {t('statistics:filter.title')}
                        </h3>
                        <div className="mg-v2-form-grid">
                            <div className="mg-v2-form-group">
                                <label className="mg-v2-form-label">
                                    <CalendarIcon size={16} className="mg-v2-form-label-icon" />
                                    {t('statistics:filter.startDate')}
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                    disabled={loading || recalculating}
                                    className="mg-v2-form-input"
                                />
                            </div>
                            <div className="mg-v2-form-group">
                                <label className="mg-v2-form-label">
                                    <CalendarIcon size={16} className="mg-v2-form-label-icon" />
                                    {t('statistics:filter.endDate')}
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                    disabled={loading || recalculating}
                                    className="mg-v2-form-input"
                                />
                            </div>
                            <div className="mg-v2-form-group">
                                <label className="mg-v2-form-label">
                                    <BuildingIcon size={16} className="mg-v2-form-label-icon" />
                                    {t('statistics:filter.branch')}
                                </label>
                                <CustomSelect
                                    value={branchCode}
                                    onChange={(val) => setBranchCode(val)}
                                    options={[
                                        { value: '', label: t('statistics:filter.allBranches') },
                                        ...branches.map(branch => ({
                                            value: branch.code,
                                            label: branch.name
                                        }))
                                    ]}
                                    placeholder={t('statistics:filter.allBranches')}
                                    disabled={loading || recalculating}
                                    className="mg-v2-form-select"
                                />
                            </div>
                        </div>
                        <div className="mg-v2-modal-footer">
                            <MGButton
                                className={buildErpMgButtonClassName({
                                    variant: 'primary',
                                    size: 'md',
                                    loading: false,
                                    className: 'mg-v2-button--primary'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={handleFilterChange}
                                disabled={loading || recalculating}
                                variant="primary"
                            >
                                {t('statistics:filter.query')}
                            </MGButton>
                            <MGButton
                                className={buildErpMgButtonClassName({
                                    variant: 'secondary',
                                    size: 'md',
                                    loading: recalculating,
                                    className: 'mg-v2-button--secondary'
                                })}
                                onClick={handleRecalculate}
                                disabled={loading || recalculating}
                                loading={recalculating}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                variant="secondary"
                            >
                                {t('statistics:filter.recalculate')}
                            </MGButton>
                        </div>
                    </div>

                    {/* 성과 지표 표시 */}
                    {loading ? (
                        <div className="mg-v2-loading-overlay">
                            <div className="mg-loading">{t('statistics:performance.loadingText')}</div>
                        </div>
                    ) : metrics ? (
                        <div className="mg-v2-form-section mg-v2-mt-lg">
                            <h4 className="mg-v2-section-title mg-v2-mb-md">
                                <TargetIcon size={20} className="mg-v2-section-title-icon" />
                                {t('statistics:metrics.title')}
                            </h4>
                            <div className="mg-v2-info-grid">
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">{t('statistics:metrics.totalConsultants')}</span>
                                    <span className="mg-v2-info-value">{t('statistics:unit.personCount', { count: metrics.totalConsultants || 0 })}</span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">{t('statistics:metrics.totalConsultations')}</span>
                                    <span className="mg-v2-info-value">{t('statistics:unit.caseCount', { count: metrics.totalConsultations || 0 })}</span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <DollarSignIcon size={16} className="mg-v2-icon-inline" />
                                    <span className="mg-v2-info-label">{t('statistics:metrics.totalRevenue')}</span>
                                    <span className="mg-v2-info-value">
                                        {t('statistics:unit.wonAmount', { amount: (metrics.totalRevenue || 0).toLocaleString() })}
                                    </span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">{t('statistics:metrics.avgSatisfaction')}</span>
                                    <span className="mg-v2-info-value">{t('statistics:unit.scoreCount', { count: metrics.averageSatisfaction || 0 })}</span>
                                </div>
                            </div>

                            {/* 상세 지표 */}
                            <div className="mg-v2-mt-lg">
                                <div className="mg-v2-form-section">
                                    <h5 className="mg-v2-section-title mg-v2-mb-md">{t('statistics:performance.title')}</h5>
                                    <div className="mg-v2-list-container">
                                        {metrics.consultantPerformance?.map((consultant, index) => (
                                            <div key={index} className="mg-v2-list-item">
                                                <div className="mg-v2-list-item-content">
                                                    <SafeText tag="div" className="mg-v2-list-item-title">{consultant.name}</SafeText>
                                                    <div className="mg-v2-list-item-subtitle">
                                                        {t('statistics:summary.consultantLine', { count: consultant.consultationCount, revenue: consultant.revenue?.toLocaleString(), satisfaction: consultant.satisfaction })}
                                                    </div>
                                                </div>
                                            </div>
                                        )) || <div className="mg-v2-empty-state"><p>{t('statistics:performance.noData')}</p></div>}
                                    </div>
                                </div>

                                <div className="mg-v2-form-section mg-v2-mt-lg">
                                    <h5 className="mg-v2-section-title mg-v2-mb-md">{t('statistics:performance.daily')}</h5>
                                    <div className="mg-v2-list-container">
                                        {metrics.dailyTrend?.map((day, index) => (
                                            <div key={index} className="mg-v2-list-item">
                                                <div className="mg-v2-list-item-content">
                                                    <div className="mg-v2-list-item-title">{day.date}</div>
                                                    <div className="mg-v2-list-item-subtitle">
                                                        {t('statistics:summary.dailyLine', { count: day.consultations, revenue: day.revenue?.toLocaleString() })}
                                                    </div>
                                                </div>
                                            </div>
                                        )) || <div className="mg-v2-empty-state"><p>{t('statistics:performance.noData')}</p></div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mg-v2-empty-state">
                            <p>{t('statistics:metrics.noData')}</p>
                            <MGButton
                                className={buildErpMgButtonClassName({
                                    variant: 'primary',
                                    size: 'md',
                                    loading: false,
                                    className: 'mg-v2-button--primary mg-v2-mt-md'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={loadMetrics}
                                disabled={loading}
                                variant="primary"
                            >
                                {t('statistics:metrics.loadData')}
                            </MGButton>
                        </div>
                    )}
                </div>
        </UnifiedModal>
    );
};

export default PerformanceMetricsModal;
