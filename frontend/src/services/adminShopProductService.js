/**
 * 테넌트 어드민 — 「상품」 통합 화면 API (기존 엔드포인트 조합)
 * 가격·회기·홈 공개·판매 사용 = 테넌트 공통코드(CONSULTATION_PACKAGE)
 * 몰 노출·몰 내용 = 패키지 요금 온라인 SKU(package-fees)
 *
 * @author CoreSolution
 * @since 2026-09-29
 */

import StandardizedApi from '../utils/standardizedApi';
import { API, CODE_GROUP_CONSULTATION_PACKAGE } from '../constants/packagePricingConstants';
import { withPublicVisible } from '../utils/packagePricing';
import {
  listAdminShopPackageFees,
  patchAdminShopCatalogVisible,
  patchAdminShopPackageFeeVisible
} from './adminShopCatalogService';
import { ADMIN_SHOP_PRODUCT_KIND } from '../utils/adminShopSuite';

function unwrapData(raw) {
  if (raw && raw.success === true && raw.data !== undefined) {
    return raw.data;
  }
  if (raw && raw.data !== undefined && !Array.isArray(raw)) {
    return raw.data;
  }
  return raw;
}

/**
 * @param {unknown} data
 * @returns {Array<object>}
 */
function normalizeCodes(data) {
  if (data && Array.isArray(data.codes)) {
    return data.codes;
  }
  if (Array.isArray(data)) {
    return data;
  }
  return [];
}

/**
 * 상품 표를 만들 원본 3종.
 *
 * @returns {Promise<{ codes: Array<object>, packages: Array<object>, legacySkus: Array<object> }>}
 */
export async function listAdminShopProductSources() {
  const [codeData, fees] = await Promise.all([
    StandardizedApi.get(API.TENANT_CODES_LIST, { codeGroup: CODE_GROUP_CONSULTATION_PACKAGE }),
    listAdminShopPackageFees().catch(() => ({ packages: [], unlinkedSkus: [] }))
  ]);
  return {
    codes: normalizeCodes(codeData),
    packages: fees.packages,
    legacySkus: fees.unlinkedSkus
  };
}

/**
 * 공통코드 PUT 본문 — 기존 값 보존 + 덮어쓰기.
 *
 * @param {object} codeRow
 * @param {object} [overrides]
 * @returns {object}
 */
export function buildAdminShopProductCodePutBody(codeRow, overrides = {}) {
  return {
    codeLabel: codeRow.codeLabel,
    koreanName: codeRow.koreanName || codeRow.codeLabel,
    codeDescription: codeRow.codeDescription || null,
    isActive: codeRow.isActive === true || codeRow.isActive === undefined,
    extraData: codeRow.extraData || null,
    ...overrides
  };
}

/**
 * @param {string|number} codeId
 * @param {object} body
 * @returns {Promise<object|null>}
 */
export async function updateAdminShopProductCode(codeId, body) {
  const raw = await StandardizedApi.put(`${API.TENANT_COMMON_CODES}/${codeId}`, body);
  return unwrapData(raw);
}

/**
 * @param {object} body codeGroup 포함 생성 본문
 * @returns {Promise<object|null>} 생성된 공통코드 (codeValue 포함)
 */
export async function createAdminShopProductCode(body) {
  const raw = await StandardizedApi.post(API.TENANT_COMMON_CODES, {
    codeGroup: CODE_GROUP_CONSULTATION_PACKAGE,
    ...body
  });
  return unwrapData(raw);
}

/**
 * 홈 공개 (extraData.publicVisible).
 *
 * @param {object} product mergeAdminShopProducts 행
 * @param {boolean} next
 * @returns {Promise<object>} 갱신된 codeRow
 */
export async function setAdminShopProductHomePublic(product, next) {
  const codeRow = product.codeRow;
  const extraData = withPublicVisible(codeRow.extraData, next);
  await updateAdminShopProductCode(codeRow.id, buildAdminShopProductCodePutBody(codeRow, { extraData }));
  return { ...codeRow, extraData };
}

/**
 * 판매 사용 (isActive).
 *
 * @param {object} product
 * @param {boolean} next
 * @returns {Promise<object>} 갱신된 codeRow
 */
export async function setAdminShopProductActive(product, next) {
  const codeRow = product.codeRow;
  await updateAdminShopProductCode(codeRow.id, buildAdminShopProductCodePutBody(codeRow, { isActive: next }));
  return { ...codeRow, isActive: next };
}

/**
 * 몰 노출 — 패키지는 package-fees, 직접 등록 SKU 는 catalog-skus.
 *
 * @param {object} product
 * @param {boolean} next
 * @returns {Promise<void>}
 */
export async function setAdminShopProductMallVisible(product, next) {
  if (product.kind === ADMIN_SHOP_PRODUCT_KIND.LEGACY) {
    await patchAdminShopCatalogVisible(product.skuId, next);
    return;
  }
  await patchAdminShopPackageFeeVisible(product.code, next);
}
