import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../utils/ajax';
import { PREDICTION_API } from '../../constants/predictionApi';
import { PREDICTION_CSS } from '../../constants/predictionCss';
import TreatmentOutcomeChart from './TreatmentOutcomeChart';
import DropoutRiskIndicator from './DropoutRiskIndicator';
import SimilarCasesPanel from './SimilarCasesPanel';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import './PredictionDashboard.css';
import { useTranslation } from 'react-i18next';

/**
 * 예측 기반 경과 모니터링 대시보드
 *
 * @param {Object} props
 * @param {number} props.clientId - 내담자 ID
 */
const PredictionDashboard = ({ clientId }) => {
    const { t } = useTranslation();
    const [treatmentPrediction, setTreatmentPrediction] = useState(null);
    const [dropoutRisk, setDropoutRisk] = useState(null);
    const [sessionRecommendation, setSessionRecommendation] = useState(null);
    const [similarCases, setSimilarCases] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (clientId) {
            loadPredictionData();
        }
    }, [clientId]);

    const loadPredictionData = async() => {
        setIsLoading(true);
        setError(null);

        try {
            // unwrap 후 예측 필드를 직접 사용 (success 게이트 금지)
            const treatmentData = await apiPost(PREDICTION_API.PREDICT_TREATMENT(clientId));
            if (treatmentData != null && treatmentData.success !== false) {
                setTreatmentPrediction(
                    treatmentData.prediction ?? treatmentData.data?.prediction ?? treatmentData
                );
            }

            const dropoutData = await apiGet(PREDICTION_API.ASSESS_DROPOUT_RISK(clientId));
            if (dropoutData != null && dropoutData.success !== false) {
                setDropoutRisk(
                    dropoutData.assessment ?? dropoutData.data?.assessment ?? dropoutData
                );
            }

            const sessionData = await apiPost(PREDICTION_API.RECOMMEND_SESSIONS(clientId));
            if (sessionData != null && sessionData.success !== false) {
                setSessionRecommendation(
                    sessionData.recommendation ?? sessionData.data?.recommendation ?? sessionData
                );
            }

            const casesData = await apiGet(PREDICTION_API.FIND_SIMILAR_CASES(clientId), { limit: 5 });
            if (casesData != null && casesData.success !== false) {
                const cases = Array.isArray(casesData)
                    ? casesData
                    : (casesData.similarCases || casesData.data?.similarCases || []);
                setSimilarCases(Array.isArray(cases) ? cases : []);
            }

        } catch (err) {
            console.error('예측 데이터 로드 실패:', err);
            setError('예측 데이터를 불러올 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={PREDICTION_CSS.DASHBOARD}>
                <div className={PREDICTION_CSS.LOADING_CONTAINER}>
                    <div className={PREDICTION_CSS.SPINNER} />
                    <p>예측 분석 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={PREDICTION_CSS.DASHBOARD}>
                <div className={PREDICTION_CSS.ERROR_MESSAGE}>{error}</div>
                <MGButton
                    className={buildErpMgButtonClassName({
                        variant: 'primary',
                        size: 'md',
                        loading: false,
                        className: 'btn btn-primary'
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={loadPredictionData}
                    variant="primary"
                >
                    {t('common.labels.retry')}
                </MGButton>
            </div>
        );
    }

    return (
        <div className={PREDICTION_CSS.DASHBOARD}>
            <div className={PREDICTION_CSS.DASHBOARD_HEADER}>
                <h2>예측 기반 경과 모니터링</h2>
                <MGButton
                    className={buildErpMgButtonClassName({
                        variant: 'secondary',
                        size: 'md',
                        loading: false,
                        className: 'btn btn-secondary'
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={loadPredictionData}
                    variant="secondary"
                >
                    🔄 새로고침
                </MGButton>
            </div>

            <div className={PREDICTION_CSS.DASHBOARD_GRID}>
                {/* 치료 경과 예측 */}
                {treatmentPrediction && (
                    <div className={PREDICTION_CSS.DASHBOARD_CARD}>
                        <TreatmentOutcomeChart prediction={treatmentPrediction} />
                    </div>
                )}

                {/* 중도 탈락 위험 */}
                {dropoutRisk && (
                    <div className={PREDICTION_CSS.DASHBOARD_CARD}>
                        <DropoutRiskIndicator risk={dropoutRisk} />
                    </div>
                )}
            </div>

            {/* 회기 수 추천 */}
            {sessionRecommendation && (
                <div className={PREDICTION_CSS.RECOMMENDATION_SECTION}>
                    <h3>💡 권장 상담 회기</h3>
                    <div className={PREDICTION_CSS.RECOMMENDATION_CONTENT}>
                        <div className={PREDICTION_CSS.SESSION_COUNT_BOX}>
                            <div className={PREDICTION_CSS.COUNT_LARGE}>{sessionRecommendation.recommendedSessionCount}회기</div>
                            <div className={PREDICTION_CSS.COUNT_RANGE}>
                                (범위: {sessionRecommendation.minSessionCount} - {sessionRecommendation.maxSessionCount}회기)
                            </div>
                        </div>
                        <div className={PREDICTION_CSS.REASONING}>
                            {sessionRecommendation.reasoning}
                        </div>
                    </div>
                </div>
            )}

            {/* 유사 케이스 */}
            {similarCases.length > 0 && (
                <div className={PREDICTION_CSS.SIMILAR_CASES_SECTION}>
                    <SimilarCasesPanel cases={similarCases} />
                </div>
            )}
        </div>
    );
};

export default PredictionDashboard;
