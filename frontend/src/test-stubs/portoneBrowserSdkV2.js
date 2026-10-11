/**
 * Jest 전용 PortOne Browser SDK v2 스텁.
 * node_modules 의 exports 서브패스(@portone/browser-sdk/v2)가
 * 없거나 해석되지 않을 때 매퍼가 이 파일을 쓴다.
 */
const requestPayment = jest.fn();

module.exports = {
  __esModule: true,
  requestPayment
};
