/**
 * Jest용 @portone/browser-sdk/v2 스텁.
 * 실제 SDK 패키지가 없거나 ESM만 있을 때 단위 테스트가 로드되도록 한다.
 */
export const requestPayment = jest.fn();

export default {
  requestPayment
};
