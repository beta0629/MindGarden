/**
 * 테넌트 어드민 — 온라인 카탈로그 SKU API
 *
 * @author CoreSolution
 * @since 2026-05-20
 */

import StandardizedApi from '../utils/standardizedApi';
import {
  ADMIN_SHOP_PRICE_HISTORY_DEFAULT_LIMIT,
  buildAdminShopCatalogPriceHistoryPath
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
