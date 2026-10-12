/**
 * Jest 전용 PortOne Browser SDK V2 스텁.
 * node_modules/@portone/browser-sdk 가 없는 환경에서도 모듈 해석이 실패하지 않게 한다.
 */
export const requestPayment = jest.fn();
