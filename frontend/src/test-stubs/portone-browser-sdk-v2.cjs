/**
 * Jest 전용 PortOne V2 stub.
 * node_modules/@portone/browser-sdk/dist/v2.cjs 가 없는 환경에서도
 * App·결제 경로 테스트가 모듈 해석에 실패하지 않도록 한다.
 */
module.exports = {
  requestPayment: () => Promise.resolve({})
};
