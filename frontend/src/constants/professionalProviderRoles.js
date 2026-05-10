/**
 * 테넌트 공통코드 PROFESSIONAL_PROVIDER_TYPE 연동 (전문가 유형).
 * 라벨은 API 응답(codeLabel 등)을 사용하고, 하드코딩 라디오 목록은 사용하지 않습니다.
 *
 * @author CoreSolution
 * @since 2026-05-10
 */

import { toDisplayString } from '../utils/safeDisplay';

/** 테넌트 공통코드 그룹명 (백엔드와 동일). */
export const PROFESSIONAL_PROVIDER_TYPE_CODE_GROUP = 'PROFESSIONAL_PROVIDER_TYPE';

/** 온보딩·마이그레이션 기본 유형 code_value (백엔드 상수와 동일). */
export const DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE = 'DEFAULT_COUNSELOR';

/** API 로드 실패 시 셀렉트 플레이스홀더 라벨. */
export const FALLBACK_PROFESSIONAL_TYPE_OPTION_LABEL = '상담사(기본)';

export const TENANT_PROFESSIONAL_PROVIDER_TYPE_CODES_PATH =
  `/api/v1/tenant/common-codes/groups/${PROFESSIONAL_PROVIDER_TYPE_CODE_GROUP}`;

/**
 * StandardizedApi.get 응답에서 공통코드 배열을 추출합니다.
 *
 * @param {*} res api 응답
 * @returns {Array}
 */
export function extractTenantProfessionalTypeList(res) {
  if (!res) {
    return [];
  }
  if (Array.isArray(res)) {
    return res;
  }
  if (Array.isArray(res.data)) {
    return res.data;
  }
  if (Array.isArray(res.data?.data)) {
    return res.data.data;
  }
  return [];
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
    .filter((r) => r && r.isActive !== false && !r.isDeleted)
    .map((r) => ({
      value: r.codeValue,
      label: toDisplayString(r.codeLabel || r.koreanName || r.codeValue),
      sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : 0
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** 레거시: 역할 문자열이 전문가 계열인지 (프론트 표시용). */
export function isProfessionalProviderRole(role) {
  const r = role != null ? String(role).trim() : '';
  return r === 'CONSULTANT' || r === 'PLAY_THERAPIST' || r === 'SPEECH_THERAPIST';
}
