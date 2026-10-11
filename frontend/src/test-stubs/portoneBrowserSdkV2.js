/**
 * Jest 전용 PortOne V2 스텁.
 * node_modules/@portone/browser-sdk 가 없거나 ESM 전용일 때
 * App.test 등 간접 import 가 깨지지 않게 한다.
 */
const PortOne = {
  requestPayment: () => Promise.resolve({ paymentId: 'stub-payment' })
};

module.exports = PortOne;
module.exports.default = PortOne;
