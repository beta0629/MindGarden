/**
 * 상담사/내담자 통합 데이터 관리 유틸리티
 * - 중앙화된 데이터 조회
 * - 캐시 활용으로 성능 최적화
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-20
 */

import { apiGet } from './ajax';

/**
 * 상담사 정보 + 통계 정보 통합 조회
 * 
 * @param {number} consultantId 상담사 ID
 * @returns {Promise<Object|null>} 상담사 정보 + 통계 정보
 */
export const getConsultantWithStats = async (consultantId) => {
    try {
        const response = await apiGet(`/api/admin/consultants/with-stats/${consultantId}`);
        if (response.success) {
            return response.data;
        }
        console.error('상담사 통계 조회 실패:', response.message);
        return null;
    } catch (error) {
        console.error('상담사 통계 조회 중 오류:', error);
        return null;
    }
};

/**
 * 전체 상담사 목록 + 통계 정보 조회
 * 
 * @returns {Promise<Array>} 상담사 목록 + 통계 정보
 */
export const getAllConsultantsWithStats = async () => {
    try {
        const response = await apiGet('/api/admin/consultants/with-stats');
        if (response.success) {
            return response.data || [];
        }
        console.error('전체 상담사 통계 조회 실패:', response.message);
        return [];
    } catch (error) {
        console.error('전체 상담사 통계 조회 중 오류:', error);
        return [];
    }
};

/**
 * 상담사 클라이언트 수 포맷팅
 * 
 * @param {Object} consultant 상담사 정보
 * @returns {string} 포맷된 클라이언트 수 (예: "5/10명")
 */
export const formatConsultantClientCount = (consultant) => {
    const current = consultant.currentClients || 0;
    const max = consultant.maxClients || 0;
    
    if (max > 0) {
        return `${current}/${max}명`;
    }
    return `${current}명`;
};

/**
 * 상담사 통계 요약 정보 추출
 * 
 * @param {Object} consultant 상담사 정보
 * @returns {Object} 통계 요약 정보
 */
export const getConsultantStatsSummary = (consultant) => {
    const stats = consultant.statistics || {};
    
    return {
        totalSessions: stats.totalSessions || 0,
        completedSessions: stats.completedSessions || 0,
        completionRate: stats.completionRate || 0,
        averageRating: stats.averageRating || 0,
        totalRatings: stats.totalRatings || 0,
        currentClients: consultant.currentClients || 0,
        maxClients: consultant.maxClients || 0
    };
};

/**
 * 캐시 활용을 위한 데이터 변환
 * 
 * @param {Object} consultantRaw 서버 응답 데이터
 * @returns {Object} 변환된 상담사 정보
 */
export const transformConsultantData = (consultantRaw) => {
    if (!consultantRaw) return null;
    
    // 이미 변환된 데이터면 그대로 반환
    if (consultantRaw.currentClients !== undefined) {
        return consultantRaw;
    }
    
    // 변환 필요 시 변환
    return {
        ...consultantRaw,
        currentClients: consultantRaw.currentClients || 0,
        maxClients: consultantRaw.maxClients || 0,
        totalClients: consultantRaw.totalClients || 0,
        statistics: consultantRaw.statistics || {}
    };
};

// ========================================
// 내담자 통합 API
// ========================================

/**
 * 내담자 정보 + 통계 정보 통합 조회
 * 
 * @param {number} clientId 내담자 ID
 * @returns {Promise<Object|null>} 내담자 정보 + 통계 정보
 */
export const getClientWithStats = async (clientId) => {
    try {
        const response = await apiGet(`/api/admin/clients/with-stats/${clientId}`);
        if (response.success) {
            return response.data;
        }
        console.error('내담자 통계 조회 실패:', response.message);
        return null;
    } catch (error) {
        console.error('내담자 통계 조회 중 오류:', error);
        return null;
    }
};

/**
 * 전체 내담자 목록 + 통계 정보 조회
 * 
 * @returns {Promise<Array>} 내담자 목록 + 통계 정보
 */
export const getAllClientsWithStats = async () => {
    try {
        const response = await apiGet('/api/admin/clients/with-stats');
        if (response.success) {
            return response.data || [];
        }
        console.error('전체 내담자 통계 조회 실패:', response.message);
        return [];
    } catch (error) {
        console.error('전체 내담자 통계 조회 중 오류:', error);
        return [];
    }
};
