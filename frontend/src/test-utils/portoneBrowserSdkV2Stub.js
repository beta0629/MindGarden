/**
 * Jest 전용 PortOne Browser SDK v2 stub.
 * node_modules/@portone/browser-sdk 가 스냅샷에 없어도 App 관련 테스트가 해석되도록 둔다.
 */
export function requestPayment() {
  return Promise.resolve({});
}
