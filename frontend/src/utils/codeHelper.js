import { apiGet } from './ajax';

/**
 * 공통코드 관련 유틸리티 함수들
 * 하드코딩된 값들을 동적으로 처리하기 위한 헬퍼 함수들
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-14
 */

// 코드그룹 메타데이터 캐시
let groupMetadataCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * 코드그룹 메타데이터 로드 (캐시 적용)
 */
export const loadCodeGroupMetadata = async () => {
    const now = Date.now();
    
    // 캐시가 유효한 경우 캐시된 데이터 반환
    if (groupMetadataCache && (now - lastCacheTime) < CACHE_DURATION) {
        return groupMetadataCache;
    }
    
    try {
        const response = await apiGet('/api/admin/common-codes/group-metadata');
        if (response.success && response.data) {
            groupMetadataCache = response.data;
            lastCacheTime = now;
            return groupMetadataCache;
        }
    } catch (error) {
        console.error('코드그룹 메타데이터 로드 실패:', error);
    }
    
    // API 실패 시 빈 배열 반환
    return [];
};

/**
 * 코드그룹 한글명 조회 (동적)
 */
export const getCodeGroupKoreanName = async (groupName) => {
    try {
        // 캐시에서 먼저 확인
        if (groupMetadataCache) {
            const metadata = groupMetadataCache.find(item => item.groupName === groupName);
            if (metadata) {
                return metadata.koreanName;
            }
        }
        
        // 캐시에 없으면 API 호출
        const response = await apiGet(`/api/admin/common-codes/group/${groupName}/korean-name`);
        if (response.success && response.data) {
            return response.data.koreanName;
        }
    } catch (error) {
        console.error('코드그룹 한글명 조회 실패:', error);
    }
    
    // 실패 시 원본 그룹명 반환
    return groupName;
};

/**
 * 코드그룹 아이콘 조회 (동적)
 */
export const getCodeGroupIcon = async (groupName) => {
    try {
        if (groupMetadataCache) {
            const metadata = groupMetadataCache.find(item => item.groupName === groupName);
            if (metadata && metadata.icon) {
                return metadata.icon;
            }
        }
        
        const response = await apiGet(`/api/admin/common-codes/group/${groupName}/korean-name`);
        if (response.success && response.data && response.data.icon) {
            return response.data.icon;
        }
    } catch (error) {
        console.error('코드그룹 아이콘 조회 실패:', error);
    }
    
    // 기본 아이콘 반환
    return '📁';
};

/**
 * 코드그룹 색상 조회 (동적)
 */
export const getCodeGroupColor = async (groupName) => {
    try {
        if (groupMetadataCache) {
            const metadata = groupMetadataCache.find(item => item.groupName === groupName);
            if (metadata && metadata.colorCode) {
                return metadata.colorCode;
            }
        }
        
        const response = await apiGet(`/api/admin/common-codes/group/${groupName}/korean-name`);
        if (response.success && response.data && response.data.colorCode) {
            return response.data.colorCode;
        }
    } catch (error) {
        console.error('코드그룹 색상 조회 실패:', error);
    }
    
    // 기본 색상 반환
    return '#007bff';
};

/**
 * 상태별 색상 조회 (동적)
 */
export const getStatusColor = async (codeValue, groupName) => {
    try {
        const response = await apiGet(`/api/admin/common-codes/group/${groupName}/display-options`);
        if (response.success && response.data && response.data.codes) {
            const code = response.data.codes.find(c => c.codeValue === codeValue);
            if (code && code.colorCode) {
                return code.colorCode;
            }
        }
    } catch (error) {
        console.error('상태별 색상 조회 실패:', error);
    }
    
    // 기본 색상 매핑 (fallback)
    const defaultColorMap = {
        'AVAILABLE': '#e5e7eb',
        'BOOKED': '#3b82f6',
        'CONFIRMED': '#8b5cf6',
        'IN_PROGRESS': '#f59e0b',
        'COMPLETED': '#10b981',
        'CANCELLED': '#ef4444',
        'BLOCKED': '#6b7280',
        'UNDER_REVIEW': '#f97316',
        'VACATION': '#06b6d4',
        'NO_SHOW': '#dc2626',
        'ACTIVE': '#10b981',
        'INACTIVE': '#ef4444',
        'true': '#10b981',
        'false': '#ef4444'
    };
    
    return defaultColorMap[codeValue] || '#6b7280';
};

/**
 * 상태별 아이콘 조회 (동적)
 */
export const getStatusIcon = async (codeValue, groupName) => {
    try {
        const response = await apiGet(`/api/admin/common-codes/group/${groupName}/display-options`);
        if (response.success && response.data && response.data.codes) {
            const code = response.data.codes.find(c => c.codeValue === codeValue);
            if (code && code.icon) {
                return code.icon;
            }
        }
    } catch (error) {
        console.error('상태별 아이콘 조회 실패:', error);
    }
    
    // 기본 아이콘 매핑 (fallback)
    const defaultIconMap = {
        'AVAILABLE': '⚪',
        'BOOKED': '📅',
        'CONFIRMED': '✅',
        'IN_PROGRESS': '🔄',
        'COMPLETED': '🎉',
        'CANCELLED': '❌',
        'BLOCKED': '🚫',
        'UNDER_REVIEW': '🔍',
        'VACATION': '🏖️',
        'NO_SHOW': '👻',
        'ACTIVE': '✅',
        'INACTIVE': '❌',
        'true': '✅',
        'false': '❌'
    };
    
    return defaultIconMap[codeValue] || '📋';
};

/**
 * 코드그룹별 표시 옵션 조회 (색상, 아이콘 등)
 */
export const getCodeGroupDisplayOptions = async (groupName) => {
    try {
        const response = await apiGet(`/api/admin/common-codes/group/${groupName}/display-options`);
        if (response.success && response.data) {
            return response.data;
        }
    } catch (error) {
        console.error('코드그룹 표시 옵션 조회 실패:', error);
    }
    
    return null;
};

/**
 * 캐시 초기화 (메타데이터 변경 시 호출)
 */
export const clearCodeGroupCache = () => {
    groupMetadataCache = null;
    lastCacheTime = 0;
};

/**
 * 동기식 코드그룹 한글명 조회 (캐시된 데이터 사용)
 */
export const getCodeGroupKoreanNameSync = (groupName) => {
    if (groupMetadataCache) {
        const metadata = groupMetadataCache.find(item => item.groupName === groupName);
        if (metadata) {
            return metadata.koreanName;
        }
    }
    return groupName;
};

/**
 * 동기식 코드그룹 아이콘 조회 (캐시된 데이터 사용)
 */
export const getCodeGroupIconSync = (groupName) => {
    if (groupMetadataCache) {
        const metadata = groupMetadataCache.find(item => item.groupName === groupName);
        if (metadata && metadata.icon) {
            return metadata.icon;
        }
    }
    return '📁';
};
