'use strict';

/**
 * Jest 전용 PortOne Browser SDK v2 스텁.
 * node_modules 패키지가 없는 가드레일/CI 환경에서도 모듈 매퍼가 파일을 찾을 수 있게 한다.
 */
async function requestPayment() {
  return {};
}

module.exports = {
  requestPayment
};
