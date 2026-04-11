/**
 * 예측 모니터링 API 엔드포인트 상수
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2026-01-21
 */

const BASE_PATH = '/api/v1/predictions';

export const PREDICTION_API = {
    // 치료 경과 예측
    PREDICT_TREATMENT: (clientId) => `${BASE_PATH}/treatment-outcome/${clientId}`,

    // 중도 탈락 위험
    ASSESS_DROPOUT_RISK: (clientId) => `${BASE_PATH}/dropout-risk/${clientId}`,

    // 회기 수 추천
    RECOMMEND_SESSIONS: (clientId) => `${BASE_PATH}/recommend-sessions/${clientId}`,

    // 유사 케이스
    FIND_SIMILAR_CASES: (clientId) => `${BASE_PATH}/similar-cases/${clientId}`
};

export default PREDICTION_API;
