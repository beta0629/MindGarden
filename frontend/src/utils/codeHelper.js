import { apiGet } from './ajax';
import {
  AVAILABILITY_AVAILABLE_LABEL,
  AVAILABILITY_BUSY_LABEL,
  AVAILABILITY_UNAVAILABLE_LABEL,
  AVAILABILITY_VACATION_LABEL,
  CONSULTANT_CLIENT_COUNT_SUFFIX,
  CONSULTANT_CONTACT_EMAIL_NONE,
  CONSULTANT_CONTACT_PHONE_NONE,
  CONSULTANT_EXPERIENCE_NONE,
  CONSULTANT_INFO_NONE,
  CONSULTANT_SESSION_COUNT_SUFFIX,
  CONSULTANT_YEAR_SUFFIX,
  MAPPING_STATUS_KOREAN_NAME_ASYNC_MAP,
  MAPPING_STATUS_KOREAN_NAME_SYNC_MAP,
  MASK_ENCRYPTED_DISPLAY_FALLBACK,
  SPECIALTY_DEFAULT_ICON,
  SPECIALTY_KOREAN_NAME_MAP,
  SPECIALTY_NOT_SET_LABEL,
  USER_GRADE_ICON_FALLBACK_ASYNC,
  USER_GRADE_ICON_FALLBACK_SYNC,
  USER_GRADE_ICON_MAP,
  USER_GRADE_KOREAN_DEFAULT,
  USER_GRADE_KOREAN_NAME_MAP,
  USER_STATUS_KOREAN_NAME_ASYNC_MAP,
  USER_STATUS_KOREAN_NAME_SYNC_MAP
} from '../constants/codeHelperStrings';

/**
 * 하드코딩된 값들을 동적으로 처리하기 위한 헬퍼 함수들
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-09-14
 */

let groupMetadataCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/** Base64 암호문으로 간주할 최소 길이 (평문 오탐 최소화) */
const ENCRYPTED_BASE64_MIN_LENGTH = 32;

/**
 * 복호화되지 않은 값(legacy:: 또는 암호문 패턴)이면 마스킹하여 표시용 문자열 반환
 * @param {string} value - 표시할 값
 * @param {string} fallback - 암호문일 때 반환할 대체 문자열
 * @returns {string}
 */
export const maskEncryptedDisplay = (value, fallback = MASK_ENCRYPTED_DISPLAY_FALLBACK) => {
  if (value == null || value === '') return fallback;
  const s = String(value).trim();
  if (s.startsWith('legacy::')) return fallback;
  const looksLikeBase64 = /^[A-Za-z0-9+/]+=*$/.test(s) && s.length >= ENCRYPTED_BASE64_MIN_LENGTH;
  if (looksLikeBase64) return fallback;
  return s;
};

/**
 * 코드그룹 메타데이터 로드 (캐시 적용)
 */
export const loadCodeGroupMetadata = async() => {
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
export const getCodeGroupKoreanName = async(groupName) => {
    try {
        if (groupMetadataCache) {
            const metadata = groupMetadataCache.find(item => item.codeGroup === groupName || item.groupName === groupName);
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
export const getCodeGroupIcon = async(groupName) => {
    try {
        if (groupMetadataCache) {
            const metadata = groupMetadataCache.find(item => item.codeGroup === groupName || item.groupName === groupName);
            if (metadata && metadata.icon) {
                return metadata.icon;
            }
        }
        
        // 표준화 2025-12-08: 올바른 API 경로 사용
        const response = await apiGet(`/api/v1/common-codes/groups/${groupName}`);
        if (response && response.length > 0) {
            return response[0].icon || 'ClipboardList';
        }
    } catch (error) {
        console.error('코드그룹 아이콘 조회 실패:', error);
    }
    
    return 'Folder';
};

/**
 * 코드그룹 색상 조회 (동적)
 */
export const getCodeGroupColor = async(groupName) => {
    try {
        if (groupMetadataCache) {
            const metadata = groupMetadataCache.find(item => item.codeGroup === groupName || item.groupName === groupName);
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
 * 상태별 배경색 조회 (동기 버전 - fallback 사용)
 * 배지용 색상은 StatusBadge 컴포넌트 사용 권장. 레거시/보조용.
 * @deprecated - 배지 표시 시 StatusBadge 사용 권장, getStatusColorAsync 사용 권장
 */
export const getStatusColorSync = (codeValue) => {
    if (!codeValue) {
        return 'var(--mg-gray-500)';
    }
    const defaultColorMap = {
        'true': 'var(--mg-success-500)',
        'false': 'var(--mg-error-500)',
        /* 사용자 상태 (ACTIVE/INACTIVE 등) - StatusBadge variant와 동일 의미 */
        ACTIVE: 'var(--mg-badge-status-success-bg, var(--mg-success-300))',
        INACTIVE: 'var(--mg-badge-status-neutral-bg, var(--mg-gray-200))',
        PENDING: 'var(--mg-badge-status-warning-bg, var(--mg-warning-300))',
        SUSPENDED: 'var(--mg-badge-status-warning-bg, var(--mg-warning-300))',
        COMPLETED: 'var(--mg-badge-status-success-bg, var(--mg-success-300))',
        TERMINATED: 'var(--mg-badge-status-neutral-bg, var(--mg-gray-200))',
        SESSIONS_EXHAUSTED: 'var(--mg-badge-status-neutral-bg, var(--mg-gray-200))',
        PAYMENT_CONFIRMED: 'var(--mg-badge-status-success-bg, var(--mg-success-300))',
        DEPOSIT_PENDING: 'var(--mg-badge-status-success-bg, var(--mg-success-300))',
        PENDING_PAYMENT: 'var(--mg-badge-status-warning-bg, var(--mg-warning-300))',
        ACTIVE_MAPPING: 'var(--mg-badge-status-success-bg, var(--mg-success-300))',
        INACTIVE_MAPPING: 'var(--mg-badge-status-neutral-bg, var(--mg-gray-200))',
        TERMINATED_MAPPING: 'var(--mg-badge-status-neutral-bg, var(--mg-gray-200))',
        SESSIONS_EXHAUSTED_MAPPING: 'var(--mg-badge-status-neutral-bg, var(--mg-gray-200))'
    };
    return defaultColorMap[codeValue] || 'var(--mg-gray-500)';
};

/**
 * 상태별 아이콘 조회 (동적)
 */
export const getStatusIcon = async(codeValue, groupName = 'STATUS') => {
    if (!codeValue) {
        return 'ClipboardList';
    }

    try {
        const response = await apiGet(`/api/v1/common-codes/groups/${groupName}`);
        if (response && response.length > 0) {
            let code = response.find(c => c.codeValue === codeValue);
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
        console.error('아이콘 조회 실패, fallback 사용:', error);
    }

    const defaultIconMap = {
        'AVAILABLE': 'Circle',
        'BOOKED': 'Calendar',
        'CONFIRMED': 'Check',
        'IN_PROGRESS': 'RefreshCw',
        'COMPLETED': 'PartyPopper',
        'CANCELLED': 'X',
        'BLOCKED': 'Ban',
        'UNDER_REVIEW': 'Search',
        'VACATION': 'Palmtree',
        'NO_SHOW': 'Ghost',
        'MAINTENANCE': 'Wrench',
        'PENDING_PAYMENT': 'Loader2',
        'PAYMENT_CONFIRMED': 'DollarSign',
        'ACTIVE': 'Check',
        'INACTIVE': 'Pause',
        'SUSPENDED': 'Pause',
        'TERMINATED': 'X',
        'SESSIONS_EXHAUSTED': 'CircleDot',
        'PENDING': 'Loader2',
        'APPROVED': 'Check',
        'REJECTED': 'X',
        'PAYMENT_PENDING': 'Loader2',
        'PAYMENT_REJECTED': 'X',
        'true': 'Check',
        'false': 'X'
    };
    return defaultIconMap[codeValue] || 'ClipboardList';
};

/**
 * 상태별 색상과 아이콘을 함께 조회 (동적)
 */
export const getStatusStyle = async(codeValue, groupName = 'STATUS') => {
    if (!codeValue) {
        return { color: 'var(--mg-color-text-secondary)', icon: 'ClipboardList' };
    }
    try {
        const response = await apiGet(`/api/v1/common-codes/groups/${groupName}`);
        if (response && Array.isArray(response)) {
            const code = response.find(c => c.codeValue === codeValue);
            if (code) {
                return {
                    color: code.colorCode || 'var(--mg-color-text-secondary)',
                    icon: code.icon || 'ClipboardList'
                };
            }
        }
    } catch (error) {
        console.warn('상태 스타일 조회 실패, fallback 사용:', error);
    }
    return {
        color: getStatusColorSync(codeValue),
        icon: 'ClipboardList'
    };
};

/**
 * 상태별 색상 조회 (동적)
 */
export const getStatusColor = async(codeValue, groupName) => {
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
export const getCodeGroupDisplayOptions = async(groupName) => {
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
    return 'Folder';
};

/**
 * 사용자 상태 한글명 조회 (동적)
 */
export const getUserStatusKoreanName = async(status) => {
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
    
    return USER_STATUS_KOREAN_NAME_ASYNC_MAP[status] || status;
};

/**
 * 사용자 상태 한글명 조회 (동기 버전 - 기본값만 사용)
 */
export const getUserStatusKoreanNameSync = (status) => {
    return USER_STATUS_KOREAN_NAME_SYNC_MAP[status] || status;
};

/**
 * 사용자 등급 한글명 조회 (동적)
 */
export const getUserGradeKoreanName = async(grade) => {
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
    
    return USER_GRADE_KOREAN_NAME_MAP[grade] || grade || USER_GRADE_KOREAN_DEFAULT;
};

/**
 * 사용자 등급 한글명 조회 (동기 버전 - 기본값만 사용)
 */
export const getUserGradeKoreanNameSync = (grade) => {
    return USER_GRADE_KOREAN_NAME_MAP[grade] || grade || USER_GRADE_KOREAN_DEFAULT;
};

/**
 * 사용자 등급 아이콘 조회 (동적)
 */
export const getUserGradeIcon = async(grade) => {
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
    
    return USER_GRADE_ICON_MAP[grade] || USER_GRADE_ICON_FALLBACK_ASYNC;
};

/**
 * 사용자 등급 아이콘 조회 (동기 버전 - 기본값만 사용)
 */
export const getUserGradeIconSync = (grade) => {
    return USER_GRADE_ICON_MAP[grade] || USER_GRADE_ICON_FALLBACK_SYNC;
};

/**
 * 매칭 상태 한글명 조회 (동적)
 */
export const getMappingStatusKoreanName = async(status) => {
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
    
    return MAPPING_STATUS_KOREAN_NAME_ASYNC_MAP[status] || status;
};

/**
 * 매칭 상태 한글명 조회 (동기 버전 - 기본값만 사용)
 */
export const getMappingStatusKoreanNameSync = (status) => {
    return MAPPING_STATUS_KOREAN_NAME_SYNC_MAP[status] || status;
};

/**
 * 전문분야 코드를 한글명으로 변환 (백엔드 로직과 동일)
 */
export const getSpecialtyKoreanName = (code) => {
    if (!code || code.trim() === '') {
        return SPECIALTY_NOT_SET_LABEL;
    }
    
    if (code.match(/[가-힣]/)) {
        return code;
    }
    
    return SPECIALTY_KOREAN_NAME_MAP[code] || code;
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
export const getSpecialtyFromCommonCode = async(codeValue) => {
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
        icon: SPECIALTY_DEFAULT_ICON
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
        return `${consultant.yearsOfExperience}${CONSULTANT_YEAR_SUFFIX}`;
    }
    if (consultant?.experience) {
        return consultant.experience;
    }
    if (consultant?.careerYears) {
        return `${consultant.careerYears}${CONSULTANT_YEAR_SUFFIX}`;
    }
    if (consultant?.workExperience) {
        return `${consultant.workExperience}${CONSULTANT_YEAR_SUFFIX}`;
    }
    return CONSULTANT_EXPERIENCE_NONE;
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
        email: consultant?.email || consultant?.emailAddress || CONSULTANT_CONTACT_EMAIL_NONE,
        phone: consultant?.phone || consultant?.phoneNumber || consultant?.mobile || CONSULTANT_CONTACT_PHONE_NONE
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
    return `${count}${CONSULTANT_SESSION_COUNT_SUFFIX}`;
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
    return CONSULTANT_INFO_NONE;
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
    return `${count}${CONSULTANT_CLIENT_COUNT_SUFFIX}`;
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
        text = AVAILABILITY_VACATION_LABEL;
        color = 'var(--mg-error-500)';
    } else if (!consultant?.available) {
        text = AVAILABILITY_UNAVAILABLE_LABEL;
        color = '#6b7280';
    } else if (consultant?.busy) {
        text = AVAILABILITY_BUSY_LABEL;
        color = 'var(--mg-warning-500)';
    } else {
        text = AVAILABILITY_AVAILABLE_LABEL;
        color = 'var(--mg-success-500)';
    }
    
    return { text, color };
};
