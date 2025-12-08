/**
 * 상담사/내담자 통합 데이터 관리 유틸리티
/**
 * - 중앙화된 데이터 조회
/**
 * - 캐시 활용으로 성능 최적화
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2025-01-20
 */

import { apiGet } from './ajax';

/**
 * 상담사 등급별 색상/아이콘 정보 조회
/**
 * 
/**
 * @returns {Promise<Object>} 등급별 스타일 정보
 */
export const getConsultantGradeStyles = async () => {
    try {
        // 표준 API 사용: /api/v1/common-codes?codeGroup=CONSULTANT_GRADE
        const { getCommonCodes } = await import('./commonCodeApi');
        const codes = await getCommonCodes('CONSULTANT_GRADE');
        
        if (codes && Array.isArray(codes) && codes.length > 0) {
            const gradeStyles = {};
            codes.forEach(code => {
                gradeStyles[code.codeValue] = {
                    color: code.colorCode || 'var(--mg-gray-500)',
                    icon: code.icon || '⭐',
                    label: code.codeLabel || code.koreanName,
                    description: code.codeDescription
                };
            });
            return gradeStyles;
        }
        return {};
    } catch (error) {
        console.warn('상담사 등급 스타일 조회 실패, 기본값 사용:', error);
        return {
            'CONSULTANT_JUNIOR': { color: 'var(--mg-warning-500)', icon: '⭐', label: '주니어 상담사' },
            'CONSULTANT_SENIOR': { color: 'var(--mg-warning-500)', icon: '⭐⭐', label: '시니어 상담사' },
            'CONSULTANT_EXPERT': { color: 'var(--mg-warning-500)', icon: '⭐⭐⭐', label: '엑스퍼트 상담사' },
            'CONSULTANT_MASTER': { color: 'var(--mg-error-600)', icon: '👑', label: '마스터 상담사' }
        };
    }
};

/**
 * 상담사 정보 + 통계 정보 통합 조회
/**
 * 
/**
 * @param {number} consultantId 상담사 ID
/**
 * @returns {Promise<Object|null>} 상담사 정보 + 통계 정보
 */
export const getConsultantWithStats = async (consultantId) => {
    try {
        const response = await apiGet(`/api/v1/admin/consultants/with-stats/${consultantId}`);
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
/**
 * 
/**
 * @returns {Promise<Array>} 상담사 목록 + 통계 정보
 */
import StandardizedApi from './standardizedApi';

export const getAllConsultantsWithStats = async () => {
    try {
        // 세션 갱신을 통해 최신 tenantId 확보 (API 호출 전 필수)
        // 대시보드는 fetch() 직접 사용으로 세션 쿠키가 자동 포함되지만,
        // StandardizedApi 사용 시 명시적으로 세션 확인 필요
        if (typeof window !== 'undefined' && window.sessionManager) {
            let user = window.sessionManager.getUser();
            let tenantId = user?.tenantId || window.sessionManager.getSessionInfo()?.tenantId;
            
            // tenantId가 없거나 기본값이면 강제 세션 갱신
            const tenantIdTrimmed = tenantId ? tenantId.trim() : '';
            const isInvalidDefault = !tenantId || 
                tenantIdTrimmed === 'unknown' || tenantIdTrimmed === 'default' ||
                tenantIdTrimmed.startsWith('unknown-') || tenantIdTrimmed.startsWith('default-') ||
                tenantIdTrimmed === 'tenant-unknown' || tenantIdTrimmed === 'tenant-default';
            
            if (isInvalidDefault) {
                console.warn('⚠️ getAllConsultantsWithStats: tenantId 없음 - 세션 강제 갱신');
                await window.sessionManager.checkSession(true);
                
                // 갱신 후 다시 확인
                user = window.sessionManager.getUser();
                tenantId = user?.tenantId || window.sessionManager.getSessionInfo()?.tenantId;
                
                // 여전히 없거나 기본값이면 에러 반환 (빈 배열 대신)
                const retryTenantIdTrimmed = tenantId ? tenantId.trim() : '';
                const isRetryInvalidDefault = !tenantId || 
                    retryTenantIdTrimmed === 'unknown' || retryTenantIdTrimmed === 'default' ||
                    retryTenantIdTrimmed.startsWith('unknown-') || retryTenantIdTrimmed.startsWith('default-') ||
                    retryTenantIdTrimmed === 'tenant-unknown' || retryTenantIdTrimmed === 'tenant-default';
                
                if (isRetryInvalidDefault) {
                    console.error('❌ getAllConsultantsWithStats: tenantId를 가져올 수 없습니다.', {
                        userId: user?.id,
                        email: user?.email,
                        role: user?.role
                    });
                    throw new Error('tenantId를 가져올 수 없습니다. 세션을 확인해주세요.');
                }
            }
            
            console.log('✅ getAllConsultantsWithStats: tenantId 확인 완료, API 호출:', tenantId);
        }
        
        // 표준화된 API 호출 사용
        const response = await StandardizedApi.get('/api/v1/admin/consultants/with-stats');
        
        // 응답 구조: { success: true, data: { consultants: [...], count: N } }
        const consultantsList = response?.consultants || response?.data?.consultants || response?.data || [];
        console.log('✅ getAllConsultantsWithStats: 상담사 목록 조회 성공, count:', consultantsList.length);
        return Array.isArray(consultantsList) ? consultantsList : [];
    } catch (error) {
        console.error('❌ 전체 상담사 통계 조회 중 오류:', error);
        
        // 400 오류이고 tenantId 문제일 가능성이 있으면 세션 갱신 후 재시도
        if (error.message && (error.message.includes('400') || error.message.includes('Bad Request'))) {
            console.warn('⚠️ 400 오류 감지 - 세션 갱신 후 재시도');
            try {
                if (typeof window !== 'undefined' && window.sessionManager) {
                    await window.sessionManager.checkSession(true);
                    // 재시도
                    const retryResponse = await StandardizedApi.get('/api/v1/admin/consultants/with-stats');
                    const retryList = retryResponse?.consultants || retryResponse?.data?.consultants || retryResponse?.data || [];
                    console.log('✅ 재시도 성공, count:', retryList.length);
                    return Array.isArray(retryList) ? retryList : [];
                }
            } catch (retryError) {
                console.error('❌ 재시도도 실패:', retryError);
            }
        }
        
        return [];
    }
};

/**
 * 상담사 클라이언트 수 포맷팅
/**
 * 
/**
 * @param {Object} consultant 상담사 정보
/**
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
/**
 * 
/**
 * @param {Object} consultant 상담사 정보
/**
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
/**
 * 
/**
 * @param {Object} consultantRaw 서버 응답 데이터
/**
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
/**
 * 
/**
 * @param {number} clientId 내담자 ID
/**
 * @returns {Promise<Object|null>} 내담자 정보 + 통계 정보
 */
export const getClientWithStats = async (clientId) => {
    try {
        // 표준화 2025-12-08: API 경로 수정 (/api/v1/admin)
        const response = await apiGet(`/api/v1/admin/clients/with-stats/${clientId}`);
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
/**
 * 
/**
 * @returns {Promise<Array>} 내담자 목록 + 통계 정보
 */
export const getAllClientsWithStats = async () => {
    try {
        // 표준화 2025-12-08: API 경로 수정 (/api/v1/admin)
        const response = await apiGet('/api/v1/admin/clients/with-stats');
        
        // apiGet이 ApiResponse의 data만 추출하므로, response는 { clients: [...], count: N } 형태
        if (response && (response.clients || Array.isArray(response))) {
            const clientsList = response.clients || response;
            return Array.isArray(clientsList) ? clientsList : [];
        }
        console.error('전체 내담자 통계 조회 실패: 응답이 올바르지 않음', response);
        return [];
    } catch (error) {
        console.error('전체 내담자 통계 조회 중 오류:', error);
        return [];
    }
};
