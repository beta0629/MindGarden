/**
 * 테넌트 공통코드 PROFESSIONAL_PROVIDER_TYPE 연동 (전문가 유형).
 * 라벨은 API 응답(codeLabel 등)을 사용하고, 하드코딩 라디오 목록은 사용하지 않습니다.
 *
 * @author CoreSolution
 * @since 2026-05-10
 */

import { toDisplayString } from '../utils/safeDisplay';
import { getCommonCodes } from '../utils/commonCodeApi';
import StandardizedApi from '../utils/standardizedApi';

/** 테넌트 공통코드 그룹명 (백엔드와 동일). */
export const PROFESSIONAL_PROVIDER_TYPE_CODE_GROUP = 'PROFESSIONAL_PROVIDER_TYPE';

/** 상담사 등급 그룹 (테넌트 격리 코드). */
export const CONSULTANT_GRADE_CODE_GROUP = 'CONSULTANT_GRADE';

/** 온보딩·마이그레이션 기본 유형 code_value (백엔드 상수와 동일). */
export const DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE = 'DEFAULT_COUNSELOR';

/** API 로드 실패 시 셀렉트 플레이스홀더 라벨. */
export const FALLBACK_PROFESSIONAL_TYPE_OPTION_LABEL = '상담사(기본)';

export const TENANT_PROFESSIONAL_PROVIDER_TYPE_CODES_PATH =
  `/api/v1/tenant/common-codes/groups/${PROFESSIONAL_PROVIDER_TYPE_CODE_GROUP}`;

export const TENANT_CONSULTANT_GRADE_CODES_PATH =
  `/api/v1/tenant/common-codes/groups/${CONSULTANT_GRADE_CODE_GROUP}`;

/**
 * @param {Record<string, *>} r 원본 행
 * @param {string} camel camelCase 키
 * @param {string} [snake] snake_case 키
 * @returns {*}
 */
function pickField(r, camel, snake) {
  if (r[camel] !== undefined && r[camel] !== null) {
    return r[camel];
  }
  if (snake && r[snake] !== undefined && r[snake] !== null) {
    return r[snake];
  }
  return undefined;
}

/**
 * 테넌트 공통코드 행을 camelCase 위주로 정규화합니다 (Jackson·프록시 응답 호환).
 *
 * @param {Record<string, *>|null|undefined} r
 * @returns {Record<string, *>|null}
 */
export function normalizeTenantCommonCodeRow(r) {
  if (!r || typeof r !== 'object') {
    return null;
  }
  const codeValue = pickField(r, 'codeValue', 'code_value');
  const codeLabel = pickField(r, 'codeLabel', 'code_label');
  const koreanName = pickField(r, 'koreanName', 'korean_name');
  const sortOrder = pickField(r, 'sortOrder', 'sort_order');
  const isActive = pickField(r, 'isActive', 'is_active');
  const isDeleted = pickField(r, 'isDeleted', 'is_deleted');
  return {
    ...r,
    codeValue,
    codeLabel,
    koreanName,
    sortOrder,
    isActive,
    isDeleted
  };
}

/**
 * TenantCommonCodeController GET /groups/{group} 등 표준화 API 응답에서 코드 배열을 추출합니다.
 * — 배열 직접, ApiResponse.data 배열, CommonCodeListResponse.codes, 중첩 data 등.
 *
 * @param {*} res api 응답
 * @returns {Array}
 */
export function extractTenantCommonCodeGroupList(res) {
  if (!res) {
    return [];
  }
  if (Array.isArray(res)) {
    return res;
  }
  const unwrapData = (node) => {
    if (!node || typeof node !== 'object') {
      return null;
    }
    if (Array.isArray(node)) {
      return node;
    }
    if (Array.isArray(node.codes)) {
      return node.codes;
    }
    if (Array.isArray(node.data)) {
      return node.data;
    }
    if (node.data && typeof node.data === 'object' && Array.isArray(node.data.data)) {
      return node.data.data;
    }
    if (node.data && typeof node.data === 'object' && Array.isArray(node.data.codes)) {
      return node.data.codes;
    }
    return null;
  };
  const fromTop = unwrapData(res);
  if (fromTop) {
    return fromTop;
  }
  if (res.success === true && res.data !== undefined) {
    const inner = unwrapData(res.data);
    if (inner) {
      return inner;
    }
    if (Array.isArray(res.data)) {
      return res.data;
    }
  }
  if (Array.isArray(res.data)) {
    return res.data;
  }
  if (res.data && typeof res.data === 'object' && Array.isArray(res.data.data)) {
    return res.data.data;
  }
  return [];
}

/**
 * StandardizedApi.get 응답에서 공통코드 배열을 추출합니다.
 *
 * @param {*} res api 응답
 * @returns {Array}
 */
export function extractTenantProfessionalTypeList(res) {
  return extractTenantCommonCodeGroupList(res);
}

/**
 * 테넌트 공통코드 행을 셀렉트 옵션으로 변환합니다.
 *
 * @param {Array} rows CommonCodeResponse 목록
 * @returns {{ value: string, label: string, sortOrder: number }[]}
 */
export function mapTenantProfessionalTypeCodesToOptions(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((raw) => normalizeTenantCommonCodeRow(raw))
    .filter((r) => {
      if (!r) {
        return false;
      }
      if (r.isActive === false) {
        return false;
      }
      if (r.isDeleted === true) {
        return false;
      }
      const v = r.codeValue == null ? '' : String(r.codeValue).trim();
      return v.length > 0;
    })
    .map((r) => ({
      value: String(r.codeValue).trim(),
      label: toDisplayString(r.codeLabel || r.koreanName || r.codeValue),
      sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : 0
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * 등급 셀렉트용 { codeValue, codeLabel } 목록 (전문가 유형과 동일 소스 정규화).
 *
 * @param {Array} rows
 * @returns {{ codeValue: string, codeLabel: string, sortOrder: number }[]}
 */
export function mapTenantCommonCodesToGradeSelectOptions(rows) {
  const typeOpts = mapTenantProfessionalTypeCodesToOptions(rows);
  return typeOpts.map((o) => ({
    codeValue: o.value,
    codeLabel: o.label,
    sortOrder: o.sortOrder
  }));
}

/**
 * 여러 API에서 받은 공통코드 행을 codeValue 기준으로 병합합니다(나중 배열이 같은 키를 덮어씀).
 *
 * @param {...Array<*>} codeRowLists
 * @returns {Array<Record<string, *>>}
 */
export function mergeProfessionalProviderTypeCodeRows(...codeRowLists) {
  const byValue = new Map();
  for (const rows of codeRowLists) {
    if (!Array.isArray(rows)) {
      continue;
    }
    for (const raw of rows) {
      const n = normalizeTenantCommonCodeRow(raw);
      if (n?.codeValue == null) {
        continue;
      }
      const key = String(n.codeValue).trim();
      if (!key) {
        continue;
      }
      const prev = byValue.get(key);
      byValue.set(key, prev ? { ...prev, ...n } : n);
    }
  }
  return [...byValue.values()];
}

/**
 * 통합 공통코드(getCommonCodes)와 테넌트 그룹 API 행을 병합한 뒤 셀렉트 옵션을 만듭니다.
 * DB에 V20260510_002만 적용된 테넌트는 통합·테넌트 모두 1행일 수 있어, 서버 시드(Flyway) 보강이 필요할 수 있습니다.
 *
 * @param {Object} [deps]
 * @param {typeof getCommonCodes} [deps.getCommonCodes] 기본: commonCodeApi.getCommonCodes
 * @param {(path: string) => Promise<*>} [deps.standardizedApiGet] 기본: StandardizedApi.get
 * @returns {Promise<{ value: string, label: string, sortOrder: number }[]>}
 * @author CoreSolution
 * @since 2026-05-11
 */
export async function fetchProfessionalProviderTypeSelectOptions(deps = {}) {
  const resolveGetCommonCodes = deps.getCommonCodes ?? getCommonCodes;
  const resolveStandardizedGet = deps.standardizedApiGet ?? ((path) => StandardizedApi.get(path));

  let integrated = [];
  try {
    const codes = await resolveGetCommonCodes(PROFESSIONAL_PROVIDER_TYPE_CODE_GROUP);
    integrated = Array.isArray(codes) ? codes : [];
  } catch {
    integrated = [];
  }

  let tenantRows = [];
  try {
    const res = await resolveStandardizedGet(TENANT_PROFESSIONAL_PROVIDER_TYPE_CODES_PATH);
    tenantRows = extractTenantCommonCodeGroupList(res);
  } catch {
    tenantRows = [];
  }

  const merged = mergeProfessionalProviderTypeCodeRows(integrated, tenantRows);
  return mapTenantProfessionalTypeCodesToOptions(merged);
}

/**
 * 전문가 유형 코드 → 한글 라벨 정적 매핑 (공통코드 PROFESSIONAL_PROVIDER_TYPE 기반).
 * API 응답 없이도 카드·뱃지 등에서 즉시 표시 가능한 폴백 라벨.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
export const PROFESSIONAL_PROVIDER_TYPE_LABELS = {
  DEFAULT_COUNSELOR: '상담사',
  PLAY_THERAPY: '놀이치료',
  SPEECH_THERAPY: '언어치료'
};

/**
 * 전문가 유형 코드를 한글 라벨로 변환합니다.
 * 매핑에 없거나 null/undefined이면 null을 반환합니다.
 *
 * @param {string|null|undefined} code professionalProviderTypeCode
 * @returns {string|null}
 */
export function getProfessionalProviderTypeLabel(code) {
  if (code == null) {
    return null;
  }
  const trimmed = String(code).trim();
  if (trimmed.length === 0) {
    return null;
  }
  return PROFESSIONAL_PROVIDER_TYPE_LABELS[trimmed] || null;
}

/** 레거시: 역할 문자열이 전문가 계열인지 (프론트 표시용). */
export function isProfessionalProviderRole(role) {
  if (role == null) {
    return false;
  }
  const r = String(role).trim();
  return r === 'CONSULTANT' || r === 'PLAY_THERAPIST' || r === 'SPEECH_THERAPIST';
}
