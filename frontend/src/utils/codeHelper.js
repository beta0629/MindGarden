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
        const response = await apiGet('/api/common-codes/groups/list');
        if (response && response.length > 0) {
            // 문자열 배열을 메타데이터 형태로 변환
            groupMetadataCache = response.map(groupCode => ({
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
        const response = await apiGet(`/api/common-codes/group/${groupName}`);
        if (response && response.length > 0) {
            // 첫 번째 코드의 koreanName 반환 (그룹명으로 사용)
            return response[0].koreanName || groupName;
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
        
        const response = await apiGet(`/api/common-codes/group/${groupName}`);
        if (response && response.length > 0) {
            // 첫 번째 코드의 icon 반환
            return response[0].icon || '📋';
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
        
        const response = await apiGet(`/api/common-codes/group/${groupName}`);
        if (response && response.length > 0) {
            // 첫 번째 코드의 colorCode 반환
            return response[0].colorCode || '#6c757d';
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
        const response = await apiGet(`/api/common-codes/group/${groupName}`);
        if (response && response.length > 0) {
            // 정확한 매칭 먼저 시도
            let code = response.find(c => c.codeValue === codeValue);
            
            // 정확한 매칭이 없으면 매칭 테이블 사용 (MAPPING_STATUS인 경우)
            if (!code && groupName === 'MAPPING_STATUS') {
                const statusMapping = {
                    'ACTIVE': 'ACTIVE_MAPPING',
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
    
    // 기본 색상 매칭 (fallback) - 확장된 매칭
    const defaultColorMap = {
        // 스케줄 상태
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
        'MAINTENANCE': '#6b7280',
        
        // 매칭 상태
        'PENDING_PAYMENT': '#ffc107',
        'PAYMENT_CONFIRMED': '#17a2b8',
        'ACTIVE': '#28a745',
        'INACTIVE': '#6c757d',
        'SUSPENDED': '#fd7e14',
        'TERMINATED': '#dc3545',
        'SESSIONS_EXHAUSTED': '#6f42c1',
        
        // 사용자 상태
        'PENDING': '#6b7280',
        'APPROVED': '#10b981',
        'REJECTED': '#ef4444',
        'PAYMENT_PENDING': '#ffc107',
        'PAYMENT_REJECTED': '#dc3545',
        
        // 기타
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
        const response = await apiGet(`/api/common-codes/group/${groupName}`);
        if (response && response.length > 0) {
            // 정확한 매칭 먼저 시도
            let code = response.find(c => c.codeValue === codeValue);
            
            // 정확한 매칭이 없으면 매칭 테이블 사용 (MAPPING_STATUS인 경우)
            if (!code && groupName === 'MAPPING_STATUS') {
                const statusMapping = {
                    'ACTIVE': 'ACTIVE_MAPPING',
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
        console.error('상태별 아이콘 조회 실패:', error);
    }
    
    // 기본 아이콘 매칭 (fallback) - 확장된 매칭
    const defaultIconMap = {
        // 스케줄 상태
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
        'MAINTENANCE': '🔧',
        
        // 매칭 상태
        'PENDING_PAYMENT': '⏳',
        'PAYMENT_CONFIRMED': '💰',
        'ACTIVE': '✅',
        'INACTIVE': '⏸️',
        'SUSPENDED': '⏸️',
        'TERMINATED': '❌',
        'SESSIONS_EXHAUSTED': '🔚',
        
        // 사용자 상태
        'PENDING': '⏳',
        'APPROVED': '✅',
        'REJECTED': '❌',
        'PAYMENT_PENDING': '⏳',
        'PAYMENT_REJECTED': '❌',
        
        // 기타
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
        const response = await apiGet(`/api/common-codes/group/${groupName}`);
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
        const response = await apiGet(`/api/common-codes/group/STATUS`);
        if (response.success && response.data && response.data.codes) {
            const code = response.data.codes.find(c => c.codeValue === status);
            if (code && code.codeLabel) {
                return code.codeLabel;
            }
        }
    } catch (error) {
        console.error('사용자 상태 한글명 조회 실패:', error);
    }
    
    // 기본 매칭 (fallback)
    const defaultStatusMap = {
        'ACTIVE': '활성',
        'INACTIVE': '비활성',
        'SUSPENDED': '일시정지',
        'COMPLETED': '완료',
        'PENDING': '대기중',
        'APPROVED': '승인됨',
        'REJECTED': '거부됨',
        'PAYMENT_CONFIRMED': '결제확인',
        'PAYMENT_PENDING': '결제대기',
        'PAYMENT_REJECTED': '결제거부',
        'TERMINATED': '종료됨'
    };
    
    return defaultStatusMap[status] || status;
};

/**
 * 사용자 등급 한글명 조회 (동적)
 */
export const getUserGradeKoreanName = async (grade) => {
    try {
        const response = await apiGet(`/api/admin/common-codes/group/USER_GRADE/display-options`);
        if (response.success && response.data && response.data.codes) {
            const code = response.data.codes.find(c => c.codeValue === grade);
            if (code && code.codeLabel) {
                return code.codeLabel;
            }
        }
    } catch (error) {
        console.error('사용자 등급 한글명 조회 실패:', error);
    }
    
    // 기본 매칭 (fallback)
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
        const response = await apiGet(`/api/admin/common-codes/group/USER_GRADE/display-options`);
        if (response.success && response.data && response.data.codes) {
            const code = response.data.codes.find(c => c.codeValue === grade);
            if (code && code.icon) {
                return code.icon;
            }
        }
    } catch (error) {
        console.error('사용자 등급 아이콘 조회 실패:', error);
    }
    
    // 기본 매칭 (fallback)
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
 * 매칭 상태 한글명 조회 (동적)
 */
export const getMappingStatusKoreanName = async (status) => {
    try {
        const response = await apiGet(`/api/common-codes/group/MAPPING_STATUS`);
        if (response && response.length > 0) {
            // 정확한 매칭 먼저 시도
            let code = response.find(c => c.codeValue === status);
            
            // 정확한 매칭이 없으면 매칭 테이블 사용
            if (!code) {
                const statusMapping = {
                    'ACTIVE': 'ACTIVE_MAPPING',
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
    
    // 기본 매칭 (fallback)
    const defaultMappingStatusMap = {
        'PENDING_PAYMENT': '결제 대기',
        'PAYMENT_CONFIRMED': '결제 확인',
        'ACTIVE': '활성',
        'INACTIVE': '비활성',
        'SUSPENDED': '일시정지',
        'TERMINATED': '종료됨',
        'SESSIONS_EXHAUSTED': '회기 소진'
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
    
    // 이미 한글로 된 경우 그대로 반환
    if (code.match(/[가-힣]/)) {
        return code;
    }
    
    // 백엔드와 동일한 매핑 테이블
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
 * 공통코드에서 전문분야 정보 조회 (동적)
 */
export const getSpecialtyFromCommonCode = async (codeValue) => {
    try {
        const response = await apiGet(`/api/common-codes/group/SPECIALTY`);
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
        console.error('공통코드 전문분야 조회 실패:', error);
    }
    
    // fallback: 직접 매핑
    return {
        codeValue: codeValue,
        koreanName: getSpecialtyKoreanName(codeValue),
        description: '',
        icon: '🎯'
    };
};
