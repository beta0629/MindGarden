'use strict';

/**
 * Jest 전용 PortOne Browser SDK v2 스텁.
 * node_modules/@portone/browser-sdk/dist/v2.cjs 가 없는 환경에서도
 * App 등 SDK를 간접 import 하는 테스트가 모듈 해석에 실패하지 않게 한다.
 */
function requestPayment() {
  return Promise.resolve({ paymentId: 'mock-payment-id' });
}

module.exports = {
  __esModule: true,
  requestPayment
};
