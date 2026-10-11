/**
 * Jest 전용 PortOne V2 스텁.
 * node_modules/@portone/browser-sdk 가 없는 환경에서도 스위트가 로드되게 한다.
 */
module.exports = {
  requestPayment: jest.fn()
};
