/**
 * 내담자별 지정 상품·할인가 API (관리자·내담자). 금액은 서버가 확정하므로 최종가는 보내지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import StandardizedApi from '../utils/standardizedApi';
import { SHOP_CLIENT_OFFER_API } from '../constants/shopClientOfferConstants';

const toArray = (res) => {
  const data = res && typeof res === 'object' && 'data' in res && !Array.isArray(res) ? res.data : res;
  return Array.isArray(data) ? data : [];
};

const toObject = (res) => {
  const data = res && typeof res === 'object' && 'data' in res ? res.data : res;
  return data && typeof data === 'object' ? data : null;
};

/** @returns {Promise<object[]>} */
export const listAdminOfferSourceOptions = async() =>
  toArray(await StandardizedApi.get(SHOP_CLIENT_OFFER_API.ADMIN_SOURCE_OPTIONS));

/**
 * @param {number|string} clientId
 * @returns {Promise<object[]>}
 */
export const listAdminClientOffers = async(clientId) =>
  toArray(await StandardizedApi.get(SHOP_CLIENT_OFFER_API.ADMIN, { clientId }));

/**
 * @param {{ clientId: number, sourceSkuCode: string, discountType: string, discountValue: number }} body
 * @returns {Promise<object|null>}
 */
export const createAdminClientOffer = async(body) =>
  toObject(await StandardizedApi.post(SHOP_CLIENT_OFFER_API.ADMIN, body));

/**
 * @param {number} offerId
 * @returns {Promise<object|null>}
 */
export const cancelAdminClientOffer = async(offerId) =>
  toObject(await StandardizedApi.post(`${SHOP_CLIENT_OFFER_API.ADMIN}/${encodeURIComponent(offerId)}/cancel`, {}));

/**
 * 관리자 내담자 검색 (이름·연락처 뒷자리). 응답에는 전체 연락처가 없다.
 *
 * @param {{ q?: string, page?: number, size?: number }} params
 * @returns {Promise<{ id: number, name: string, phoneLast4: string|null, maskedPhone: string|null }[]>}
 */
export const searchAdminClients = async(params = {}) => {
  const page = toObject(await StandardizedApi.get(SHOP_CLIENT_OFFER_API.ADMIN_CLIENT_SEARCH, params));
  return Array.isArray(page?.items) ? page.items : [];
};

/** @returns {Promise<object[]>} */
export const listMyClientOffers = async() =>
  toArray(await StandardizedApi.get(SHOP_CLIENT_OFFER_API.CLIENT));
