/**
 * Jest 전용 PortOne Browser SDK v2 스텁.
 * node_modules/@portone/browser-sdk 가 없는 환경에서도
 * moduleNameMapper 가 실제 파일을 가리키도록 둔다.
 */
function requestPayment() {
  return Promise.resolve({ paymentId: '' });
}

module.exports = {
  requestPayment
};
