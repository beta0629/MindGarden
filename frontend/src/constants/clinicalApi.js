/**
 * 임상 문서 자동화 API 엔드포인트 상수
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2026-01-21
 */

const BASE_PATH = '/api/v1/clinical-automation';

export const CLINICAL_API = {
    // 음성 파일 업로드
    UPLOAD_AUDIO: (consultationId) => `${BASE_PATH}/consultations/${consultationId}/upload-audio`,

    // 전사 상태 확인
    TRANSCRIPTION_STATUS: (audioFileId) => `${BASE_PATH}/audio-files/${audioFileId}/transcription-status`,

    // SOAP 노트 생성
    GENERATE_SOAP: (recordId) => `${BASE_PATH}/consultation-records/${recordId}/generate-soap`,

    // DAP 노트 생성
    GENERATE_DAP: (recordId) => `${BASE_PATH}/consultation-records/${recordId}/generate-dap`,

    // 진단 보고서 생성
    GENERATE_DIAGNOSTIC: (recordId) => `${BASE_PATH}/consultation-records/${recordId}/generate-diagnostic-report`,

    // 위험 징후 분석
    ANALYZE_RISKS: (recordId) => `${BASE_PATH}/consultation-records/${recordId}/analyze-risks`,

    // 보고서 조회
    GET_REPORT: (reportId) => `${BASE_PATH}/clinical-reports/${reportId}`,

    // 보고서 목록 조회
    GET_REPORTS: (recordId) => `${BASE_PATH}/consultation-records/${recordId}/reports`,

    // 보고서 수정
    UPDATE_REPORT: (reportId) => `${BASE_PATH}/clinical-reports/${reportId}`,

    // 보고서 승인
    APPROVE_REPORT: (reportId) => `${BASE_PATH}/clinical-reports/${reportId}/approve`
};

export default CLINICAL_API;
