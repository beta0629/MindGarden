/**
 * 테넌트 공통코드 ↔ 글로벌 공통코드 diff 유틸 (G5-02)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import { toDisplayString } from './safeDisplay';
import {
  TENANT_COMMON_CODE_OVERRIDE_LABELS
} from '../constants/tenantCommonCodeTableConstants';

const DIFF_FIELDS = [
  { key: 'codeLabel', label: '코드명' },
  { key: 'koreanName', label: '한글명' },
  { key: 'codeDescription', label: '설명' },
  { key: 'sortOrder', label: '정렬' },
  { key: 'isActive', label: '활성' }
];

/**
 * 공통코드 행의 tenantId. camelCase·snake_case 둘 다 읽는다.
 *
 * @param {Record<string, *>|null|undefined} row
 * @returns {string|null|undefined}
 */
export function readCommonCodeTenantId(row) {
  if (!row || typeof row !== 'object') {
    return undefined;
  }
  if (row.tenantId !== undefined) {
    return row.tenantId;
  }
  return row.tenant_id;
}

/**
 * tenant_id 가 없는 코어(글로벌) 행인지.
 * 테넌트 행을 글로벌로 보면 자기 자신과 같아 「글로벌 동일」로 오인한다.
 *
 * @param {Record<string, *>|null|undefined} row
 * @returns {boolean}
 */
export function isCoreCommonCodeRow(row) {
  if (!row || typeof row !== 'object') {
    return false;
  }
  const tenantId = readCommonCodeTenantId(row);
  return tenantId == null || String(tenantId).trim() === '';
}

/**
 * 같은 codeValue 의 코어 행만 고른다. 테넌트 행은 건너뛴다.
 *
 * @param {Array<Record<string, *>>|null|undefined} rows
 * @param {string|null|undefined} codeValue
 * @returns {Record<string, *>|null}
 */
export function findCoreCodeMatch(rows, codeValue) {
  if (codeValue == null || String(codeValue).trim() === '') {
    return null;
  }
  const target = String(codeValue);
  const match = (Array.isArray(rows) ? rows : []).find((row) =>
    row && String(row.codeValue) === target && isCoreCommonCodeRow(row)
  );
  return match || null;
}

/**
 * @param {Record<string, *>|null|undefined} tenantRow
 * @param {Record<string, *>|null|undefined} globalRow
 * @returns {'override'|'tenant_only'|'global_match'}
 */
export function resolveTenantCodeOverrideStatus(tenantRow, globalRow) {
  if (!tenantRow) {
    return 'tenant_only';
  }
  if (!isCoreCommonCodeRow(globalRow)) {
    return 'tenant_only';
  }
  const differs = DIFF_FIELDS.some(({ key }) => {
    const t = tenantRow[key];
    const g = globalRow[key];
    if (key === 'isActive') {
      return Boolean(t) !== Boolean(g);
    }
    return toDisplayString(t, '') !== toDisplayString(g, '');
  });
  return differs ? 'override' : 'global_match';
}

/**
 * @param {'override'|'tenant_only'|'global_match'} status
 * @returns {string}
 */
export function getOverrideStatusLabel(status) {
  if (status === 'override') {
    return TENANT_COMMON_CODE_OVERRIDE_LABELS.OVERRIDE;
  }
  if (status === 'global_match') {
    return TENANT_COMMON_CODE_OVERRIDE_LABELS.GLOBAL_MATCH;
  }
  return TENANT_COMMON_CODE_OVERRIDE_LABELS.TENANT_ONLY;
}

/**
 * @param {Record<string, *>|null|undefined} tenantRow
 * @param {Record<string, *>|null|undefined} globalRow
 * @returns {Array<{ field: string, global: string, tenant: string, changed: boolean }>}
 */
export function buildTenantGlobalDiffRows(tenantRow, globalRow) {
  return DIFF_FIELDS.map(({ key, label }) => {
    const tenantVal = tenantRow?.[key];
    const globalVal = globalRow?.[key];
    const tenantDisplay = key === 'isActive'
      ? (tenantVal === false ? '비활성' : '활성')
      : toDisplayString(tenantVal, '—');
    const globalDisplay = key === 'isActive'
      ? (globalVal === false ? '비활성' : globalVal == null ? '—' : '활성')
      : toDisplayString(globalVal, '—');
    const changed = globalRow
      ? toDisplayString(tenantVal, '') !== toDisplayString(globalVal, '')
      : false;
    return {
      field: label,
      global: globalDisplay,
      tenant: tenantDisplay,
      changed
    };
  });
}
