/**
 * Jest 전용 PortOne V2 stub.
 * @portone/browser-sdk 패키지 또는 dist/v2.cjs 가 없어도 모듈 해석이 실패하지 않게 한다.
 */
const requestPayment = jest.fn(() => Promise.resolve({}));

module.exports = {
  requestPayment,
  default: { requestPayment }
};
