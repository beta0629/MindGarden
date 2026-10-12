/**
 * Jest 전용 PortOne Browser SDK v2 stub.
 * node_modules에 @portone/browser-sdk가 없을 때 moduleNameMapper가 이 파일을 가리킨다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

const requestPayment = jest.fn();

module.exports = {
  __esModule: true,
  requestPayment
};
