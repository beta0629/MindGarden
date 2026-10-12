/**
 * Jest용 PortOne Browser SDK v2 CJS 스텁.
 * 패키지 dist/v2.cjs 가 없는 환경에서도 App·결제 경로 테스트가 로드되게 한다.
 */
module.exports = {
  requestPayment: function requestPayment() {
    return Promise.resolve({});
  }
};
