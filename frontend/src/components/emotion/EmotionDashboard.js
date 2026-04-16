import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../utils/ajax';
import { EMOTION_API } from '../../constants/emotionApi';
import { EMOTION_CSS } from '../../constants/emotionCss';
import VoiceBiomarkerChart from './VoiceBiomarkerChart';
import FacialEmotionTimeline from './FacialEmotionTimeline';
import EmotionTrendChart from './EmotionTrendChart';
import CognitiveDistortionPanel from './CognitiveDistortionPanel';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import './EmotionDashboard.css';

/**
 * 멀티모달 감정 분석 대시보드
 *
 * 음성, 비디오, 텍스트 감정 분석 결과를 통합 표시
 *
 * @param {Object} props
 * @param {number} props.consultationRecordId - 상담 기록 ID
 * @param {number} props.clientId - 내담자 ID
 */
const EmotionDashboard = ({ consultationRecordId, clientId }) => {
    const [multimodalReport, setMultimodalReport] = useState(null);
    const [voiceBiomarker, setVoiceBiomarker] = useState(null);
    const [videoEmotion, setVideoEmotion] = useState(null);
    const [textEmotion, setTextEmotion] = useState(null);
    const [emotionTrend, setEmotionTrend] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (consultationRecordId) {
            loadEmotionData();
        }
    }, [consultationRecordId]);

    /**
     * 감정 분석 데이터 로드
     */
    const loadEmotionData = async() => {
        setIsLoading(true);
        setError(null);

        try {
            // 멀티모달 통합 리포트 생성
            const reportData = await apiPost(EMOTION_API.GENERATE_MULTIMODAL(consultationRecordId));

            if (reportData && reportData.success) {
                setMultimodalReport(reportData.report);

                // 개별 모달리티 데이터는 리포트에서 참조 ID로 조회 가능
                // 여기서는 간단히 리포트 데이터만 사용
            }

            // 감정 추이 데이터 로드
            if (clientId) {
                const trendData = await apiGet(
                    EMOTION_API.GET_EMOTION_TREND(clientId),
                    { emotionType: 'anxiety' }
                );

                if (trendData && trendData.success) {
                    setEmotionTrend(trendData.trend || []);
                }
            }

        } catch (err) {
            console.error('감정 데이터 로드 실패:', err);
            setError('감정 분석 데이터를 불러올 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 위험도 색상
     */
    const getRiskColor = (riskLevel) => {
        const colors = {
            'CRITICAL': '#dc2626',
            'HIGH': '#ea580c',
            'MEDIUM': 'var(--mg-warning-500)',
            'LOW': 'var(--mg-success-500)'
        };
        return colors[riskLevel] || '#6b7280';
    };

    if (isLoading) {
        return (
            <div className={EMOTION_CSS.EMOTION_DASHBOARD}>
                <div className="loading-container">
                    <div className="spinner" />
                    <p>감정 분석 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={EMOTION_CSS.EMOTION_DASHBOARD}>
                <div className="error-message">{error}</div>
                <MGButton
                    className={buildErpMgButtonClassName({
                        variant: 'primary',
                        size: 'md',
                        loading: false,
                        className: 'btn btn-primary'
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={loadEmotionData}
                    variant="primary"
                >
                    다시 시도
                </MGButton>
            </div>
        );
    }

    if (!multimodalReport) {
        return (
            <div className={EMOTION_CSS.EMOTION_DASHBOARD}>
                <div className="empty-state">
                    <p>감정 분석 데이터가 없습니다.</p>
                    <MGButton
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'btn btn-primary'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={loadEmotionData}
                        variant="primary"
                    >
                        분석 시작
                    </MGButton>
                </div>
            </div>
        );
    }

    return (
        <div className={EMOTION_CSS.EMOTION_DASHBOARD}>
            {/* 헤더 */}
            <div className={EMOTION_CSS.DASHBOARD_HEADER}>
                <h2>🔬 멀티모달 감정 분석</h2>
                <div className="header-meta">
                    <span className="modalities-used">
                        분석 모드: {multimodalReport.modalitiesUsed}
                    </span>
                    <span
                        className={`risk-badge ${EMOTION_CSS.RISK_LEVEL[multimodalReport.overallRiskLevel]}`}
                        style={{ backgroundColor: getRiskColor(multimodalReport.overallRiskLevel) }}
                    >
                        위험도: {multimodalReport.overallRiskLevel}
                    </span>
                </div>
            </div>

            {/* 통합 지표 */}
            <div className={EMOTION_CSS.DASHBOARD_GRID}>
                <div className={EMOTION_CSS.EMOTION_CARD}>
                    <h3>😰 불안 지수</h3>
                    <div className="metric-value-large">
                        {(multimodalReport.anxietyIndex * 100).toFixed(0)}%
                    </div>
                    <div className="metric-bar">
                        <div
                            className="metric-bar-fill anxiety"
                            style={{ width: `${multimodalReport.anxietyIndex * 100}%` }}
                         />
                    </div>
                </div>

                <div className={EMOTION_CSS.EMOTION_CARD}>
                    <h3>😔 우울 지수</h3>
                    <div className="metric-value-large">
                        {(multimodalReport.depressionIndex * 100).toFixed(0)}%
                    </div>
                    <div className="metric-bar">
                        <div
                            className="metric-bar-fill depression"
                            style={{ width: `${multimodalReport.depressionIndex * 100}%` }}
                         />
                    </div>
                </div>

                <div className={EMOTION_CSS.EMOTION_CARD}>
                    <h3>😣 스트레스 지수</h3>
                    <div className="metric-value-large">
                        {(multimodalReport.stressIndex * 100).toFixed(0)}%
                    </div>
                    <div className="metric-bar">
                        <div
                            className="metric-bar-fill stress"
                            style={{ width: `${multimodalReport.stressIndex * 100}%` }}
                         />
                    </div>
                </div>

                <div className={EMOTION_CSS.EMOTION_CARD}>
                    <h3>⚡ 에너지 지수</h3>
                    <div className="metric-value-large">
                        {(multimodalReport.energyIndex * 100).toFixed(0)}%
                    </div>
                    <div className="metric-bar">
                        <div
                            className="metric-bar-fill energy"
                            style={{ width: `${multimodalReport.energyIndex * 100}%` }}
                         />
                    </div>
                </div>
            </div>

            {/* 모달리티별 상세 분석 */}
            <div className="modality-details">
                {/* 음성 바이오마커 */}
                {multimodalReport.voiceBiomarkerId && (
                    <div className="detail-section">
                        <h3>🎤 음성 바이오마커</h3>
                        <VoiceBiomarkerChart
                            biomarkerId={multimodalReport.voiceBiomarkerId}
                        />
                    </div>
                )}

                {/* 비디오 감정 */}
                {multimodalReport.videoEmotionId && (
                    <div className="detail-section">
                        <h3>📹 표정 감정 분석</h3>
                        <FacialEmotionTimeline
                            emotionId={multimodalReport.videoEmotionId}
                        />
                    </div>
                )}

                {/* 텍스트 감정 */}
                {multimodalReport.textEmotionId && (
                    <div className="detail-section">
                        <h3>📝 텍스트 감정 분석</h3>
                        <CognitiveDistortionPanel
                            emotionId={multimodalReport.textEmotionId}
                        />
                    </div>
                )}
            </div>

            {/* AI 요약 */}
            {multimodalReport.aiSummary && (
                <div className="ai-summary-section">
                    <h3>🤖 AI 분석 요약</h3>
                    <div className="ai-summary-content">
                        {multimodalReport.aiSummary}
                    </div>

                    {multimodalReport.recommendations && (
                        <div className="ai-recommendations">
                            <h4>💡 권장 사항</h4>
                            <p>{multimodalReport.recommendations}</p>
                        </div>
                    )}
                </div>
            )}

            {/* 감정 변화 추이 */}
            {emotionTrend.length > 0 && (
                <div className="trend-section">
                    <h3>📈 감정 변화 추이</h3>
                    <EmotionTrendChart trend={emotionTrend} />
                </div>
            )}
        </div>
    );
};

export default EmotionDashboard;
