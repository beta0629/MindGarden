/**
 * Jest/CRACO 매핑용 PortOne Browser SDK v2 스텁.
 * node_modules 의 dist/v2.cjs 가 없는 환경에서도 App 스모크가 해석되게 한다.
 */
const PortOne = {
  requestPayment: () => Promise.resolve({ paymentId: '' })
};

module.exports = PortOne;
module.exports.default = PortOne;
