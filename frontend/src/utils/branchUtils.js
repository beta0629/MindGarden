import i18n from '../i18n';
/**
 * 지점 관련 유틸리티 함수들
/**
 * 
/**
 * 브랜치 개념이 제거되었으며, 테넌트 기반 시스템으로 전환되었습니다.
/**
 * 이 파일의 모든 함수는 하위 호환성을 위해 유지되지만, 새로운 코드에서는 사용하지 마세요.
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2025-01-17
/**
 * @deprecated 2025-12-05 - 브랜치 개념 제거, 테넌트 기반 시스템으로 전환
 */

/**
 * 지점 코드를 한글명으로 변환
/**
 * 
/**
 * @deprecated 2025-12-05 - 브랜치 개념이 제거되었습니다. 테넌트 기반 시스템을 사용하세요.
/**
 * @param {string} branchCode - 지점 코드
/**
 * @returns {string} 한글 지점명
 */
export const getBranchNameByCode = (branchCode) => {
    const branchNameMap = {
        'MAIN001': i18n.t('common:utils.branchUtils.t_42b4455c'),
        'HQ': i18n.t('common:utils.branchUtils.t_1c966608'),
        'GANGNAM': i18n.t('common:utils.branchUtils.t_aef85490'),
        'HONGDAE': i18n.t('common:utils.branchUtils.t_4c56952f'),
        'JAMSIL': i18n.t('common:utils.branchUtils.t_470661e8'),
        'SINCHON': i18n.t('common:utils.branchUtils.t_1b63f63d'),
        'SONGDO': i18n.t('common:utils.branchUtils.t_19f07fa5'),
        'UIJUNGBU': i18n.t('common:utils.branchUtils.t_5763e01c')
    };
    
    return branchNameMap[branchCode] || branchCode;
};

/**
 * 지점 객체의 필드명을 통일된 형태로 변환
/**
 * 
/**
 * @deprecated 2025-12-05 - 브랜치 개념이 제거되었습니다. 테넌트 기반 시스템을 사용하세요.
/**
 * @param {Object} branch - 지점 객체
/**
 * @returns {Object} 변환된 지점 객체
 */
export const normalizeBranchData = (branch) => {
    return {
        ...branch,
        name: branch.branchName || branch.name,
        code: branch.branchCode || branch.code,
        address: branch.address,
        phone: branch.phoneNumber || branch.phone,
        email: branch.email,
        isActive: branch.isActive,
        type: branch.branchType || branch.type,
        status: branch.branchStatus || branch.status
    };
};

/**
 * 지점 목록을 정규화
/**
 * 
/**
 * @deprecated 2025-12-05 - 브랜치 개념이 제거되었습니다. 테넌트 기반 시스템을 사용하세요.
/**
 * @param {Array} branches - 지점 목록
/**
 * @returns {Array} 정규화된 지점 목록
 */
export const normalizeBranchList = (branches) => {
    return branches.map(branch => normalizeBranchData(branch));
};

/**
 * 지점 코드 유효성 검사
/**
 * 
/**
 * @deprecated 2025-12-05 - 브랜치 개념이 제거되었습니다. 테넌트 기반 시스템을 사용하세요.
/**
 * @param {string} branchCode - 지점 코드
/**
 * @returns {boolean} 유효성 여부
 */
export const isValidBranchCode = (branchCode) => {
    const validCodes = ['MAIN001', 'HQ', 'GANGNAM', 'HONGDAE', 'JAMSIL', 'SINCHON', 'SONGDO'];
    return validCodes.includes(branchCode);
};

/**
 * 지점 타입을 한글로 변환
/**
 * 
/**
 * @deprecated 2025-12-05 - 브랜치 개념이 제거되었습니다. 테넌트 기반 시스템을 사용하세요.
/**
 * @param {string} branchType - 지점 타입
/**
 * @returns {string} 한글 지점 타입
 */
export const getBranchTypeName = (branchType) => {
    const typeMap = {
        'MAIN': i18n.t('common:utils.branchUtils.t_1c966608'),
        'FRANCHISE': i18n.t('common:utils.branchUtils.t_0ed3337d'),
        'DIRECT': i18n.t('common:utils.branchUtils.t_5ff158b6'),
        'PARTNER': i18n.t('common:utils.branchUtils.t_46dc11e9')
    };
    
    return typeMap[branchType] || branchType;
};

/**
 * 지점 상태를 한글로 변환
/**
 * 
/**
 * @deprecated 2025-12-05 - 브랜치 개념이 제거되었습니다. 테넌트 기반 시스템을 사용하세요.
/**
 * @param {string} branchStatus - 지점 상태
/**
 * @returns {string} 한글 지점 상태
 */
export const getBranchStatusName = (branchStatus) => {
    const statusMap = {
        'PLANNING': i18n.t('common:utils.branchUtils.t_a0264f75'),
        'PREPARING': i18n.t('common:utils.branchUtils.t_cb22883c'),
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'ACTIVE': i18n.t('common:utils.branchUtils.t_6a2123a3'),
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'SUSPENDED': i18n.t('common:utils.branchUtils.t_d2e7e7b0'),
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        'CLOSED': i18n.t('common:utils.branchUtils.t_74479f35')
    };
    
    return statusMap[branchStatus] || branchStatus;
};
