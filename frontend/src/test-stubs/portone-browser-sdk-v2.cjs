/**
 * Jest 전용 PortOne V2 스텁.
 * node_modules/@portone/browser-sdk/dist/v2.cjs 가 없는 환경에서도
 * moduleNameMapper 가 실제 파일을 가리키도록 한다.
 */
module.exports = {
  requestPayment: () => Promise.resolve({})
};
