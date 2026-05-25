import React, { useState, useEffect } from 'react';
import { FileBarChart, Calendar, Building, DollarSign, TrendingUp } from 'lucide-react';
import { ERP_API, getApiBaseUrl } from '../../constants/api';
import { getDefaultApiHeadersAsync } from '../../utils/apiHeaders';
import StandardizedApi from '../../utils/standardizedApi';
import notificationManager from '../../utils/notification';
import UnifiedModal from '../common/modals/UnifiedModal';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import CustomSelect from '../common/CustomSelect';
import BadgeSelect from '../common/BadgeSelect';
import { ErpSafeNumber, ErpSafeText, ERP_NUMBER_FORMAT } from './common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
import './ErpCommon.css';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_BRANCHES = '/api/v1/branches';
const API_ERP_REPORTS = '/api/v1/erp/reports';


/**
 * ERP 보고서 모달 컴포넌트
/**
 * - 월별/분기별/연별 보고서 생성
/**
 * - 보고서 다운로드 기능
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-09-30
 */
const ErpReportModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation(['report', 'common']);
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState('monthly');
    const [period, setPeriod] = useState('');
    const [branchCode, setBranchCode] = useState('');
    const [reportData, setReportData] = useState(null);
    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadBranches();
            // 현재 월로 초기화
            const now = new Date();
            setPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        }
    }, [isOpen]);

/**
     * 지점 목록 로드
     */
    const loadBranches = async() => {
        try {
            setLoadingBranches(true);
            const raw = await StandardizedApi.get(API_BRANCHES);
            const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
            setBranches(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error(t('report:erp.branchLoadFail'), error);
        } finally {
            setLoadingBranches(false);
        }
    };

/**
     * 보고서 생성
     */
    const handleGenerateReport = async() => {
        if (!period) {
            notificationManager.error(t('report:erp.noPeriod'));
            return;
        }

        try {
            setLoading(true);
            
            const response = await StandardizedApi.get(API_ERP_REPORTS, {
                type: reportType,
                period: period,
                // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
                branchCode: branchCode || ''
            });

            if (response && response.success === false) {
                throw new Error(response?.message || t('report:erp.generateFail'));
            }
            const payload = response?.data !== undefined && response?.data !== null ? response.data : response;
            if (payload != null && typeof payload === 'object') {
                setReportData(payload);
                notificationManager.success(t('report:erp.generateSuccess'));
            } else {
                throw new Error(response?.message || t('report:erp.generateFail'));
            }

        } catch (error) {
            console.error(t('report:erp.generateFail'), error);
            notificationManager.error(error.message || t('report:erp.generateError'));
        } finally {
            setLoading(false);
        }
    };

/**
     * 보고서 다운로드
     */
    const handleDownloadReport = async() => {
        if (!reportData) {
            notificationManager.error(t('report:erp.noDownload'));
            return;
        }

        try {
            const params = new URLSearchParams({
                type: reportType,
                period: period,
                // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
                branchCode: branchCode || '',
                format: 'excel'
            });

            const headers = await getDefaultApiHeadersAsync({}, true);
            const requestUrl = `${getApiBaseUrl()}${ERP_API.REPORTS_DOWNLOAD}?${params}`;
            const response = await fetch(requestUrl, {
                method: 'GET',
                credentials: 'include',
                headers: { ...headers }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `erp-report-${reportType}-${period}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                notificationManager.success(t('report:erp.downloadSuccess'));
            } else {
                throw new Error(t('report:erp.downloadFail'));
            }

        } catch (error) {
            console.error(t('report:erp.downloadFail'), error);
            notificationManager.error(error.message || t('report:erp.downloadError'));
        }
    };

/**
     * 모달 닫기
     */
    const handleClose = () => {
        if (loading) return;
        setReportData(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={handleClose}
            title={t('report:erp.title')}
            size="large"
            backdropClick
            showCloseButton
            loading={loading}
            className="erp-report-modal"
        >
                {/* 본문 영역 busy — UnifiedModal loading과 중복되어도 본문 a11y 명시 */}
                <div className="mg-v2-modal-body" aria-busy={loading || loadingBranches}>
                    {/* 보고서 설정 */}
                    <div className="mg-v2-form-section">
                        <h3 className="mg-v2-section-title">
                            <Calendar size={20} className="mg-v2-section-title-icon" />
                            {t('report:erp.settingsTitle')}
                        </h3>

                        <div className="mg-v2-form-group">
                            <label className="mg-v2-form-label">{t('report:erp.typeLabel')}</label>
                            <div className="mg-v2-form-radio-group">
                                <label className="mg-v2-form-radio">
                                    <input
                                        type="radio"
                                        value="monthly"
                                        checked={reportType === 'monthly'}
                                        onChange={(e) => setReportType(e.target.value)}
                                        disabled={loading}
                                    />
                                    <span>{t('report:erp.monthly')}</span>
                                </label>
                                <label className="mg-v2-form-radio">
                                    <input
                                        type="radio"
                                        value="quarterly"
                                        checked={reportType === 'quarterly'}
                                        onChange={(e) => setReportType(e.target.value)}
                                        disabled={loading}
                                    />
                                    <span>{t('report:erp.quarterly')}</span>
                                </label>
                                <label className="mg-v2-form-radio">
                                    <input
                                        type="radio"
                                        value="yearly"
                                        checked={reportType === 'yearly'}
                                        onChange={(e) => setReportType(e.target.value)}
                                        disabled={loading}
                                    />
                                    <span>{t('report:erp.yearly')}</span>
                                </label>
                            </div>
                        </div>

                        <div className="mg-v2-form-group">
                            <label htmlFor="period" className="mg-v2-form-label">{t('report:erp.periodLabel')}</label>
                            {reportType === 'monthly' && (
                                <input
                                    type="month"
                                    id="period"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    disabled={loading}
                                    className="mg-v2-form-input"
                                />
                            )}
                            {reportType === 'quarterly' && (
                                <BadgeSelect
                                    value={period}
                                    onChange={(val) => setPeriod(val)}
                                    options={[
                                        { value: '', label: t('report:erp.selectQuarter') },
                                        { value: '2025-Q1', label: t('report:erp.quarterLabel', { year: 2025, quarter: 1 }) },
                                        { value: '2025-Q2', label: t('report:erp.quarterLabel', { year: 2025, quarter: 2 }) },
                                        { value: '2025-Q3', label: t('report:erp.quarterLabel', { year: 2025, quarter: 3 }) },
                                        { value: '2025-Q4', label: t('report:erp.quarterLabel', { year: 2025, quarter: 4 }) }
                                    ]}
                                    placeholder={t('report:erp.selectQuarter')}
                                    disabled={loading}
                                    className="mg-v2-form-badge-select"
                                />
                            )}
                            {reportType === 'yearly' && (
                                <BadgeSelect
                                    value={period}
                                    onChange={(val) => setPeriod(val)}
                                    options={[
                                        { value: '', label: t('report:erp.selectYear') },
                                        { value: '2025', label: t('report:erp.yearLabel', { year: 2025 }) },
                                        { value: '2024', label: t('report:erp.yearLabel', { year: 2024 }) },
                                        { value: '2023', label: t('report:erp.yearLabel', { year: 2023 }) }
                                    ]}
                                    placeholder={t('report:erp.selectYear')}
                                    disabled={loading}
                                    className="mg-v2-form-badge-select"
                                />
                            )}
                        </div>

                        <div className="mg-v2-form-group">
                            <label htmlFor="branch" className="mg-v2-form-label">
                                <Building size={20} className="mg-v2-form-label-icon" />
                                {t('report:erp.branchLabel')}
                            </label>
                            {loadingBranches ? (
                                <UnifiedLoading
                                    type="inline"
                                    size="small"
                                    centered={false}
                                    text={t('statistics:performance.loadingBranches')}
                                />
                            ) : (
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
                                    disabled={loading}
                                    className="mg-v2-form-select"
                                />
                            )}
                        </div>

                        <div className="mg-v2-modal-footer">
                            <MGButton
                                variant="secondary"
                                size="medium"
                                type="button"
                                className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                                onClick={handleClose}
                                disabled={loading}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            >
                                {t('common.actions.cancel')}
                            </MGButton>
                            <MGButton
                                variant="primary"
                                size="medium"
                                type="button"
                                className={buildErpMgButtonClassName({ variant: 'primary', loading })}
                                onClick={handleGenerateReport}
                                disabled={loading || !period}
                                loading={loading}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            >
                                {t('report:erp.generateBtn')}
                            </MGButton>
                        </div>
                    </div>

                    {/* 보고서 결과 */}
                    {reportData && (
                        <div className="mg-v2-form-section mg-v2-mt-lg">
                            <div className="mg-v2-modal-footer mg-v2-justify-between">
                                <h4 className="mg-v2-section-title">
                                    <FileBarChart size={20} className="mg-v2-section-title-icon" />
                                    {t('report:erp.resultTitle')}
                                </h4>
                                <MGButton
                                    variant="success"
                                    size="medium"
                                    type="button"
                                    className={buildErpMgButtonClassName({ variant: 'success', size: 'md', loading: false })}
                                    onClick={handleDownloadReport}
                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                    >
                                    {t('report:erp.downloadBtn')}
                                </MGButton>
                            </div>

                            <div className="mg-v2-info-grid mg-v2-mt-md">
                                <div className="mg-v2-info-item">
                                    <DollarSign size={20} className="mg-v2-icon-inline" />
                                    <span className="mg-v2-info-label">{t('report:erp.totalRevenue')}</span>
                                    <span className="mg-v2-info-value mg-v2-color-success">
                                        <ErpSafeNumber value={reportData.summary?.totalRevenue} />
                                    </span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <DollarSign size={20} className="mg-v2-icon-inline" />
                                    <span className="mg-v2-info-label">{t('report:erp.totalExpenses')}</span>
                                    <span className="mg-v2-info-value mg-v2-color-danger">
                                        <ErpSafeNumber value={reportData.summary?.totalExpenses} />
                                    </span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <TrendingUp size={20} className="mg-v2-icon-inline" />
                                    <span className="mg-v2-info-label">{t('report:erp.netProfit')}</span>
                                    <span className="mg-v2-info-value mg-v2-color-primary">
                                        <ErpSafeNumber value={reportData.summary?.netProfit} />
                                    </span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">{t('report:erp.transactionCount')}</span>
                                    <span className="mg-v2-info-value">
                                        <ErpSafeNumber
                                            value={reportData.summary?.transactionCount}
                                            formatType={ERP_NUMBER_FORMAT.COUNT}
                                        />
                                    </span>
                                </div>
                            </div>

                            {/* 카테고리별 분석 */}
                            {reportData.categoryBreakdown && reportData.categoryBreakdown.length > 0 && (
                                <div className="mg-v2-mt-lg">
                                    <h5 className="mg-v2-section-title mg-v2-mb-md">{t('report:erp.categoryBreakdown')}</h5>
                                    <div className="mg-v2-list-container">
                                        {reportData.categoryBreakdown.map((item, index) => (
                                            <div key={index} className="mg-v2-list-item">
                                                <div className="mg-v2-list-item-content">
                                                    <div className="mg-v2-list-item-title">
                                                        <ErpSafeText value={item.category} />
                                                    </div>
                                                </div>
                                                <div className="mg-v2-list-item-action">
                                                    <span className="mg-v2-info-value">
                                                        <ErpSafeNumber value={item.amount} />
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
        </UnifiedModal>
    );
};

export default ErpReportModal;
