/**
 * 테넌트 어드민 — 상품 구성(몰 SKU 기반) API.
 * 서버: AdminShopPackageCompositionController (#1578)
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import StandardizedApi from '../utils/standardizedApi';
import { ADMIN_SHOP_API } from '../constants/adminShopApi';
import { buildCompositionSaveBody } from '../utils/packageComposition';

function unwrapData(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.data !== undefined) {
    return raw.data;
  }
  return raw;
}

/**
 * 구성 후보 몰 SKU 검색. 검색어가 비면 전체를 받는다.
 *
 * @param {{ q?: string, excludePackageCode?: string }} [params]
 * @returns {Promise<{ items: Array<object>, totalActive: number }>}
 */
export async function listCompositionCandidates({ q = '', excludePackageCode = '' } = {}) {
  const query = {};
  const trimmed = String(q || '').trim();
  if (trimmed) {
    query.q = trimmed;
  }
  if (excludePackageCode) {
    query.excludePackageCode = excludePackageCode;
  }
  const data = unwrapData(await StandardizedApi.get(ADMIN_SHOP_API.COMPOSITION_CANDIDATES, query)) || {};
  return {
    items: Array.isArray(data.items) ? data.items : [],
    totalActive: Number(data.totalActive) || 0
  };
}

/**
 * 패키지 구성 조회.
 *
 * @param {string} packageCode
 * @returns {Promise<object>} ShopPackageCompositionResponse
 */
export async function getPackageComposition(packageCode) {
  const path = `${ADMIN_SHOP_API.PACKAGE_COMPOSITIONS}/${encodeURIComponent(packageCode)}`;
  return unwrapData(await StandardizedApi.get(path)) || { items: [] };
}

/**
 * 패키지 구성 저장(전체 교체). 단가·회기 스냅샷은 서버가 현재 몰 판매가로 정한다.
 *
 * @param {string} packageCode
 * @param {Array<{ skuId: number, quantity: number }>} items
 * @returns {Promise<object>} 저장 후 ShopPackageCompositionResponse
 */
export async function savePackageComposition(packageCode, items) {
  const path = `${ADMIN_SHOP_API.PACKAGE_COMPOSITIONS}/${encodeURIComponent(packageCode)}`;
  return unwrapData(await StandardizedApi.put(path, buildCompositionSaveBody(items)));
}
