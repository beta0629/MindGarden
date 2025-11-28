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
        // 표준화된 API 사용 (하위 호환성 유지)
        const { getCodeGroups } = await import('./commonCodeApi');
        let groups = [];
        try {
            groups = await getCodeGroups();
        } catch (error) {
            // 하위 호환성: 기존 API 사용
            const response = await apiGet('/api/common-codes/groups/list');
            groups = Array.isArray(response) ? response : [];
        }
        
        if (groups && groups.length > 0) {
            // 문자열 배열을 메타데이터 형태로 변환
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
        const response = await apiGet(`/api/common-codes/${groupName}`);
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
        
        const response = await apiGet(`/api/common-codes/${groupName}`);
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
        
        const response = await apiGet(`/api/common-codes/${groupName}`);
        if (response && response.length > 0) {
            // 첫 번째 코드의 colorCode 반환
            return response[0].colorCode || 'var(--mg-secondary-500)';
        }
    } catch (error) {
        console.error('코드그룹 색상 조회 실패:', error);
    }
    
    // 기본 색상 반환
    return 'var(--mg-primary-500)';
};

/**
 * 상태별 색상 조회 (동기 버전 - fallback 사용)
 * @deprecated - getStatusColorAsync 사용 권장
 */
export const getStatusColorSync = (codeValue) => {
    if (!codeValue) {
        return '#6b7280';
    }
    
    // 기본 색상 매칭 (fallback) - 최소한의 매칭만 유지
    const defaultColorMap = {
        // 기본 상태
        'true': 'var(--mg-success-500)',
        'false': 'var(--mg-error-500)'
    };
    
    return defaultColorMap[codeValue] || '#6b7280';
};

/**
 * 상태별 아이콘 조회 (동적)
 */
export const getStatusIcon = async (codeValue, groupName = 'STATUS') => {
    if (!codeValue) {
        return '📋';
    }
    
    try {
        const response = await apiGet(`/api/common-codes/${groupName}`);
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
        console.error('아이콘 조회 실패, fallback 사용:', error);
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
 * 상태별 색상과 아이콘을 함께 조회 (동적)
 */
export const getStatusStyle = async (codeValue, groupName = 'STATUS') => {
    if (!codeValue) {
        return { color: '#6b7280', icon: '📋' };
    }
    
    try {
        const response = await apiGet(`/api/common-codes/${groupName}`);
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
    
    // Fallback
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
        const response = await apiGet(`/api/common-codes/${groupName}`);
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
        'BOOKED': 'var(--mg-primary-500)',
        'CONFIRMED': 'var(--mg-purple-500)',
        'IN_PROGRESS': 'var(--mg-warning-500)',
        'COMPLETED': 'var(--mg-success-500)',
        'CANCELLED': 'var(--mg-error-500)',
        'BLOCKED': '#6b7280',
        'UNDER_REVIEW': '#f97316',
        'VACATION': '#06b6d4',
        'NO_SHOW': '#dc2626',
        'MAINTENANCE': '#6b7280',
        
        // 매칭 상태
        'PENDING_PAYMENT': 'var(--mg-warning-500)',
        'PAYMENT_CONFIRMED': 'var(--mg-info-500)',
        'ACTIVE': 'var(--mg-success-500)',
        'INACTIVE': 'var(--mg-secondary-500)',
        'SUSPENDED': '#fd7e14',
        'TERMINATED': 'var(--mg-error-500)',
        'SESSIONS_EXHAUSTED': '#6f42c1',
        
        // 사용자 상태
        'PENDING': '#6b7280',
        'APPROVED': 'var(--mg-success-500)',
        'REJECTED': 'var(--mg-error-500)',
        'PAYMENT_PENDING': 'var(--mg-warning-500)',
        'PAYMENT_REJECTED': 'var(--mg-error-500)',
        
        // 기타
        'true': 'var(--mg-success-500)',
        'false': 'var(--mg-error-500)'
    };
    
    return defaultColorMap[codeValue] || '#6b7280';
};

/**
 * 코드그룹별 표시 옵션 조회 (색상, 아이콘 등)
 */
export const getCodeGroupDisplayOptions = async (groupName) => {
    try {
        const response = await apiGet(`/api/common-codes/${groupName}`);
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
        const response = await apiGet(`/api/common-codes/STATUS`);
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
 * 사용자 상태 한글명 조회 (동기 버전 - 기본값만 사용)
 */
export const getUserStatusKoreanNameSync = (status) => {
    const defaultStatusMap = {
        'ACTIVE': '활성',
        'INACTIVE': '비활성',
        'PENDING': '대기',
        'SUSPENDED': '정지',
        'DELETED': '삭제됨',
        'PENDING_APPROVAL': '승인대기',
        'APPROVED': '승인됨',
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
        const response = await apiGet(`/api/common-codes/MAPPING_STATUS`);
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
 * 매칭 상태 한글명 조회 (동기 버전 - 기본값만 사용)
 */
export const getMappingStatusKoreanNameSync = (status) => {
    const defaultMappingStatusMap = {
        'PENDING_PAYMENT': '결제 대기',
        'PAYMENT_CONFIRMED': '결제 확인',
        'ACTIVE': '활성',
        'INACTIVE': '비활성',
        'SUSPENDED': '일시정지',
        'TERMINATED': '종료됨',
        'SESSIONS_EXHAUSTED': '회기 소진',
        'PENDING': '대기',
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
        const response = await apiGet(`/api/common-codes/SPECIALTY`);
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

/**
 * 텍스트 말줄임표 처리 함수
 * @param {string} text - 원본 텍스트
 * @param {number} maxLength - 최대 길이 (기본값: 50)
 * @param {string} suffix - 말줄임표 문자 (기본값: '...')
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
 * @param {Array} specialties - 전문분야 배열
 * @param {number} maxLength - 최대 길이 (기본값: 50)
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
 * @param {Object} consultant - 상담사 객체
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
 * @param {Object} consultant - 상담사 객체
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
 * @param {Object} consultant - 상담사 객체
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
 * @param {Object} consultant - 상담사 객체
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
 * @param {Object} consultant - 상담사 객체
 * @returns {string} 포맷된 현재 상담 중 인원
 */
export const getFormattedCurrentClients = (consultant) => {
    const count = consultant?.currentClients || 0;
    return `${count}명`;
};

/**
 * 상담사 가용성 상태 포맷팅
 * @param {Object} consultant - 상담사 객체
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
