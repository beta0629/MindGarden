/**
 * Jest 전용 PortOne Browser SDK v2 스텁.
 * node_modules 패키지가 없어도 App 그래프 테스트가 모듈을 해석한다.
 */
function requestPayment() {
  return Promise.resolve({ paymentId: 'stub-payment' });
}

module.exports = {
  requestPayment
};
