/**
 * Shop 스택에 마운트 — PortOne WebView 결제 Promise 호스트.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import { useEffect, useState } from 'react';
import { PortOnePaymentWebView } from '@/components/shop/organisms/PortOnePaymentWebView';
import type { PortOnePaymentRequestParams, PortOnePaymentSdkResult } from '@/utils/portonePayment';
import {
  registerPortOnePaymentHost,
  type PortOnePaymentLaunchRequest,
} from '@/utils/portonePaymentBridge';
import { PORTONE_USER_CANCEL_CODE } from '@/constants/clientShopConstants';

/**
 * PortOnePaymentHost — layout에 한 번만 둔다.
 */
export function PortOnePaymentHost() {
  const [active, setActive] = useState<PortOnePaymentLaunchRequest | null>(null);
  const [request, setRequest] = useState<PortOnePaymentRequestParams | null>(null);

  useEffect(() => {
    registerPortOnePaymentHost((launchRequest) => {
      setActive(launchRequest);
      setRequest(launchRequest.params);
    });
    return () => {
      registerPortOnePaymentHost(null);
    };
  }, []);

  const clear = () => {
    setActive(null);
    setRequest(null);
  };

  const handleResult = (result: PortOnePaymentSdkResult | undefined) => {
    if (active) {
      active.resolve(result);
    }
    clear();
  };

  const handleDismiss = () => {
    if (active) {
      active.resolve({
        code: PORTONE_USER_CANCEL_CODE,
        message: `[${PORTONE_USER_CANCEL_CODE}] 사용자가 결제를 취소했습니다.`,
      });
    }
    clear();
  };

  return (
    <PortOnePaymentWebView
      visible={Boolean(active && request)}
      request={request}
      onResult={handleResult}
      onDismiss={handleDismiss}
    />
  );
}
