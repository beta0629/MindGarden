/**
 * 지점 관련 유틸리티 함수들
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */

/**
 * 지점 코드를 한글명으로 변환
 * @param {string} branchCode - 지점 코드
 * @returns {string} 한글 지점명
 */
export const getBranchNameByCode = (branchCode) => {
    const branchNameMap = {
        'MAIN001': '본점',
        'HQ': '본사',
        'GANGNAM': '강남점',
        'HONGDAE': '홍대점',
        'JAMSIL': '잠실점',
        'SINCHON': '신촌점',
        'SONGDO': '인천송도점',
        'UIJUNGBU': '의정부점'
    };
    
    return branchNameMap[branchCode] || branchCode;
};

/**
 * 지점 객체의 필드명을 통일된 형태로 변환
 * @param {Object} branch - 지점 객체
 * @returns {Object} 변환된 지점 객체
 */
export const normalizeBranchData = (branch) => {
    return {
        ...branch,
        // 기존 필드명을 새로운 필드명으로 매핑
        name: branch.branchName || branch.name,
        code: branch.branchCode || branch.code,
        // 기타 필드들도 필요시 매핑
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
 * @param {Array} branches - 지점 목록
 * @returns {Array} 정규화된 지점 목록
 */
export const normalizeBranchList = (branches) => {
    return branches.map(branch => normalizeBranchData(branch));
};

/**
 * 지점 코드 유효성 검사
 * @param {string} branchCode - 지점 코드
 * @returns {boolean} 유효성 여부
 */
export const isValidBranchCode = (branchCode) => {
    const validCodes = ['MAIN001', 'HQ', 'GANGNAM', 'HONGDAE', 'JAMSIL', 'SINCHON', 'SONGDO'];
    return validCodes.includes(branchCode);
};

/**
 * 지점 타입을 한글로 변환
 * @param {string} branchType - 지점 타입
 * @returns {string} 한글 지점 타입
 */
export const getBranchTypeName = (branchType) => {
    const typeMap = {
        'MAIN': '본사',
        'FRANCHISE': '가맹점',
        'DIRECT': '직영점',
        'PARTNER': '파트너'
    };
    
    return typeMap[branchType] || branchType;
};

/**
 * 지점 상태를 한글로 변환
 * @param {string} branchStatus - 지점 상태
 * @returns {string} 한글 지점 상태
 */
export const getBranchStatusName = (branchStatus) => {
    const statusMap = {
        'PLANNING': '계획',
        'PREPARING': '준비중',
        'ACTIVE': '활성',
        'SUSPENDED': '중단',
        'CLOSED': '폐점'
    };
    
    return statusMap[branchStatus] || branchStatus;
};
