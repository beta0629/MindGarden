/**
 * Jest 스텁 — @portone/browser-sdk 가 node_modules 에 없거나 ESM 전용일 때
 * App·결제 경로 테스트가 스위트 로드 단계에서 실패하지 않게 한다.
 */
module.exports = {
  requestPayment: jest.fn()
};
