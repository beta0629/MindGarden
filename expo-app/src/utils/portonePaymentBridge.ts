/**
 * PortOne WebView 호스트 브리지 — RN에서 requestPayment Promise 를 기다린다.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import type { PortOnePaymentRequestParams, PortOnePaymentSdkResult } from '@/utils/portonePayment';

export type PortOnePaymentLaunchRequest = {
  params: PortOnePaymentRequestParams;
  resolve: (result: PortOnePaymentSdkResult | undefined) => void;
  reject: (error: Error) => void;
};

type PortOnePaymentHostListener = (request: PortOnePaymentLaunchRequest) => void;

let hostListener: PortOnePaymentHostListener | null = null;
let pendingRequest: PortOnePaymentLaunchRequest | null = null;

/**
 * Shop 레이아웃의 PortOnePaymentHost 가 등록한다.
 *
 * @param listener 결제 요청 수신자 (null 이면 해제)
 */
export function registerPortOnePaymentHost(
  listener: PortOnePaymentHostListener | null,
): void {
  hostListener = listener;
  if (listener && pendingRequest) {
    const req = pendingRequest;
    pendingRequest = null;
    listener(req);
  }
}

/**
 * WebView 호스트로 결제 요청을 넘기고 SDK/redirect 결과를 기다린다.
 *
 * @param params PortOne requestPayment 파라미터
 */
export function launchPortOnePaymentViaHost(
  params: PortOnePaymentRequestParams,
): Promise<PortOnePaymentSdkResult | undefined> {
  return new Promise((resolve, reject) => {
    const request: PortOnePaymentLaunchRequest = { params, resolve, reject };
    if (hostListener) {
      hostListener(request);
      return;
    }
    pendingRequest = request;
  });
}

/**
 * 호스트가 언마운트될 때 대기 중 요청을 실패 처리한다.
 *
 * @param message 오류 메시지
 */
export function rejectPendingPortOnePayment(message: string): void {
  if (pendingRequest) {
    pendingRequest.reject(new Error(message));
    pendingRequest = null;
  }
}
