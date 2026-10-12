/**
 * Jest 전용 PortOne V2 스텁.
 * node_modules/@portone/browser-sdk/dist/v2.cjs 가 없는 환경에서도 매퍼가 해석되게 한다.
 */

const requestPayment = jest.fn(() => Promise.resolve({}));

module.exports = {
  requestPayment,
  default: {
    requestPayment
  }
};
