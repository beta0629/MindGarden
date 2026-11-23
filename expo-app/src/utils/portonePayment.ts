/**
 * 포트원 V2 결제 요청 유틸 (Expo WebView 브리지).
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import { requireCompletePortOneCustomer } from '@/utils/clientShopPaymentCustomer';
import { launchPortOnePaymentViaHost } from '@/utils/portonePaymentBridge';

/** PortOne V2 카드 일시불(개월 0) — SDK monthOption.fixedMonth */
export const PORTONE_CARD_INSTALLMENT_LUMP_SUM = {
  installment: {
    monthOption: {
      fixedMonth: 0,
    },
  },
} as const;

/** PortOne V2 browser SDK CDN (하드코딩 채널키 금지 — URL만 고정) */
export const PORTONE_BROWSER_SDK_CDN = 'https://cdn.portone.io/v2/browser-sdk.js';

const nonBlankTrimmed = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed || null;
};

export type PortOnePaymentCustomer = {
  email: string;
  fullName: string;
  phoneNumber: string;
};

export type PortOnePaymentRequestParams = {
  storeId: string;
  channelKey: string;
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency: string;
  payMethod: string;
  redirectUrl?: string;
  customer?: PortOnePaymentCustomer;
  card?: typeof PORTONE_CARD_INSTALLMENT_LUMP_SUM | Record<string, unknown>;
  customData?: Record<string, string>;
};

export type PortOnePaymentSdkResult = {
  code?: string;
  message?: string;
  paymentId?: string;
  pgCode?: string;
  pgMessage?: string;
  [key: string]: unknown;
};

export type RequestPortOnePaymentInput = {
  storeId: string;
  channelKey: string;
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency?: string;
  payMethod?: string;
  redirectUrl?: string;
  customer?: Record<string, unknown> | null;
  card?: Record<string, unknown>;
  customData?: Record<string, unknown>;
};

/**
 * PortOne.requestPayment 에 넘길 요청 객체를 만든다 (채널키·storeId invent 금지).
 *
 * @param input 호출자 입력
 */
export const buildPortOnePaymentRequest = (
  input: RequestPortOnePaymentInput,
): PortOnePaymentRequestParams => {
  const {
    storeId,
    channelKey,
    paymentId,
    orderName,
    totalAmount,
    currency = 'KRW',
    payMethod,
    redirectUrl,
    customer,
    card,
    customData,
  } = input;

  if (!storeId || !String(storeId).trim()) {
    throw new Error('포트원 storeId 가 없습니다.');
  }
  if (!channelKey || !String(channelKey).trim()) {
    throw new Error('포트원 channelKey 가 없습니다.');
  }
  if (!paymentId || !String(paymentId).trim()) {
    throw new Error('paymentId 가 없습니다.');
  }
  const amount = Number(totalAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('결제 금액이 유효하지 않습니다.');
  }

  const resolvedPayMethod = (payMethod && String(payMethod).trim()) || 'CARD';
  const request: PortOnePaymentRequestParams = {
    storeId: String(storeId).trim(),
    channelKey: String(channelKey).trim(),
    paymentId: String(paymentId).trim(),
    orderName: orderName || '결제',
    totalAmount: amount,
    currency: currency || 'KRW',
    payMethod: resolvedPayMethod,
  };
  if (redirectUrl) {
    request.redirectUrl = redirectUrl;
  }

  if (customer && typeof customer === 'object') {
    const complete = requireCompletePortOneCustomer(customer);
    request.customer = {
      email: complete.email,
      fullName: complete.fullName,
      phoneNumber: complete.phoneNumber,
    };
  }

  const normalizedPayMethod = String(resolvedPayMethod).trim().toUpperCase();
  if (card && typeof card === 'object') {
    request.card = card;
  } else if (normalizedPayMethod === 'CARD') {
    request.card = PORTONE_CARD_INSTALLMENT_LUMP_SUM;
  }

  if (customData && typeof customData === 'object' && !Array.isArray(customData)) {
    const sanitized: Record<string, string> = {};
    Object.keys(customData).forEach((key) => {
      const value = nonBlankTrimmed(customData[key]);
      if (value) {
        sanitized[key] = value;
      }
    });
    if (Object.keys(sanitized).length > 0) {
      request.customData = sanitized;
    }
  }

  return request;
};

/**
 * WebView HTML 소스 — PortOne V2 browser SDK 로드 후 requestPayment.
 *
 * @param request buildPortOnePaymentRequest 결과
 */
export const buildPortOnePaymentWebViewHtml = (
  request: PortOnePaymentRequestParams,
): string => {
  const payloadJson = JSON.stringify(request).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <title>결제</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 24px; color: #222; }
    .msg { font-size: 15px; line-height: 1.5; }
  </style>
  <script src="${PORTONE_BROWSER_SDK_CDN}"></script>
</head>
<body>
  <p class="msg" id="status">결제 창을 여는 중…</p>
  <script>
    (function () {
      var request = ${payloadJson};
      function post(type, payload) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || null }));
          }
        } catch (e) {}
      }
      function setStatus(text) {
        var el = document.getElementById('status');
        if (el) el.textContent = text;
      }
      function run() {
        if (!window.PortOne || typeof window.PortOne.requestPayment !== 'function') {
          setStatus('결제 모듈을 불러오지 못했습니다.');
          post('PORTONE_ERROR', { message: 'PortOne SDK load failed' });
          return;
        }
        setStatus('결제 진행 중…');
        window.PortOne.requestPayment(request)
          .then(function (result) {
            post('PORTONE_RESULT', result || {});
          })
          .catch(function (err) {
            var message = (err && err.message) ? String(err.message) : '결제에 실패했습니다.';
            var code = (err && err.code) ? String(err.code) : undefined;
            post('PORTONE_RESULT', { code: code || 'PAYMENT_ERROR', message: message });
          });
      }
      if (document.readyState === 'complete') {
        run();
      } else {
        window.addEventListener('load', run);
      }
    })();
  </script>
</body>
</html>`;
};

/**
 * 포트원 V2 requestPayment — WebView 호스트를 통해 실행.
 *
 * @param input storeId/channelKey/paymentId 등 (prepare 응답만)
 */
export const requestPortOnePayment = async (
  input: RequestPortOnePaymentInput,
): Promise<PortOnePaymentSdkResult | undefined> => {
  const request = buildPortOnePaymentRequest(input);
  return launchPortOnePaymentViaHost(request);
};
