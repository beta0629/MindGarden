import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../utils/ajax';
import { PREDICTION_API } from '../../constants/predictionApi';
import { PREDICTION_CSS } from '../../constants/predictionCss';
import TreatmentOutcomeChart from './TreatmentOutcomeChart';
import DropoutRiskIndicator from './DropoutRiskIndicator';
import SimilarCasesPanel from './SimilarCasesPanel';
import './PredictionDashboard.css';

/**
 * 예측 기반 경과 모니터링 대시보드
 *
 * @param {Object} props
 * @param {number} props.clientId - 내담자 ID
 */
const PredictionDashboard = ({ clientId }) => {
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

    const loadPredictionData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 치료 경과 예측
            const treatmentData = await apiPost(PREDICTION_API.PREDICT_TREATMENT(clientId));
            if (treatmentData && treatmentData.success) {
                setTreatmentPrediction(treatmentData.prediction);
            }

            // 중도 탈락 위험 평가
            const dropoutData = await apiGet(PREDICTION_API.ASSESS_DROPOUT_RISK(clientId));
            if (dropoutData && dropoutData.success) {
                setDropoutRisk(dropoutData.assessment);
            }

            // 회기 수 추천
            const sessionData = await apiPost(PREDICTION_API.RECOMMEND_SESSIONS(clientId));
            if (sessionData && sessionData.success) {
                setSessionRecommendation(sessionData.recommendation);
            }

            // 유사 케이스
            const casesData = await apiGet(PREDICTION_API.FIND_SIMILAR_CASES(clientId), { limit: 5 });
            if (casesData && casesData.success) {
                setSimilarCases(casesData.similarCases || []);
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
                    <div className={PREDICTION_CSS.SPINNER}></div>
                    <p>예측 분석 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={PREDICTION_CSS.DASHBOARD}>
                <div className={PREDICTION_CSS.ERROR_MESSAGE}>{error}</div>
                <button className="btn btn-primary" onClick={loadPredictionData}>
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className={PREDICTION_CSS.DASHBOARD}>
            <div className={PREDICTION_CSS.DASHBOARD_HEADER}>
                <h2>📊 예측 기반 경과 모니터링</h2>
                <button className="btn btn-secondary" onClick={loadPredictionData}>
                    🔄 새로고침
                </button>
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
