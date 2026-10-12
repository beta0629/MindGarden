/**
 * Jest 전용 PortOne V2 stub.
 * 로컬/CI 에 @portone/browser-sdk 가 없거나 ESM-only 일 때 모듈 해석을 고정한다.
 */
module.exports = {
  requestPayment: jest.fn()
};
