/**
 * 상담사 교육 API 엔드포인트 상수
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2026-01-21
 */

const BASE_PATH = '/api/v1/training';

export const TRAINING_API = {
    // 세션 분석
    ANALYZE_SESSION: (recordId) => `${BASE_PATH}/analyze-session/${recordId}`,

    // 가상 내담자
    CREATE_VIRTUAL_CLIENT: `${BASE_PATH}/virtual-client/create`,
    SEND_MESSAGE: (sessionId) => `${BASE_PATH}/virtual-client/${sessionId}/message`,
    COMPLETE_SESSION: (sessionId) => `${BASE_PATH}/virtual-client/${sessionId}/complete`,

    // 피드백
    GET_FEEDBACK: (consultantId) => `${BASE_PATH}/feedback/${consultantId}`,
};

export default TRAINING_API;
