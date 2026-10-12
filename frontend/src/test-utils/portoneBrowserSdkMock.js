/**
 * Jest용 포트원 V2 브라우저 SDK 스텁.
 * 패키지 dist/v2.cjs 가 환경에 없어도 App·결제 유틸 테스트가 모듈을 해석할 수 있게 한다.
 */
module.exports = {
  requestPayment: jest.fn()
};
