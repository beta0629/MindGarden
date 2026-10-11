/**
 * Jest용 PortOne Browser SDK v2 스텁.
 * node_modules/@portone/browser-sdk 가 없는 환경에서도 매퍼가 깨지지 않게 한다.
 */
const requestPayment = jest.fn(() => Promise.resolve({ paymentId: 'test-payment' }));

module.exports = {
  requestPayment,
  default: {
    requestPayment
  }
};
