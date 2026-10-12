/**
 * Jest용 PortOne Browser SDK v2 스텁.
 * node_modules/@portone/browser-sdk/dist/v2.cjs 가 없는 환경에서도
 * moduleNameMapper가 해석되도록 저장소에 둔다.
 */
module.exports = {
  requestPayment: () => Promise.resolve({})
};
