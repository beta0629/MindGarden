/**
 * Jest용 PortOne Browser SDK v2 스텁.
 * node_modules에 패키지가 없어도 스위트가 로드되도록 한다.
 */
'use strict';

module.exports = {
  requestPayment: jest.fn()
};
