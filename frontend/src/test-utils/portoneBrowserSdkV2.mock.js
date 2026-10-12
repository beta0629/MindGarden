/**
 * Jest용 @portone/browser-sdk/v2 스텁.
 * 가드레일·CI 환경에서 SDK dist가 없어도 App 테스트 스위트가 로드되게 한다.
 *
 * @author CoreSolution
 */

const requestPayment = jest.fn(async() => ({}));

module.exports = {
  requestPayment,
  __esModule: true
};
