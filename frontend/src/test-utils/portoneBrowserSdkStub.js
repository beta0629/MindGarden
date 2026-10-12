/**
 * Jest 매핑용 PortOne V2 stub.
 * node_modules/@portone/browser-sdk 가 없는 환경에서도 스모크 테스트가 로드되게 한다.
 */
function requestPayment() {
  return Promise.resolve({});
}

module.exports = {
  requestPayment
};
