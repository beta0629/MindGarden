/**
 * Jest용 PortOne Browser SDK v2 스텁.
 * node_modules 패키지가 없거나 ESM-only여도 매퍼가 이 파일을 가리킨다.
 */
const requestPayment = jest.fn();

module.exports = {
  requestPayment
};
