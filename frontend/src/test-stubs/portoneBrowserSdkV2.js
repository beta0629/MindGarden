/**
 * Jest 전용 PortOne V2 스텁.
 * node_modules/@portone/browser-sdk 가 없어도 모듈 해석이 되도록 한다.
 */
module.exports = {
  requestPayment: jest.fn()
};
