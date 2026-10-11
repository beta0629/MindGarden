/**
 * Jest 전용 PortOne V2 스텁.
 * 환경에 @portone/browser-sdk 실파일이 없어도 App 등 관련 테스트가 해석되도록 둔다.
 */
module.exports = {
  requestPayment: jest.fn(() => Promise.resolve({ paymentId: 'pay-stub' }))
};
