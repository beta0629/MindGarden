/**
 * Client web brand labels — session/tenant branding, fail-closed
 * (shared by lobby top chrome · shop · cart)
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import { toDisplayString } from './safeDisplay';
import {
  DEFAULT_GNB_LOGO_LABEL,
  getTenantGnbLabel
} from './tenantDisplayName';

/** createDefaultBranding / GNB 제품 기본값 — 테넌트 라벨로 취급하지 않음 */
const PLATFORM_DEFAULT_BRAND_LABELS = new Set([
  'coresolution',
  'core solution',
  String(DEFAULT_GNB_LOGO_LABEL || '').trim().toLowerCase()
].filter(Boolean));

/**
 * 플랫폼 기본·빈 라벨이면 fail-closed empty
 * @param {unknown} value
 * @returns {string}
 */
function sanitizeClientWebBrandLabel(value) {
  const trimmed = toDisplayString(value, '').trim();
  if (!trimmed) {
    return '';
  }
  if (PLATFORM_DEFAULT_BRAND_LABELS.has(trimmed.toLowerCase())) {
    return '';
  }
  return trimmed;
}

/**
 * Client web top chrome 브랜드 라벨 (session + branding, fail-closed)
 * center: user.tenant.name → tenantName → branchName → branding.companyName
 * word: branding.companyNameEn (플랫폼 기본값 제외). word===center 이면 word 생략
 *
 * @param {object|null|undefined} user
 * @param {object|null|undefined} brandingInfo
 * @returns {{ brandWord: string, brandCenter: string }}
 */
export function resolveClientWebBrandLabels(user, brandingInfo) {
  const brandCenter = sanitizeClientWebBrandLabel(
    getTenantGnbLabel(user, brandingInfo, '')
  );
  let brandWord = sanitizeClientWebBrandLabel(brandingInfo?.companyNameEn);
  if (brandWord && brandCenter && brandWord === brandCenter) {
    brandWord = '';
  }
  return { brandWord, brandCenter };
}

/** Lobby alias — same fail-closed resolver */
export const resolveLobbyBrandLabels = resolveClientWebBrandLabels;
