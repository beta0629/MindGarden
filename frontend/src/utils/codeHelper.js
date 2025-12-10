import { apiGet } from './ajax';

/**
 * 하드코딩된 값들을 동적으로 처리하기 위한 헬퍼 함수들
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2025-09-14
 */

let groupMetadataCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * 코드그룹 메타데이터 로드 (캐시 적용)
 */
export const loadCodeGroupMetadata = async () => {
    const now = Date.now();
    
    if (groupMetadataCache && (now - lastCacheTime) < CACHE_DURATION) {
        return groupMetadataCache;
    }
    
    try {
        const { getCodeGroups } = await import('./commonCodeApi');
        let groups = [];
        try {
            groups = await getCodeGroups();
        } catch (error) {
            const response = await apiGet('/api/v1/common-codes/groups/list');
            groups = Array.isArray(response) ? response : [];
        }
        
        if (groups && groups.length > 0) {
            groupMetadataCache = groups.map(groupCode => ({
                codeGroup: groupCode,
                koreanName: getCodeGroupKoreanNameSync(groupCode),
                icon: getCodeGroupIconSync(groupCode)
            }));
            lastCacheTime = now;
            return groupMetadataCache;
        }
    } catch (error) {
        console.error('코드그룹 메타데이터 로드 실패:', error);
    }
    
    return [];
};

/**
 * 코드그룹 한글명 조회 (동적)
 */
export const getCodeGroupKoreanName = async (groupName) => {
    try {
        if (groupMetadataCache) {
            const metadata = groupMetadataCache.find(item => item.groupName === groupName);
            if (metadata) {
                return metadata.koreanName;
            }
        }
        
        // 표준화 2025-12-08: 올바른 API 경로 사용
        const response = await apiGet(`/api/v1/common-codes/groups/${groupName}`);
        if (response && response.length > 0) {
            return response[0].koreanName || groupName;
        }
    } catch (error) {
        console.error('코드그룹 한글명 조회 실패:', error);
    }
    
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
        
        // 표준화 2025-12-08: 올바른 API 경로 사용
        const response = await apiGet(`/api/v1/common-codes/groups/${groupName}`);
        if (response && response.length > 0) {
            return response[0].icon || '📋';
        }
    } catch (error) {
        console.error('코드그룹 아이콘 조회 실패:', error);
    }
    
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
        
        // 표준화 2025-12-08: 올바른 API 경로 사용
        const response = await apiGet(`/api/v1/common-codes/groups/${groupName}`);
        if (response && response.length > 0) {
            return response[0].colorCode || 'var(--mg-secondary-500)';
        }
    } catch (error) {
        console.error('코드그룹 색상 조회 실패:', error);
    }
    
    return 'var(--mg-primary-500)';
};

/**
 * 상태별 색상 조회 (동기 버전 - fallback 사용)
/**
 * @deprecated - getStatusColorAsync 사용 권장
 */
export const getStatusColorSync = (codeValue) => {
    if (!codeValue) {
        return 'var(--mg-gray-500)';
    }
    
    const defaultColorMap = {
        'true': 'var(--mg-success-500)',
        'false': 'var(--mg-error-500)'
    };
    
    return defaultColorMap[codeValue] || 'var(--mg-gray-500)';
};

/**
 * 상태별 아이콘 조회 (동적)
 */
export const getStatusIcon = async (codeValue, groupName = 'STATUS') => {
    if (!codeValue) {
        return '📋';
    }
    
    try {
        // 표준화 2025-12-08: 올바른 API 경로 사용
        const response = await apiGet(`/api/v1/common-codes/groups/${groupName}`);
        if (response && response.length > 0) {
            let code = response.find(c => c.codeValue === codeValue);
            
            if (!code && groupName === 'MAPPING_STATUS') {
                const statusMapping = {
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                    'ACTIVE': 'ACTIVE_MAPPING',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                    'INACTIVE': 'INACTIVE_MAPPING',
                    'TERMINATED': 'TERMINATED_MAPPING',
                    'SESSIONS_EXHAUSTED': 'SESSIONS_EXHAUSTED_MAPPING'
                };
                
                const mappedStatus = statusMapping[codeValue];
                if (mappedStatus) {
                    code = response.find(c => c.codeValue === mappedStatus);
                }
            }
            
            if (code && code.icon) {
                return code.icon;
            }
        }
    } catch (error) {
        console.error('아이콘 조회 실패, fallback 사용:', error);
    }
    
    const defaultIconMap = {
        'AVAILABLE': '⚪',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'BOOKED': '📅',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'CONFIRMED': '✅',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'IN_PROGRESS': '🔄',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'COMPLETED': '🎉',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'CANCELLED': '❌',
        'BLOCKED': '🚫',
        'UNDER_REVIEW': '🔍',
        'VACATION': '🏖️',
        'NO_SHOW': '👻',
        'MAINTENANCE': '🔧',
        
        'PENDING_PAYMENT': '⏳',
        'PAYMENT_CONFIRMED': '💰',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'ACTIVE': '✅',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'INACTIVE': '⏸️',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'SUSPENDED': '⏸️',
        'TERMINATED': '❌',
        'SESSIONS_EXHAUSTED': '🔚',
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'PENDING': '⏳',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'APPROVED': '✅',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'REJECTED': '❌',
        'PAYMENT_PENDING': '⏳',
        'PAYMENT_REJECTED': '❌',
        
        'true': '✅',
        'false': '❌'
    };
    
    return defaultIconMap[codeValue] || '📋';
};

/**
 * 상태별 색상과 아이콘을 함께 조회 (동적)
 */
export const getStatusStyle = async (codeValue, groupName = 'STATUS') => {
    if (!codeValue) {
        return { color: '#6b7280', icon: '📋' };
    }
    
    try {
        // 표준화 2025-12-08: 올바른 API 경로 사용
        const response = await apiGet(`/api/v1/common-codes/groups/${groupName}`);
        if (response && Array.isArray(response)) {
            const code = response.find(c => c.codeValue === codeValue);
            if (code) {
                return {
                    color: code.colorCode || '#6b7280',
                    icon: code.icon || '📋'
                };
            }
        }
    } catch (error) {
        console.warn('상태 스타일 조회 실패, fallback 사용:', error);
    }
    
    return {
        color: getStatusColorSync(codeValue),
        icon: '📋'
    };
};

/**
 * 상태별 색상 조회 (동적)
 */
export const getStatusColor = async (codeValue, groupName) => {
    try {
        // 표준화 2025-12-08: 올바른 API 경로 사용
        const response = await apiGet(`/api/v1/common-codes/groups/${groupName}`);
        if (response && response.length > 0) {
            let code = response.find(c => c.codeValue === codeValue);
            
            if (!code && groupName === 'MAPPING_STATUS') {
                const statusMapping = {
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                    'ACTIVE': 'ACTIVE_MAPPING',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                    'INACTIVE': 'INACTIVE_MAPPING',
                    'TERMINATED': 'TERMINATED_MAPPING',
                    'SESSIONS_EXHAUSTED': 'SESSIONS_EXHAUSTED_MAPPING'
                };
                
                const mappedStatus = statusMapping[codeValue];
                if (mappedStatus) {
                    code = response.find(c => c.codeValue === mappedStatus);
                }
            }
            
            if (code && code.colorCode) {
                return code.colorCode;
            }
        }
    } catch (error) {
        console.error('상태별 색상 조회 실패:', error);
    }
    
    const defaultColorMap = {
        'AVAILABLE': 'var(--mg-gray-200)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'BOOKED': 'var(--mg-primary-500)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'CONFIRMED': 'var(--mg-purple-500)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'IN_PROGRESS': 'var(--mg-warning-500)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'COMPLETED': 'var(--mg-success-500)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'CANCELLED': 'var(--mg-error-500)',
        'BLOCKED': 'var(--mg-gray-500)',
        'UNDER_REVIEW': 'var(--mg-warning-500)',
        'VACATION': 'var(--mg-info-500)',
        'NO_SHOW': 'var(--mg-error-600)',
        'MAINTENANCE': 'var(--mg-gray-500)',
        
        'PENDING_PAYMENT': 'var(--mg-warning-500)',
        'PAYMENT_CONFIRMED': 'var(--mg-info-500)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'ACTIVE': 'var(--mg-success-500)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'INACTIVE': 'var(--mg-secondary-500)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'SUSPENDED': 'var(--mg-warning-600)',
        'TERMINATED': 'var(--mg-error-500)',
        'SESSIONS_EXHAUSTED': 'var(--mg-primary-700)',
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'PENDING': 'var(--mg-gray-500)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'APPROVED': 'var(--mg-success-500)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'REJECTED': 'var(--mg-error-500)',
        'PAYMENT_PENDING': 'var(--mg-warning-500)',
        'PAYMENT_REJECTED': 'var(--mg-error-500)',
        
        'true': 'var(--mg-success-500)',
        'false': 'var(--mg-error-500)'
    };
    
    return defaultColorMap[codeValue] || 'var(--mg-gray-500)';
};

/**
 * 코드그룹별 표시 옵션 조회 (색상, 아이콘 등)
 */
export const getCodeGroupDisplayOptions = async (groupName) => {
    try {
        // 표준화 2025-12-08: 올바른 API 경로 사용
        const response = await apiGet(`/api/v1/common-codes/groups/${groupName}`);
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

/**
 * 사용자 상태 한글명 조회 (동적)
 */
export const getUserStatusKoreanName = async (status) => {
    try {
        // 표준화 2025-12-08: 올바른 API 경로 사용
        const response = await apiGet(`/api/v1/common-codes/groups/STATUS`);
        if (response.success && response.data && response.data.codes) {
            const code = response.data.codes.find(c => c.codeValue === status);
            if (code && code.codeLabel) {
                return code.codeLabel;
            }
        }
    } catch (error) {
        console.error('사용자 상태 한글명 조회 실패:', error);
    }
    
    const defaultStatusMap = {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'ACTIVE': '활성',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'INACTIVE': '비활성',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'SUSPENDED': '일시정지',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'COMPLETED': '완료',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'PENDING': '대기중',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'APPROVED': '승인됨',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'REJECTED': '거부됨',
        'PAYMENT_CONFIRMED': '결제확인',
        'PAYMENT_PENDING': '결제대기',
        'PAYMENT_REJECTED': '결제거부',
        'TERMINATED': '종료됨'
    };
    
    return defaultStatusMap[status] || status;
};

/**
 * 사용자 상태 한글명 조회 (동기 버전 - 기본값만 사용)
 */
export const getUserStatusKoreanNameSync = (status) => {
    const defaultStatusMap = {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'ACTIVE': '활성',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'INACTIVE': '비활성',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'PENDING': '대기',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'SUSPENDED': '정지',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'DELETED': '삭제됨',
        'PENDING_APPROVAL': '승인대기',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'APPROVED': '승인됨',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'REJECTED': '거부됨'
    };
    
    return defaultStatusMap[status] || status;
};

/**
 * 사용자 등급 한글명 조회 (동적)
 */
export const getUserGradeKoreanName = async (grade) => {
    try {
        const response = await apiGet(`/api/admin/common-codes/USER_GRADE/display-options`);
        if (response.success && response.data && response.data.codes) {
            const code = response.data.codes.find(c => c.codeValue === grade);
            if (code && code.codeLabel) {
                return code.codeLabel;
            }
        }
    } catch (error) {
        console.error('사용자 등급 한글명 조회 실패:', error);
    }
    
    const defaultGradeMap = {
        'CLIENT_BRONZE': '브론즈',
        'CLIENT_SILVER': '실버',
        'CLIENT_GOLD': '골드',
        'CLIENT_PLATINUM': '플래티넘',
        'CLIENT_DIAMOND': '다이아몬드',
        'CONSULTANT_JUNIOR': '주니어',
        'CONSULTANT_SENIOR': '시니어',
        'CONSULTANT_EXPERT': '전문가',
        'ADMIN': '관리자',
        'BRANCH_SUPER_ADMIN': '수퍼관리자',
        'HQ_ADMIN': '본사 관리자',
        'SUPER_HQ_ADMIN': '본사 수퍼 관리자',
        'HQ_MASTER': '본사 총관리자'
    };
    
    return defaultGradeMap[grade] || grade || '브론즈';
};

/**
 * 사용자 등급 한글명 조회 (동기 버전 - 기본값만 사용)
 */
export const getUserGradeKoreanNameSync = (grade) => {
    const defaultGradeMap = {
        'CLIENT_BRONZE': '브론즈',
        'CLIENT_SILVER': '실버',
        'CLIENT_GOLD': '골드',
        'CLIENT_PLATINUM': '플래티넘',
        'CLIENT_DIAMOND': '다이아몬드',
        'CONSULTANT_JUNIOR': '주니어',
        'CONSULTANT_SENIOR': '시니어',
        'CONSULTANT_EXPERT': '전문가',
        'ADMIN': '관리자',
        'BRANCH_SUPER_ADMIN': '수퍼관리자',
        'HQ_ADMIN': '본사 관리자',
        'SUPER_HQ_ADMIN': '본사 수퍼 관리자',
        'HQ_MASTER': '본사 총관리자'
    };
    
    return defaultGradeMap[grade] || grade || '브론즈';
};

/**
 * 사용자 등급 아이콘 조회 (동적)
 */
export const getUserGradeIcon = async (grade) => {
    try {
        const response = await apiGet(`/api/admin/common-codes/USER_GRADE/display-options`);
        if (response.success && response.data && response.data.codes) {
            const code = response.data.codes.find(c => c.codeValue === grade);
            if (code && code.icon) {
                return code.icon;
            }
        }
    } catch (error) {
        console.error('사용자 등급 아이콘 조회 실패:', error);
    }
    
    const defaultGradeIconMap = {
        'CLIENT_BRONZE': '🥉',
        'CLIENT_SILVER': '🥈',
        'CLIENT_GOLD': '🥇',
        'CLIENT_PLATINUM': '💎',
        'CLIENT_DIAMOND': '💠',
        'CONSULTANT_JUNIOR': '⭐',
        'CONSULTANT_SENIOR': '⭐⭐',
        'CONSULTANT_EXPERT': '⭐⭐⭐',
        'ADMIN': '👑',
        'BRANCH_SUPER_ADMIN': '👑👑',
        'HQ_ADMIN': '🏢',
        'SUPER_HQ_ADMIN': '🏢👑',
        'HQ_MASTER': '👑🏢'
    };
    
    return defaultGradeIconMap[grade] || '🥉';
};

/**
 * 사용자 등급 아이콘 조회 (동기 버전 - 기본값만 사용)
 */
export const getUserGradeIconSync = (grade) => {
    const defaultGradeIconMap = {
        'CLIENT_BRONZE': '🥉',
        'CLIENT_SILVER': '🥈',
        'CLIENT_GOLD': '🥇',
        'CLIENT_PLATINUM': '💎',
        'CLIENT_DIAMOND': '💠',
        'CONSULTANT_JUNIOR': '⭐',
        'CONSULTANT_SENIOR': '⭐⭐',
        'CONSULTANT_EXPERT': '⭐⭐⭐',
        'ADMIN': '👑',
        'BRANCH_SUPER_ADMIN': '👑👑',
        'HQ_ADMIN': '🏢',
        'SUPER_HQ_ADMIN': '🏢👑',
        'HQ_MASTER': '👑🏢'
    };
    
    return defaultGradeIconMap[grade] || '👤';
};

/**
 * 매칭 상태 한글명 조회 (동적)
 */
export const getMappingStatusKoreanName = async (status) => {
    try {
        // 표준화 2025-12-08: 올바른 API 경로 사용
        const response = await apiGet(`/api/v1/common-codes/groups/MAPPING_STATUS`);
        if (response && response.length > 0) {
            let code = response.find(c => c.codeValue === status);
            
            if (!code) {
                const statusMapping = {
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                    'ACTIVE': 'ACTIVE_MAPPING',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                    'INACTIVE': 'INACTIVE_MAPPING',
                    'TERMINATED': 'TERMINATED_MAPPING',
                    'SESSIONS_EXHAUSTED': 'SESSIONS_EXHAUSTED_MAPPING'
                };
                
                const mappedStatus = statusMapping[status];
                if (mappedStatus) {
                    code = response.find(c => c.codeValue === mappedStatus);
                }
            }
            
            if (code && code.codeLabel) {
                return code.codeLabel;
            }
        }
    } catch (error) {
        console.error('매칭 상태 한글명 조회 실패:', error);
    }
    
    const defaultMappingStatusMap = {
        'PENDING_PAYMENT': '결제 대기',
        'PAYMENT_CONFIRMED': '결제 확인',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'ACTIVE': '활성',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'INACTIVE': '비활성',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'SUSPENDED': '일시정지',
        'TERMINATED': '종료됨',
        'SESSIONS_EXHAUSTED': '회기 소진'
    };
    
    return defaultMappingStatusMap[status] || status;
};

/**
 * 매칭 상태 한글명 조회 (동기 버전 - 기본값만 사용)
 */
export const getMappingStatusKoreanNameSync = (status) => {
    const defaultMappingStatusMap = {
        'PENDING_PAYMENT': '결제 대기',
        'PAYMENT_CONFIRMED': '결제 확인',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'ACTIVE': '활성',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'INACTIVE': '비활성',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'SUSPENDED': '일시정지',
        'TERMINATED': '종료됨',
        'SESSIONS_EXHAUSTED': '회기 소진',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'PENDING': '대기',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'COMPLETED': '완료'
    };
    
    return defaultMappingStatusMap[status] || status;
};

/**
 * 전문분야 코드를 한글명으로 변환 (백엔드 로직과 동일)
 */
export const getSpecialtyKoreanName = (code) => {
    if (!code || code.trim() === '') {
        return '미설정';
    }
    
    if (code.match(/[가-힣]/)) {
        return code;
    }
    
    const specialtyMap = {
        'DEPRESSION': '우울증',
        'ANXIETY': '불안장애',
        'TRAUMA': '트라우마',
        'STRESS': '스트레스',
        'RELATIONSHIP': '관계상담',
        'FAMILY': '가족상담',
        'COUPLE': '부부상담',
        'CHILD': '아동상담',
        'TEEN': '청소년상담',
        'ADOLESCENT': '청소년상담',
        'ADDICTION': '중독',
        'EATING': '섭식장애',
        'SLEEP': '수면장애',
        'ANGER': '분노조절',
        'GRIEF': '상실',
        'SELF_ESTEEM': '자존감',
        'CAREER': '진로상담',
        'FAMIL': '가족상담' // FAMILY의 축약형 처리
    };
    
    return specialtyMap[code] || code;
};

/**
 * 전문분야 배열을 한글명으로 변환
 */
export const getSpecialtyKoreanNames = (codes) => {
    if (!codes || !Array.isArray(codes)) {
        return [];
    }
    
    return codes.map(code => getSpecialtyKoreanName(code.trim()));
};

/**
 * 공통 코드에서 전문분야 조회
 */
export const getSpecialtyFromCommonCode = async (codeValue) => {
    try {
        // 표준화 2025-12-08: 올바른 API 경로 사용
        const response = await apiGet(`/api/v1/common-codes/groups/SPECIALTY`);
        if (response && response.length > 0) {
            const code = response.find(c => c.codeValue === codeValue);
            if (code) {
                return {
                    codeValue: code.codeValue,
                    koreanName: code.koreanName || code.codeLabel,
                    description: code.description,
                    icon: code.icon
                };
            }
        }
    } catch (error) {
        // 에러 발생 시 기본값 반환
        console.warn('코드 조회 실패:', error);
    }
    
    return {
        codeValue: codeValue,
        koreanName: getSpecialtyKoreanName(codeValue),
        description: '',
        icon: '🎯'
    };
};

/**
 * 텍스트 말줄임표 처리 함수
/**
 * @param {string} text - 원본 텍스트
/**
 * @param {number} maxLength - 최대 길이 (기본값: 50)
/**
 * @param {string} suffix - 말줄임표 문자 (기본값: '...')
/**
 * @returns {string} 처리된 텍스트
 */
export const truncateText = (text, maxLength = 50, suffix = '...') => {
    if (!text || typeof text !== 'string') {
        return '';
    }
    
    if (text.length <= maxLength) {
        return text;
    }
    
    return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * 전문분야 텍스트 말줄임표 처리 (특화된 함수)
/**
 * @param {Array} specialties - 전문분야 배열
/**
 * @param {number} maxLength - 최대 길이 (기본값: 50)
/**
 * @returns {string} 처리된 전문분야 텍스트
 */
export const truncateSpecialtyText = (specialties, maxLength = 50) => {
    if (!specialties || !Array.isArray(specialties) || specialties.length === 0) {
        return '';
    }
    
    const text = specialties.join(', ');
    return truncateText(text, maxLength);
};

/**
 * 모달 추가 정보 표시용 공통 함수들
 */

/**
 * 상담사 경력 정보 포맷팅
/**
 * @param {Object} consultant - 상담사 객체
/**
 * @returns {string} 포맷된 경력 텍스트
 */
export const getFormattedExperience = (consultant) => {
    if (consultant?.yearsOfExperience) {
        return `${consultant.yearsOfExperience}년`;
    }
    if (consultant?.experience) {
        return consultant.experience;
    }
    if (consultant?.careerYears) {
        return `${consultant.careerYears}년`;
    }
    if (consultant?.workExperience) {
        return `${consultant.workExperience}년`;
    }
    return '경력 정보 없음';
};

/**
 * 상담사 연락처 정보 포맷팅
/**
 * @param {Object} consultant - 상담사 객체
/**
 * @returns {Object} 포맷된 연락처 정보
 */
export const getFormattedContact = (consultant) => {
    return {
        email: consultant?.email || consultant?.emailAddress || '이메일 정보 없음',
        phone: consultant?.phone || consultant?.phoneNumber || consultant?.mobile || '전화번호 정보 없음'
    };
};

/**
 * 상담사 상담 횟수 포맷팅
/**
 * @param {Object} consultant - 상담사 객체
/**
 * @returns {string} 포맷된 상담 횟수
 */
export const getFormattedConsultationCount = (consultant) => {
    const count = consultant?.totalConsultations || 
                  consultant?.consultationCount || 
                  consultant?.totalSessions || 
                  consultant?.sessionCount || 0;
    return `${count}회`;
};

/**
 * 상담사 등록일 포맷팅
/**
 * @param {Object} consultant - 상담사 객체
/**
 * @returns {string} 포맷된 등록일
 */
export const getFormattedRegistrationDate = (consultant) => {
    if (consultant?.createdAt) {
        return new Date(consultant.createdAt).toLocaleDateString('ko-KR');
    }
    if (consultant?.registrationDate) {
        return new Date(consultant.registrationDate).toLocaleDateString('ko-KR');
    }
    if (consultant?.joinDate) {
        return new Date(consultant.joinDate).toLocaleDateString('ko-KR');
    }
    return '정보 없음';
};

/**
 * 상담사 현재 상담 중 인원 포맷팅
/**
 * @param {Object} consultant - 상담사 객체
/**
 * @returns {string} 포맷된 현재 상담 중 인원
 */
export const getFormattedCurrentClients = (consultant) => {
    const count = consultant?.currentClients || 0;
    return `${count}명`;
};

/**
 * 상담사 가용성 상태 포맷팅
/**
 * @param {Object} consultant - 상담사 객체
/**
 * @returns {Object} 가용성 상태 정보
 */
export const getFormattedAvailability = (consultant) => {
    const isOnVacation = consultant?.isOnVacation && 
                        (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY');
    
    let text, color;
    
    if (isOnVacation) {
        text = '휴무';
        color = 'var(--mg-error-500)';
    } else if (!consultant?.available) {
        text = '상담 불가';
        color = '#6b7280';
    } else if (consultant?.busy) {
        text = '상담 중';
        color = 'var(--mg-warning-500)';
    } else {
        text = '상담 가능';
        color = 'var(--mg-success-500)';
    }
    
    return { text, color };
};
