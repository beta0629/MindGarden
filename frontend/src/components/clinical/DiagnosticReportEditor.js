import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import { CLINICAL_API } from '../../constants/clinicalApi';
import { CLINICAL_CSS } from '../../constants/clinicalCss';
import notificationManager from '../../utils/notification';
import MGButton from '../common/MGButton';
import './DiagnosticReportEditor.css';

/**
 * 진단 보고서 에디터 컴포넌트
 * AI 생성 진단 보고서 초안을 검토하고 편집
 *
 * @param {Object} props
 * @param {number} props.consultationRecordId - 상담 기록 ID
 */
const DiagnosticReportEditor = ({ consultationRecordId }) => {
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
                throw new Error('보고서 로드 실패');
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
                throw new Error(data?.message || '진단 보고서 생성 실패');
            }

            setReport(data.report);

            console.log('✅ 진단 보고서 생성 완료');

        } catch (error) {
            console.error('❌ 진단 보고서 생성 실패:', error);
            setError('진단 보고서 생성에 실패했습니다.');
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
                throw new Error(data?.message || '저장 실패');
            }

            setReport(data.report);

            setSaveMessage('✅ 저장되었습니다.');
            setTimeout(() => setSaveMessage(''), 3000);

        } catch (error) {
            console.error('저장 실패:', error);
            setSaveMessage('❌ 저장에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * 보고서 승인
     */
    const handleApprove = async() => {
        const confirmed = window.confirm(
            '이 진단 보고서를 최종 승인하시겠습니까?\n승인 후에는 공식 문서로 저장됩니다.'
        );

        if (!confirmed) return;

        try {
            const reviewerUserId = 1; // TODO: 실제 사용자 ID

            const data = await apiPost(
                `${CLINICAL_API.APPROVE_REPORT(report.id)}?reviewerUserId=${reviewerUserId}`
            );

            if (!data || !data.success) {
                throw new Error(data?.message || '승인 실패');
            }
            setReport(data.report);

            notificationManager.success('진단 보고서가 승인되었습니다.');

        } catch (error) {
            console.error('승인 실패:', error);
            notificationManager.error('승인에 실패했습니다.');
        }
    };

    /**
     * PDF 내보내기
     */
    const exportToPDF = () => {
        // TODO: PDF 생성 라이브러리 통합 (jsPDF 등)
        notificationManager.info('PDF 내보내기 기능은 곧 추가됩니다.');
    };

    if (isLoading) {
        return (
            <div className="diagnostic-report-editor loading">
                <div className="spinner" />
                <p>보고서를 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className={CLINICAL_CSS.DIAGNOSTIC_REPORT_EDITOR}>
            <div className="editor-header">
                <h3>📋 진단 보고서</h3>
                <div className="header-actions">
                    {!report && (
                        <MGButton
                            className="btn btn-primary"
                            onClick={generateReport}
                            disabled={isGenerating}
                            loading={isGenerating}
                            loadingText="생성 중..."
                            variant="primary"
                        >
                            🤖 AI 보고서 생성
                        </MGButton>
                    )}

                    {report && !report.humanReviewed && (
                        <MGButton
                            className="btn btn-secondary"
                            onClick={exportToPDF}
                            variant="secondary"
                        >
                            📄 PDF 내보내기
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
                    <h4>진단 보고서가 없습니다</h4>
                    <p>상담 기록을 기반으로 AI가 진단 보고서 초안을 생성합니다.</p>
                    <MGButton
                        className="btn btn-primary btn-large"
                        onClick={generateReport}
                        variant="primary"
                        size="large"
                    >
                        🤖 진단 보고서 생성하기
                    </MGButton>
                </div>
            )}

            {/* 보고서 편집 */}
            {report && (
                <div className="report-content">
                    {/* 메타 정보 */}
                    <div className="report-meta">
                        <span className="meta-item">
                            🤖 AI 모델: {report.aiModelUsed || 'N/A'}
                        </span>
                        {report.generationTimeMs && (
                            <span className="meta-item">
                                ⏱️ 생성 시간: {(report.generationTimeMs / 1000).toFixed(1)}초
                            </span>
                        )}
                        {report.humanReviewed && (
                            <span className="meta-item reviewed">
                                ✅ 검토 완료
                            </span>
                        )}
                    </div>

                    {/* 진단 요약 */}
                    <div className="report-section">
                        <h4>📊 진단 요약 (Diagnosis Summary)</h4>
                        <p className="section-guide">
                            내담자의 주요 증상과 전반적인 상태를 간결하게 요약합니다.
                        </p>
                        <textarea
                            className="report-textarea"
                            value={report.diagnosisSummary || ''}
                            onChange={(e) => setReport({ ...report, diagnosisSummary: e.target.value })}
                            placeholder="진단 요약을 입력하세요..."
                            rows="6"
                            disabled={report.humanReviewed}
                        />
                    </div>

                    {/* 진단적 인상 */}
                    <div className="report-section">
                        <h4>🔍 진단적 인상 (Diagnostic Impressions)</h4>
                        <p className="section-guide">
                            DSM-5/ICD-11 기준을 참고한 임상적 관찰 및 인상을 기록합니다.
                        </p>
                        <textarea
                            className="report-textarea"
                            value={report.diagnosticImpressions || ''}
                            onChange={(e) => setReport({ ...report, diagnosticImpressions: e.target.value })}
                            placeholder="진단적 인상을 입력하세요..."
                            rows="8"
                            disabled={report.humanReviewed}
                        />
                    </div>

                    {/* 치료 권고사항 */}
                    <div className="report-section">
                        <h4>💊 치료 권고사항 (Treatment Recommendations)</h4>
                        <p className="section-guide">
                            근거 기반 치료 방법 및 권고사항을 제시합니다.
                        </p>
                        <textarea
                            className="report-textarea"
                            value={report.treatmentRecommendations || ''}
                            onChange={(e) => setReport({ ...report, treatmentRecommendations: e.target.value })}
                            placeholder="치료 권고사항을 입력하세요..."
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
                                className="btn btn-secondary"
                                onClick={handleSave}
                                disabled={isSaving}
                                loading={isSaving}
                                loadingText="저장 중..."
                                variant="secondary"
                            >
                                💾 저장
                            </MGButton>

                            <MGButton
                                className="btn btn-success"
                                onClick={handleApprove}
                                variant="success"
                            >
                                ✅ 최종 승인
                            </MGButton>
                        </div>
                    )}

                    {/* 주의사항 */}
                    <div className="report-disclaimer">
                        <strong>⚠️ 주의사항:</strong>
                        <p>
                            이 보고서는 AI가 생성한 초안입니다. 반드시 전문가가 검토하고 수정한 후
                            최종 승인해야 합니다. 법적 효력이나 의료적 결정을 위해서는
                            전문가의 직접 평가가 필수입니다.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiagnosticReportEditor;
