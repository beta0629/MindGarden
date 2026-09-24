/**
 * 테넌트 어드민 — 온라인 카탈로그 SKU API
 *
 * @author CoreSolution
 * @since 2026-05-20
 */

import StandardizedApi from '../utils/standardizedApi';
import {
  ADMIN_SHOP_API,
  ADMIN_SHOP_PRICE_HISTORY_DEFAULT_LIMIT,
  buildAdminShopCatalogPriceHistoryPath,
  buildAdminShopCatalogSkuPath,
  buildAdminShopCatalogSkuThumbnailPath,
  buildAdminShopCatalogVisiblePath,
  buildAdminShopPackageFeePath,
  buildAdminShopPackageFeesPath,
  buildAdminShopPackageFeeVisiblePath,
  buildCatalogVisiblePatchBody
} from '../constants/adminShopApi';

function unwrapData(raw) {
  if (raw && raw.success === true && raw.data !== undefined) {
    return raw.data;
  }
  if (raw && raw.data !== undefined) {
    return raw.data;
  }
  return raw;
}

/**
 * @param {string|number} skuId
 * @param {number} [limit]
 * @returns {Promise<Array>}
 */
export async function listAdminShopCatalogSkuPriceHistory(
  skuId,
  limit = ADMIN_SHOP_PRICE_HISTORY_DEFAULT_LIMIT
) {
  const raw = await StandardizedApi.get(buildAdminShopCatalogPriceHistoryPath(skuId, limit));
  const data = unwrapData(raw);
  return Array.isArray(data) ? data : [];
}

/**
 * @param {string|number} skuId
 * @returns {Promise<object|null>}
 */
export async function getAdminShopCatalogSku(skuId) {
  const raw = await StandardizedApi.get(buildAdminShopCatalogSkuPath(skuId));
  return unwrapData(raw);
}

/**
 * @param {object} body — skuCode 생략(서버 자동 생성)
 * @returns {Promise<object|null>}
 */
export async function createAdminShopCatalogSku(body) {
  const raw = await StandardizedApi.post(ADMIN_SHOP_API.CATALOG_SKUS, body);
  return unwrapData(raw);
}

/**
 * @param {string|number} skuId
 * @param {object} body
 * @returns {Promise<object|null>}
 */
export async function updateAdminShopCatalogSku(skuId, body) {
  const raw = await StandardizedApi.put(buildAdminShopCatalogSkuPath(skuId), body);
  return unwrapData(raw);
}

/**
 * PLP 노출(catalog_visible) 즉시 PATCH.
 *
 * @param {string|number} skuId
 * @param {boolean} catalogVisible
 * @returns {Promise<unknown>}
 */
export async function patchAdminShopCatalogVisible(skuId, catalogVisible) {
  return StandardizedApi.patch(
    buildAdminShopCatalogVisiblePath(skuId),
    buildCatalogVisiblePatchBody(catalogVisible)
  );
}

/**
 * 패키지 요금 관리 행과 온라인 노출 상태.
 *
 * @returns {Promise<{ packages: Array, unlinkedSkus: Array }>}
 */
export async function listAdminShopPackageFees() {
  const raw = await StandardizedApi.get(buildAdminShopPackageFeesPath());
  const data = unwrapData(raw);
  return {
    packages: Array.isArray(data?.packages) ? data.packages : [],
    unlinkedSkus: Array.isArray(data?.unlinkedSkus) ? data.unlinkedSkus : []
  };
}

/**
 * @param {string} packageCode 패키지 코드
 * @returns {Promise<object|null>}
 */
export async function getAdminShopPackageFee(packageCode) {
  const raw = await StandardizedApi.get(buildAdminShopPackageFeePath(packageCode));
  return unwrapData(raw);
}

/**
 * @param {string} packageCode 패키지 코드
 * @param {object} body 설명·노출·정렬
 * @returns {Promise<object|null>}
 */
export async function updateAdminShopPackageFeeContent(packageCode, body) {
  const raw = await StandardizedApi.put(buildAdminShopPackageFeePath(packageCode), body);
  return unwrapData(raw);
}

/**
 * @param {string} packageCode 패키지 코드
 * @param {boolean} catalogVisible 노출 여부
 * @returns {Promise<unknown>}
 */
export async function patchAdminShopPackageFeeVisible(packageCode, catalogVisible) {
  return StandardizedApi.patch(
    buildAdminShopPackageFeeVisiblePath(packageCode),
    buildCatalogVisiblePatchBody(catalogVisible)
  );
}

/**
 * @param {string|number} skuId
 * @param {File} file
 * @returns {Promise<object|null>}
 */
export async function uploadAdminShopCatalogSkuThumbnail(skuId, file) {
  const form = new FormData();
  form.append('file', file);
  const raw = await StandardizedApi.postFormData(
    buildAdminShopCatalogSkuThumbnailPath(skuId),
    form
  );
  return unwrapData(raw);
}
