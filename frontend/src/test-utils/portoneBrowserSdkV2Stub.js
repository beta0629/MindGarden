/**
 * Jest용 @portone/browser-sdk/v2 스텁.
 * 환경에 SDK dist가 없어도 관련 테스트가 모듈을 해석할 수 있게 한다.
 */
module.exports = {
  requestPayment: () => Promise.resolve({})
};
