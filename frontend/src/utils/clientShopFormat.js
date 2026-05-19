/**
 * 내담자 쇼핑 금액·포인트 표시 (minor = 원 정수)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import { formatCurrency, formatDate } from './formatUtils';

/**
 * @param {number} minor
 * @param {string} [currency]
 * @returns {string}
 */
export const formatShopMoney = (minor, currency = 'KRW') => formatCurrency(minor, { currency });

/**
 * @param {number} minor
 * @returns {string}
 */
export const formatShopPoints = (minor) => `${Number(minor || 0).toLocaleString('ko-KR')} P`;

/**
 * @param {string} [isoDateTime]
 * @returns {string}
 */
export const formatShopDateTime = (isoDateTime) => {
  if (!isoDateTime) {
    return '';
  }
  return formatDate(isoDateTime, { format: 'datetime' });
};
