import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import { CLINICAL_API } from '../../constants/clinicalApi';
import { CLINICAL_CSS } from '../../constants/clinicalCss';
import notificationManager from '../../utils/notification';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import './DiagnosticReportEditor.css';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../hooks/useConfirm';

/**
 * 진단 보고서 에디터 컴포넌트
 * AI 생성 진단 보고서 초안을 검토하고 편집
 *
 * @param {Object} props
 * @param {number} props.consultationRecordId - 상담 기록 ID
 */
const DiagnosticReportEditor = ({ consultationRecordId }) => {
    const { t } = useTranslation(['report']);
    const [confirm, ConfirmModal] = useConfirm();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saveMessage, setSaveMessage] = useState('');

    /**
     * 기존 보고서 로드
     */
    useEffect(() => {
        loadExistingReports();
    }, [consultationRecordId]);

    const loadExistingReports = async() => {
        setIsLoading(true);

        try {
            const data = await apiGet(CLINICAL_API.GET_REPORTS(consultationRecordId));

            if (!data) {
                throw new Error(t('report:diagnostic.loadFail'));
            }

            // DIAGNOSTIC 타입 보고서 찾기
            const diagnosticReport = data.reports?.find(r => r.reportType === 'DIAGNOSTIC');
            if (diagnosticReport) {
                setReport(diagnosticReport);
            }

        } catch (error) {
            console.error('보고서 로드 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 진단 보고서 생성
     */
    const generateReport = async() => {
        setIsGenerating(true);
        setError(null);

        try {
            const data = await apiPost(CLINICAL_API.GENERATE_DIAGNOSTIC(consultationRecordId));

            if (!data || !data.success) {
                throw new Error(data?.message || t('report:diagnostic.generateFail'));
            }

            setReport(data.report);

            console.log('✅ 진단 보고서 생성 완료');

        } catch (error) {
            console.error('❌ 진단 보고서 생성 실패:', error);
            setError(t('report:diagnostic.generateError'));
        } finally {
            setIsGenerating(false);
        }
    };

    /**
     * 보고서 저장
     */
    const handleSave = async() => {
        setIsSaving(true);
        setSaveMessage('');

        try {
            const data = await apiPut(CLINICAL_API.UPDATE_REPORT(report.id), report);

            if (!data || !data.success) {
                throw new Error(data?.message || t('report:diagnostic.savingFail'));
            }

            setReport(data.report);

            setSaveMessage(t('report:diagnostic.saveSuccess'));
            setTimeout(() => setSaveMessage(''), 3000);

        } catch (error) {
            console.error('저장 실패:', error);
            setSaveMessage(t('report:diagnostic.saveFail'));
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * 보고서 승인
     */
    const handleApprove = async() => {
        const confirmed = await confirm({
            variant: 'info',
            message: t('report:diagnostic.approveConfirm')
        });

        if (!confirmed) return;

        try {
            const reviewerUserId = 1; // TODO: 실제 사용자 ID

            const data = await apiPost(
                `${CLINICAL_API.APPROVE_REPORT(report.id)}?reviewerUserId=${reviewerUserId}`
            );

            if (!data || !data.success) {
                throw new Error(data?.message || t('report:diagnostic.approveFail'));
            }
            setReport(data.report);

            notificationManager.success(t('report:diagnostic.approveSuccess'));

        } catch (error) {
            console.error('승인 실패:', error);
            notificationManager.error(t('report:diagnostic.approveFail'));
        }
    };

    /**
     * PDF 내보내기
     */
    const exportToPDF = () => {
        // TODO: PDF 생성 라이브러리 통합 (jsPDF 등)
        notificationManager.info(t('report:diagnostic.pdfComingSoon'));
    };

    if (isLoading) {
        return (
            <div className="diagnostic-report-editor loading">
                <div className="spinner" />
                <p>{t('report:diagnostic.loading')}</p>
            </div>
        );
    }

    return (
        <>
        <div className={CLINICAL_CSS.DIAGNOSTIC_REPORT_EDITOR}>
            <div className="editor-header">
                <h3>📋 {t('report:diagnostic.title')}</h3>
                <div className="header-actions">
                    {!report && (
                        <MGButton
                            className={buildErpMgButtonClassName({
                                variant: 'primary',
                                size: 'md',
                                loading: isGenerating,
                                className: 'btn btn-primary'
                            })}
                            onClick={generateReport}
                            disabled={isGenerating}
                            loading={isGenerating}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            variant="primary"
                        >
                            🤖 {t('report:diagnostic.generateBtn')}
                        </MGButton>
                    )}

                    {report && !report.humanReviewed && (
                        <MGButton
                            className={buildErpMgButtonClassName({
                                variant: 'secondary',
                                size: 'md',
                                loading: false,
                                className: 'btn btn-secondary'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={exportToPDF}
                            variant="secondary"
                        >
                            📄 {t('report:diagnostic.exportPdf')}
                        </MGButton>
                    )}
                </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            {/* 보고서 없음 안내 */}
            {!report && !isGenerating && (
                <div className="no-report-message">
                    <div className="icon">📋</div>
                    <h4>{t('report:diagnostic.noReport')}</h4>
                    <p>{t('report:diagnostic.noReportDesc')}</p>
                    <MGButton
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'lg',
                            loading: false,
                            className: 'btn btn-primary btn-large'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={generateReport}
                        variant="primary"
                        size="large"
                    >
                        🤖 {t('report:diagnostic.generateBtnLarge')}
                    </MGButton>
                </div>
            )}

            {/* 보고서 편집 */}
            {report && (
                <div className="report-content">
                    {/* 메타 정보 */}
                    <div className="report-meta">
                        <span className="meta-item">
                            {t('report:diagnostic.aiModelLabel')} {report.aiModelUsed || 'N/A'}
                        </span>
                        {report.generationTimeMs && (
                            <span className="meta-item">
                                ⏱️ {t('report:diagnostic.generationTimeLabel')} {(report.generationTimeMs / 1000).toFixed(1)}{t('report:diagnostic.secondsUnit')}
                            </span>
                        )}
                        {report.humanReviewed && (
                            <span className="meta-item reviewed">
                                ✅ {t('report:diagnostic.reviewed')}
                            </span>
                        )}
                    </div>

                    {/* 진단 요약 */}
                    <div className="report-section">
                        <h4>{t('report:diagnostic.sections.summary.title')}</h4>
                        <p className="section-guide">
                            {t('report:diagnostic.sections.summary.guide')}
                        </p>
                        <textarea
                            className="report-textarea"
                            value={report.diagnosisSummary || ''}
                            onChange={(e) => setReport({ ...report, diagnosisSummary: e.target.value })}
                            placeholder={t('report:diagnostic.sections.summary.placeholder')}
                            rows="6"
                            disabled={report.humanReviewed}
                        />
                    </div>

                    {/* 진단적 인상 */}
                    <div className="report-section">
                        <h4>{t('report:diagnostic.sections.impressions.title')}</h4>
                        <p className="section-guide">
                            {t('report:diagnostic.sections.impressions.guide')}
                        </p>
                        <textarea
                            className="report-textarea"
                            value={report.diagnosticImpressions || ''}
                            onChange={(e) => setReport({ ...report, diagnosticImpressions: e.target.value })}
                            placeholder={t('report:diagnostic.sections.impressions.placeholder')}
                            rows="8"
                            disabled={report.humanReviewed}
                        />
                    </div>

                    {/* 치료 권고사항 */}
                    <div className="report-section">
                        <h4>{t('report:diagnostic.sections.recommendations.title')}</h4>
                        <p className="section-guide">
                            {t('report:diagnostic.sections.recommendations.guide')}
                        </p>
                        <textarea
                            className="report-textarea"
                            value={report.treatmentRecommendations || ''}
                            onChange={(e) => setReport({ ...report, treatmentRecommendations: e.target.value })}
                            placeholder={t('report:diagnostic.sections.recommendations.placeholder')}
                            rows="7"
                            disabled={report.humanReviewed}
                        />
                    </div>

                    {/* 저장 메시지 */}
                    {saveMessage && (
                        <div className={`save-message ${saveMessage.includes('✅') ? 'success' : 'error'}`}>
                            {saveMessage}
                        </div>
                    )}

                    {/* 액션 버튼 */}
                    {!report.humanReviewed && (
                        <div className="editor-actions">
                            <MGButton
                                className={buildErpMgButtonClassName({
                                    variant: 'secondary',
                                    size: 'md',
                                    loading: isSaving,
                                    className: 'btn btn-secondary'
                                })}
                                onClick={handleSave}
                                disabled={isSaving}
                                loading={isSaving}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                variant="secondary"
                            >
                                💾 {t('report:diagnostic.saveBtn')}
                            </MGButton>

                            <MGButton
                                className={buildErpMgButtonClassName({
                                    variant: 'success',
                                    size: 'md',
                                    loading: false,
                                    className: 'btn btn-success'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={handleApprove}
                                variant="success"
                            >
                                ✅ {t('report:diagnostic.approveBtn')}
                            </MGButton>
                        </div>
                    )}

                    {/* 주의사항 */}
                    <div className="report-disclaimer">
                        <strong>⚠️ {t('report:diagnostic.disclaimerLabel')}</strong>
                        <p>
                            {t('report:diagnostic.disclaimer')}
                        </p>
                    </div>
                </div>
            )}
        </div>
        <ConfirmModal />
        </>
    );
};

export default DiagnosticReportEditor;
