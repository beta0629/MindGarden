/**
 * 멀티모달 감정 분석 API 엔드포인트 상수
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */

const BASE_PATH = '/api/v1/emotion-analysis';

export const EMOTION_API = {
    // 음성 바이오마커 분석
    ANALYZE_VOICE: (audioFileId) => `${BASE_PATH}/voice/${audioFileId}`,

    // 비디오 감정 분석
    ANALYZE_VIDEO: (recordId) => `${BASE_PATH}/video/${recordId}`,

    // 텍스트 감정 분석
    ANALYZE_TEXT: (recordId) => `${BASE_PATH}/text/${recordId}`,

    // 멀티모달 통합 리포트
    GENERATE_MULTIMODAL: (recordId) => `${BASE_PATH}/multimodal/${recordId}`,
    GET_MULTIMODAL: (reportId) => `${BASE_PATH}/multimodal/${reportId}`,

    // 감정 변화 추이
    GET_EMOTION_TREND: (clientId) => `${BASE_PATH}/trend/${clientId}`,
    TRACK_EMOTION: (clientId) => `${BASE_PATH}/track/${clientId}`,
};

export default EMOTION_API;
