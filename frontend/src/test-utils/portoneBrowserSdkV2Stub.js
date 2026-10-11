/**
 * Jest 전용 PortOne Browser SDK v2 stub.
 * 실제 결제를 수행하지 않으며, @portone/browser-sdk 패키지가 없어도 모듈 해석이 되도록 한다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */

function requestPayment() {
  return Promise.resolve({});
}

module.exports = {
  requestPayment: requestPayment
};
module.exports.default = module.exports;
