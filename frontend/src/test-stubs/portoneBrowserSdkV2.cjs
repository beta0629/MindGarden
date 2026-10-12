/**
 * Jest 전용 PortOne V2 stub.
 * node_modules/@portone/browser-sdk 가 없는 환경에서도 모듈 해석이 되도록 둔다.
 */
'use strict';

module.exports = {
  requestPayment: function requestPayment() {
    return Promise.resolve({});
  }
};
