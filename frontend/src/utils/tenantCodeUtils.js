/**
 * 테넌트 코드 관리 비즈니스 로직 유틸리티
 * - 코드 검증 로직
 * - 데이터 변환 로직
 * - 권한 체크 로직
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-26
 */

import {
    TENANT_CODE_GROUPS,
    CORE_CODE_GROUPS,
    TAB_TYPES,
    VALIDATION,
    PERMISSIONS
} from '../constants/tenantCodeConstants';

/**
 * 코드 그룹이 테넌트 코드인지 확인
 * @param {string} codeGroup - 코드 그룹명
 * @returns {boolean} 테넌트 코드 여부
 */
export const isTenantCodeGroup = (codeGroup) => {
    return TENANT_CODE_GROUPS.includes(codeGroup);
};

/**
 * 코드 그룹이 코어 코드인지 확인
 * @param {string} codeGroup - 코드 그룹명
 * @returns {boolean} 코어 코드 여부
 */
export const isCoreCodeGroup = (codeGroup) => {
    return CORE_CODE_GROUPS.includes(codeGroup);
};

/**
 * 현재 탭에 따른 코드 그룹 목록 반환
 * @param {string} activeTab - 현재 활성 탭
 * @returns {string[]} 코드 그룹 목록
 */
export const getCodeGroupsByTab = (activeTab) => {
    return activeTab === TAB_TYPES.TENANT ? TENANT_CODE_GROUPS : CORE_CODE_GROUPS;
};

/**
 * 폼 데이터 검증
 * @param {Object} formData - 폼 데이터
 * @returns {Object} 검증 결과 { isValid, errors }
 */
export const validateFormData = (formData) => {
    const errors = {};
    let isValid = true;

    // 필수 필드 검증
    if (!formData.codeValue || formData.codeValue.trim().length === 0) {
        errors.codeValue = '코드 값은 필수입니다.';
        isValid = false;
    } else if (formData.codeValue.length > VALIDATION.CODE_VALUE_MAX_LENGTH) {
        errors.codeValue = `코드 값은 ${VALIDATION.CODE_VALUE_MAX_LENGTH}자 이하여야 합니다.`;
        isValid = false;
    }

    if (!formData.codeLabel || formData.codeLabel.trim().length === 0) {
        errors.codeLabel = '코드 라벨은 필수입니다.';
        isValid = false;
    } else if (formData.codeLabel.length > VALIDATION.CODE_LABEL_MAX_LENGTH) {
        errors.codeLabel = `코드 라벨은 ${VALIDATION.CODE_LABEL_MAX_LENGTH}자 이하여야 합니다.`;
        isValid = false;
    }

    if (!formData.koreanName || formData.koreanName.trim().length === 0) {
        errors.koreanName = '한글명은 필수입니다.';
        isValid = false;
    } else if (formData.koreanName.length > VALIDATION.KOREAN_NAME_MAX_LENGTH) {
        errors.koreanName = `한글명은 ${VALIDATION.KOREAN_NAME_MAX_LENGTH}자 이하여야 합니다.`;
        isValid = false;
    }

    // 선택적 필드 검증
    if (formData.codeDescription && formData.codeDescription.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
        errors.codeDescription = `설명은 ${VALIDATION.DESCRIPTION_MAX_LENGTH}자 이하여야 합니다.`;
        isValid = false;
    }

    if (formData.sortOrder < VALIDATION.SORT_ORDER_MIN || formData.sortOrder > VALIDATION.SORT_ORDER_MAX) {
        errors.sortOrder = `정렬 순서는 ${VALIDATION.SORT_ORDER_MIN}~${VALIDATION.SORT_ORDER_MAX} 사이여야 합니다.`;
        isValid = false;
    }

    return { isValid, errors };
};

/**
 * 코드 검색 필터링
 * @param {Array} codes - 코드 목록
 * @param {string} searchTerm - 검색어
 * @returns {Array} 필터링된 코드 목록
 */
export const filterCodes = (codes, searchTerm) => {
    if (!searchTerm || searchTerm.trim().length === 0) {
        return codes;
    }

    const searchLower = searchTerm.toLowerCase();
    return codes.filter(code => {
        return (
            code.codeValue?.toLowerCase().includes(searchLower) ||
            code.codeLabel?.toLowerCase().includes(searchLower) ||
            code.koreanName?.toLowerCase().includes(searchLower) ||
            code.codeDescription?.toLowerCase().includes(searchLower)
        );
    });
};

/**
 * 사용자 권한 체크
 * @param {Object} user - 사용자 정보
 * @param {string} codeGroup - 코드 그룹
 * @returns {Object} 권한 정보 { canView, canEdit, canDelete }
 */
export const checkUserPermissions = (user, codeGroup) => {
    const isTenant = isTenantCodeGroup(codeGroup);
    const isSystemAdmin = user?.role === PERMISSIONS.SYSTEM_ADMIN;
    
    return {
        canView: true, // 모든 사용자는 조회 가능
        canEdit: isTenant || isSystemAdmin, // 테넌트 코드는 모든 관리자, 코어 코드는 시스템 관리자만
        canDelete: isTenant || isSystemAdmin // 테넌트 코드는 모든 관리자, 코어 코드는 시스템 관리자만
    };
};

/**
 * 코드 데이터 정규화
 * @param {Object} rawData - 원본 데이터
 * @param {string} codeGroup - 코드 그룹
 * @param {string} tenantId - 테넌트 ID
 * @returns {Object} 정규화된 코드 데이터
 */
export const normalizeCodeData = (rawData, codeGroup, tenantId) => {
    return {
        codeGroup,
        codeValue: rawData.codeValue?.trim() || '',
        codeLabel: rawData.codeLabel?.trim() || '',
        koreanName: rawData.koreanName?.trim() || '',
        codeDescription: rawData.codeDescription?.trim() || '',
        sortOrder: parseInt(rawData.sortOrder) || 1,
        isActive: rawData.isActive !== false,
        colorCode: rawData.colorCode || '',
        icon: rawData.icon || '',
        tenantId: isTenantCodeGroup(codeGroup) ? tenantId : null
    };
};

/**
 * 코드 목록 정렬
 * @param {Array} codes - 코드 목록
 * @param {string} sortBy - 정렬 기준 ('sortOrder', 'codeValue', 'koreanName')
 * @param {string} sortOrder - 정렬 순서 ('asc', 'desc')
 * @returns {Array} 정렬된 코드 목록
 */
export const sortCodes = (codes, sortBy = 'sortOrder', sortOrder = 'asc') => {
    return [...codes].sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        // 숫자 타입 처리
        if (sortBy === 'sortOrder') {
            aValue = parseInt(aValue) || 0;
            bValue = parseInt(bValue) || 0;
        } else {
            // 문자열 타입 처리
            aValue = (aValue || '').toString().toLowerCase();
            bValue = (bValue || '').toString().toLowerCase();
        }

        if (sortOrder === 'desc') {
            return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        } else {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
    });
};

/**
 * 코드 그룹 메타데이터 변환
 * @param {Array} metadataArray - 메타데이터 배열
 * @returns {Object} 그룹명을 키로 하는 메타데이터 객체
 */
export const transformMetadata = (metadataArray) => {
    const metadata = {};
    if (Array.isArray(metadataArray)) {
        metadataArray.forEach(group => {
            if (group.groupName) {
                metadata[group.groupName] = group;
            }
        });
    }
    return metadata;
};

/**
 * 코드 그룹 표시명 생성
 * @param {string} groupName - 그룹명
 * @param {Object} metadata - 메타데이터
 * @returns {string} 표시명
 */
export const getGroupDisplayName = (groupName, metadata = {}) => {
    const groupMetadata = metadata[groupName];
    return groupMetadata?.koreanName || groupName;
};

/**
 * 코드 그룹 설명 생성
 * @param {string} groupName - 그룹명
 * @param {Object} metadata - 메타데이터
 * @returns {string} 설명
 */
export const getGroupDescription = (groupName, metadata = {}) => {
    const groupMetadata = metadata[groupName];
    return groupMetadata?.description || '코드 그룹 설명';
};

/**
 * 색상 코드 검증
 * @param {string} colorCode - 색상 코드
 * @returns {boolean} 유효한 색상 코드 여부
 */
export const isValidColorCode = (colorCode) => {
    if (!colorCode) return true; // 선택사항이므로 빈 값은 유효
    
    // HEX 색상 코드 검증 (#RRGGBB 또는 #RGB)
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexPattern.test(colorCode);
};

/**
 * 아이콘 검증 (이모지 또는 텍스트)
 * @param {string} icon - 아이콘
 * @returns {boolean} 유효한 아이콘 여부
 */
export const isValidIcon = (icon) => {
    if (!icon) return true; // 선택사항이므로 빈 값은 유효
    
    // 길이 제한 (이모지는 보통 1-4자)
    return icon.length <= 10;
};

/**
 * 코드 통계 계산
 * @param {Array} codes - 코드 목록
 * @returns {Object} 통계 정보
 */
export const calculateCodeStats = (codes) => {
    const total = codes.length;
    const active = codes.filter(code => code.isActive).length;
    const inactive = total - active;
    const tenantCodes = codes.filter(code => code.tenantId).length;
    const coreCodes = total - tenantCodes;

    return {
        total,
        active,
        inactive,
        tenantCodes,
        coreCodes,
        activeRate: total > 0 ? Math.round((active / total) * 100) : 0
    };
};

/**
 * 에러 메시지 포맷팅
 * @param {Error} error - 에러 객체
 * @returns {string} 사용자 친화적 에러 메시지
 */
export const formatErrorMessage = (error) => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    
    if (error.message) {
        return error.message;
    }
    
    return '알 수 없는 오류가 발생했습니다.';
};
