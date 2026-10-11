'use strict';

/**
 * Jest용 PortOne Browser SDK v2 CJS stub.
 * 실제 SDK가 설치되지 않은 환경에서도 App 등 관련 테스트가 로드되게 한다.
 */

function requestPayment(params) {
  const paymentId = params && params.paymentId
    ? String(params.paymentId)
    : 'stub-payment-id';
  return Promise.resolve({ paymentId: paymentId });
}

module.exports = {
  requestPayment: requestPayment
};
