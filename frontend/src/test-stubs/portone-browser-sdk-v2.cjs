'use strict';

/**
 * Jest 전용 PortOne V2 stub.
 * node_modules/@portone/browser-sdk/dist/v2.cjs 가 없는 환경에서도
 * 모듈 해석이 실패하지 않도록 craco/package.json mapper 가 이 파일을 가리킨다.
 */
module.exports = {
  requestPayment: async function requestPayment() {
    return {};
  }
};
