/**
 * 공통코드 표준화된 API 유틸리티
/**
 * 표준화된 RESTful API 사용
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-01-XX
 */

import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './ajax';

const API_BASE = '/api/v1/common-codes';
/** 테넌트 컨텍스트로 생성·수정·삭제 (TenantCommonCodeController) */
const TENANT_CODES_WRITE_BASE = '/api/v1/tenant/common-codes';

/**
 * 생성·수정·삭제·토글 시 TenantCommonCodeController 경로 사용
 * (GET /api/v1/tenant/common-codes/...).
 */
const TENANT_WRITE_ISOLATED_GROUPS = [
    'CONSULTATION_PACKAGE',
    'PACKAGE_TYPE',
    'PAYMENT_METHOD',
    'SPECIALTY',
    'CONSULTATION_TYPE',
    'MAPPING_STATUS',
    'RESPONSIBILITY',
    'VACATION_TYPE',
    'MESSAGE_TYPE',
    'PRIORITY',
    'COMPLETION_STATUS',
    'FINANCIAL_CATEGORY',
    'TAX_CATEGORY',
    'BUDGET_CATEGORY',
    'ITEM_CATEGORY',
    'SALARY_TYPE',
    'SALARY_OPTION_TYPE',
    'SALARY_PAY_DAY',
    // 재무·ERP (FinancialCommonCodeInitializer·통합재무 UI) — 코어 생성 권한 대신 테넌트 API 사용
    'TRANSACTION_TYPE',
    'INCOME_CATEGORY',
    'INCOME_SUBCATEGORY',
    'EXPENSE_CATEGORY',
    'EXPENSE_SUBCATEGORY',
    'FINANCIAL_SUBCATEGORY',
    'VAT_APPLICABLE',
    'TAX_TYPE',
    'SALARY_GRADE'
];

const isTenantWriteIsolatedGroup = (codeGroup) =>
    Boolean(codeGroup) && TENANT_WRITE_ISOLATED_GROUPS.includes(codeGroup);

/**
 * 조회만 GET /api/v1/common-codes?codeGroup= (테넌트 우선 + 코어 폴백).
 * CRUD는 위 TENANT_WRITE_ISOLATED_GROUPS 와 동일하게 테넌트 API 유지.
 */
const HYBRID_READ_WITH_CORE_FALLBACK_GROUPS = [
    'TRANSACTION_TYPE',
    'INCOME_CATEGORY',
    'INCOME_SUBCATEGORY',
    'EXPENSE_CATEGORY',
    'EXPENSE_SUBCATEGORY',
    'FINANCIAL_SUBCATEGORY',
    'VAT_APPLICABLE',
    'TAX_TYPE',
    'SALARY_GRADE'
];

const shouldUseTenantOnlyReadPath = (codeGroup, forceTenant) => {
    if (forceTenant === true) {
        return true;
    }
    if (forceTenant === false) {
        return false;
    }
    if (!codeGroup || !isTenantWriteIsolatedGroup(codeGroup)) {
        return false;
    }
    if (HYBRID_READ_WITH_CORE_FALLBACK_GROUPS.includes(codeGroup)) {
        return false;
    }
    return true;
};

const resolveCodeGroupForRoute = (codeData, routeOpts = {}) =>
    routeOpts.codeGroup ?? codeData?.codeGroup ?? null;

/**
 * apiPost/apiPut/apiPatch가 ApiResponse면 data 추출, 이미 unwrap된 엔티티면 그대로 반환
 */
const normalizeMutationResponse = (response, failMessage) => {
    if (response == null) {
        throw new Error(failMessage);
    }
    if (typeof response === 'object' && 'success' in response) {
        if (response.success && response.data !== undefined && response.data !== null) {
            return response.data;
        }
        throw new Error(response.message || failMessage);
    }
    return response;
};

const normalizeDeleteResponse = (response, failMessage) => {
    if (response == null) {
        throw new Error(failMessage);
    }
    if (typeof response === 'object' && 'success' in response) {
        if (response.success) {
            return true;
        }
        throw new Error(response.message || failMessage);
    }
    return true;
};

/**
 * 코어 코드 그룹 목록 (시스템 전역)
 */
const CORE_CODE_GROUPS = [
    'USER_STATUS',
    'USER_ROLE',
    'ROLE',
    'CODE_GROUP_TYPE',
    'SYSTEM_STATUS',
    'NOTIFICATION_TYPE',
    'GENDER',
    'BANK',
    'ADDRESS_TYPE',
    'ADMIN_GRADE',
    'CONSULTANT_GRADE',
    'CLIENT_GRADE'
];

/**
 * 공통코드 목록 조회
/**
 * @param {string} codeGroup - 코드 그룹 (선택)
/**
 * @param {boolean|null} forceTenant - true: 항상 /tenant, false: 통합·코어 분기, null: 자동(하이브리드 그룹은 통합 조회)
/**
 * @returns {Promise<Array>} 공통코드 목록
 */
export const getCommonCodes = async(codeGroup = null, forceTenant = null) => {
    try {
        const useTenantApi = shouldUseTenantOnlyReadPath(codeGroup, forceTenant);
        
        let url;
        if (useTenantApi) {
            // 테넌트 코드 전용 API (코어 코드 폴백 없음 - 독립성 보장)
            url = codeGroup ? `${API_BASE}/tenant?codeGroup=${codeGroup}` : `${API_BASE}/tenant`;
        } else if (codeGroup && CORE_CODE_GROUPS.includes(codeGroup)) {
            // 코어 코드 전용 API
            url = `${API_BASE}/core/groups/${codeGroup}`;
        } else {
            // 통합 조회 API (테넌트 우선 + 코어 폴백, 하이브리드 재무 그룹 등)
            url = codeGroup ? `${API_BASE}?codeGroup=${codeGroup}` : API_BASE;
        }
        
        const response = await apiGet(url);
        
        console.log('📋 getCommonCodes 응답 구조:', { 
            codeGroup,
            useTenantApi,
            response, 
            isArray: Array.isArray(response),
            hasCodes: response?.codes,
            codesLength: response?.codes?.length
        });
        
        // apiGet이 이미 ApiResponse의 data를 추출하므로,
        // response는 CommonCodeListResponse 형태: { codes: [...], totalCount: ... } 또는 배열
        if (response && typeof response === 'object') {
            // codes 배열 직접 접근
            if (Array.isArray(response.codes)) {
                return response.codes;
            }
            // 하위 호환성: response가 이미 배열인 경우
            if (Array.isArray(response)) {
                return response;
            }
        }
        
        // 하위 호환성: 기존 API 형식 지원 (success, data 구조)
        if (response && response.success && response.data) {
            return response.data.codes || [];
        }
        
        console.warn('⚠️ getCommonCodes: 예상치 못한 응답 구조:', response);
        return [];
    } catch (error) {
        console.error('공통코드 목록 조회 실패:', error);
        return [];
    }
};

/**
 * 테넌트 코드 전용 조회 (독립성 보장)
/**
 * @param {string} codeGroup - 코드 그룹
/**
 * @returns {Promise<Array>} 테넌트별 코드 목록 (코어 코드 폴백 없음)
 */
export const getTenantCodes = async(codeGroup = null) => {
    try {
        const url = codeGroup ? `${API_BASE}/tenant?codeGroup=${codeGroup}` : `${API_BASE}/tenant`;
        const response = await apiGet(url);
        
        console.log('📋 getTenantCodes 응답 구조:', { 
            response, 
            isArray: Array.isArray(response),
            hasCodes: response?.codes,
            codesLength: response?.codes?.length
        });
        
        // apiGet이 이미 ApiResponse의 data를 추출하므로,
        // response는 CommonCodeListResponse 형태: { codes: [...], totalCount: ... } 또는 배열
        if (response && typeof response === 'object') {
            // codes 배열 직접 접근
            if (Array.isArray(response.codes)) {
                return response.codes; // 빈 배열도 반환 (폴백 로직에서 처리)
            }
            // 하위 호환성: response가 이미 배열인 경우
            if (Array.isArray(response)) {
                return response; // 빈 배열도 반환 (폴백 로직에서 처리)
            }
        }
        
        // 하위 호환성: 기존 API 형식 지원 (success, data 구조)
        if (response && response.success && response.data) {
            return response.data.codes || [];
        }
        
        console.warn('⚠️ getTenantCodes: 예상치 못한 응답 구조:', response);
        return [];
    } catch (error) {
        console.error('❌ 테넌트 코드 조회 실패:', error);
        return [];
    }
};


/**
 * 공통코드 상세 조회
/**
 * @param {number} id - 공통코드 ID
/**
 * @returns {Promise<Object|null>} 공통코드 상세 정보
 */
export const getCommonCodeById = async(id) => {
    try {
        const response = await apiGet(`${API_BASE}/${id}`);
        
        if (response.success && response.data) {
            return response.data;
        }
        
        return null;
    } catch (error) {
        console.error('공통코드 상세 조회 실패:', error);
        return null;
    }
};

/**
 * 공통코드 생성
/**
 * @param {Object} codeData - 공통코드 데이터
/**
 * @returns {Promise<Object|null>} 생성된 공통코드
 */
export const createCommonCode = async(codeData) => {
    try {
        const group = codeData?.codeGroup;
        const useTenant = isTenantWriteIsolatedGroup(group);
        const payload = { ...codeData };
        if (useTenant && Object.hasOwn(payload, 'tenantId')) {
            delete payload.tenantId;
        }
        const url = useTenant ? TENANT_CODES_WRITE_BASE : API_BASE;
        const response = await apiPost(url, payload);
        return normalizeMutationResponse(response, '공통코드 생성에 실패했습니다.');
    } catch (error) {
        console.error('공통코드 생성 실패:', error);
        throw error;
    }
};

/**
 * 공통코드 수정
/**
 * @param {number} id - 공통코드 ID
/**
 * @param {Object} codeData - 수정할 공통코드 데이터
/**
 * @returns {Promise<Object|null>} 수정된 공통코드
 */
/**
 * @param {Object} [routeOpts] - 테넌트 격리 그룹 수정 시 codeGroup 전달 (codeData에 없을 때 필수)
 */
export const updateCommonCode = async(id, codeData, routeOpts = {}) => {
    try {
        const group = resolveCodeGroupForRoute(codeData, routeOpts);
        const useTenant = isTenantWriteIsolatedGroup(group);
        const url = useTenant ? `${TENANT_CODES_WRITE_BASE}/${id}` : `${API_BASE}/${id}`;
        const response = await apiPut(url, codeData);
        return normalizeMutationResponse(response, '공통코드 수정에 실패했습니다.');
    } catch (error) {
        console.error('공통코드 수정 실패:', error);
        throw error;
    }
};

/**
 * 공통코드 삭제
/**
 * @param {number} id - 공통코드 ID
/**
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
/**
 * @param {Object} [routeOpts] - { codeGroup } 테넌트 격리 그룹 삭제 시 필수
 */
export const deleteCommonCode = async(id, routeOpts = {}) => {
    try {
        const group = routeOpts.codeGroup ?? null;
        const useTenant = isTenantWriteIsolatedGroup(group);
        const url = useTenant ? `${TENANT_CODES_WRITE_BASE}/${id}` : `${API_BASE}/${id}`;
        const response = await apiDelete(url);
        return normalizeDeleteResponse(response, '공통코드 삭제에 실패했습니다.');
    } catch (error) {
        console.error('공통코드 삭제 실패:', error);
        throw error;
    }
};

/**
 * 공통코드 상태 토글
/**
 * @param {number} id - 공통코드 ID
/**
 * @returns {Promise<Object|null>} 수정된 공통코드
 */
/**
 * @param {Object} [routeOpts] - 테넌트 격리: { codeGroup, currentIsActive } 필수
 */
export const toggleCommonCodeStatus = async(id, routeOpts = {}) => {
    try {
        const group = routeOpts.codeGroup ?? null;
        const useTenant = isTenantWriteIsolatedGroup(group);
        if (useTenant) {
            const cur = routeOpts.currentIsActive;
            if (typeof cur !== 'boolean') {
                throw new TypeError('테넌트 코드 상태 변경에는 현재 활성 여부가 필요합니다.');
            }
            const response = await apiPatch(
                `${TENANT_CODES_WRITE_BASE}/${id}/active`,
                { isActive: !cur }
            );
            return normalizeMutationResponse(response, '공통코드 상태 변경에 실패했습니다.');
        }
        const response = await apiPut(`${API_BASE}/${id}/toggle-status`, {});
        return normalizeMutationResponse(response, '공통코드 상태 변경에 실패했습니다.');
    } catch (error) {
        console.error('공통코드 상태 변경 실패:', error);
        throw error;
    }
};

/**
 * 공통코드 일괄 생성
/**
 * @param {Array<Object>} codesData - 공통코드 데이터 배열
/**
 * @returns {Promise<Array>} 생성된 공통코드 목록
 */
export const createCommonCodesBatch = async(codesData) => {
    try {
        const response = await apiPost(`${API_BASE}/batch`, codesData);
        
        if (response.success && response.data) {
            return response.data;
        }
        
        throw new Error(response.message || '공통코드 일괄 생성에 실패했습니다.');
    } catch (error) {
        console.error('공통코드 일괄 생성 실패:', error);
        throw error;
    }
};

/**
 * 코드 그룹 목록 조회 (하위 호환성)
/**
 * @returns {Promise<Array>} 코드 그룹 목록
 */
export const getCodeGroups = async() => {
    try {
        // 새로운 API 시도
        const response = await apiGet(`${API_BASE}?codeGroup=`);
        
        if (response.success && response.data) {
            // 코드 그룹 목록 추출
            const codes = response.data.codes || [];
            const groups = [...new Set(codes.map(code => code.codeGroup))];
            return groups;
        }
        
        // 하위 호환성: 기존 API 사용
        const legacyResponse = await apiGet('/api/v1/common-codes/groups/list');
        if (Array.isArray(legacyResponse)) {
            return legacyResponse;
        }
        
        return [];
    } catch (error) {
        console.error('코드 그룹 목록 조회 실패:', error);
        return [];
    }
};

/**
 * 코어 코드 조회 (HQ 관리자 전용)
/**
 * @param {string} codeGroup - 코드 그룹
/**
 * @returns {Promise<Array>} 코어 코드 목록
 */
export const getCoreCodesAPI = async(codeGroup) => {
    try {
        const response = await apiGet(`${API_BASE}?codeGroup=${codeGroup}`);
        
        if (response?.data?.codes && Array.isArray(response.data.codes)) {
            return response.data.codes;
        }
        
        return [];
    } catch (error) {
        console.error('코어 코드 조회 실패:', error);
        return [];
    }
};

