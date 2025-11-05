/**
 * 결제 참조번호 생성 유틸리티
 * 
 * 결제 방법에 따라 참조번호를 자동 생성
 */

import { PAYMENT_METHODS } from '../constants/mapping';

/**
 * 결제 참조번호 생성
 * 
 * @param {string} method - 결제 방법 (CARD, BANK_TRANSFER, CASH 등)
 * @returns {string|null} 생성된 참조번호 (CASH의 경우 null)
 */
export const generatePaymentReference = (method) => {
  const now = new Date();
  const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
  
  if (method === PAYMENT_METHODS.CASH) {
    return null; // 현금은 참조번호 없음
  } else if (method === PAYMENT_METHODS.CARD) {
    return `CARD_${timestamp}`;
  } else if (method === PAYMENT_METHODS.BANK_TRANSFER) {
    return `BANK_${timestamp}`;
  } else {
    return `${method}_${timestamp}`;
  }
};

