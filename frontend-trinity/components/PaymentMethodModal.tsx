"use client";

import { useEffect, useState, useRef } from "react";
import { COMPONENT_CSS } from "../constants/css-variables";
import "./PaymentMethodModal.css";

/**
 * X 아이콘 컴포넌트 (닫기 버튼용)
 */
function CloseIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (authKey: string, customerKey: string) => void;
  onError: (error: string) => void;
  customerKey: string;
  customerName?: string;
  customerEmail?: string;
  useIframe?: boolean; // iframe 사용 여부 (기본값: true)
}

/**
 * 토스페이먼츠 결제 수단 등록 모달
 * iframe 방식 (기본) 또는 팝업 방식 지원
 */
export default function PaymentMethodModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  customerKey,
  customerName,
  customerEmail,
  useIframe = true, // 기본값: iframe 사용
}: PaymentMethodModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // iframe 메시지 리스너 (콜백 페이지에서 전송)
  // 모달이 열릴 때 body 스크롤 방지 (모바일 최적화)
  useEffect(() => {
    if (isOpen) {
      // 원래 스크롤 위치 저장
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // 스크롤 복원
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      // 보안: 같은 origin에서 온 메시지만 처리
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === "TOSS_PAYMENT_SUCCESS") {
        const { authKey, customerKey: key } = event.data;
        setIsLoading(false);
        setIframeUrl(null);
        onSuccess(authKey, key);
        onClose();
      } else if (event.data.type === "TOSS_PAYMENT_FAIL") {
        const { error } = event.data;
        setIsLoading(false);
        setIframeUrl(null);
        onError(error || "카드 등록에 실패했습니다.");
        onClose();
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [isOpen, onSuccess, onError, onClose]);

  // 팝업 창 닫힘 감지 (팝업 방식 사용 시)
  useEffect(() => {
    if (!popupWindow || useIframe) return;

    const checkPopupClosed = setInterval(() => {
      if (popupWindow.closed) {
        setIsLoading(false);
        setPopupWindow(null);
        clearInterval(checkPopupClosed);
      }
    }, 500);

    return () => {
      clearInterval(checkPopupClosed);
    };
  }, [popupWindow, useIframe]);

  // 모달이 열릴 때 자동으로 토스페이먼츠 페이지 로드
  useEffect(() => {
    if (!isOpen || !customerKey) return;

    const initializePayment = async () => {
      try {
        setIsLoading(true);

        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        const successUrl = `${baseUrl}/onboarding/callback?status=success&customerKey=${encodeURIComponent(customerKey)}&tenantName=${encodeURIComponent(customerName || "")}&contactEmail=${encodeURIComponent(customerEmail || "")}`;
        const failUrl = `${baseUrl}/onboarding/callback?status=fail&customerKey=${encodeURIComponent(customerKey)}&tenantName=${encodeURIComponent(customerName || "")}&contactEmail=${encodeURIComponent(customerEmail || "")}`;

        if (useIframe) {
          // iframe 방식: 토스페이먼츠 SDK를 사용하여 URL 생성
          // 토스페이먼츠는 직접 iframe을 지원하지 않으므로,
          // 중간 페이지를 통해 iframe으로 로드
          const intermediateUrl = `${baseUrl}/onboarding/payment-iframe?customerKey=${encodeURIComponent(customerKey)}&customerName=${encodeURIComponent(customerName || "")}&customerEmail=${encodeURIComponent(customerEmail || "")}&successUrl=${encodeURIComponent(successUrl)}&failUrl=${encodeURIComponent(failUrl)}`;
          setIframeUrl(intermediateUrl);
          setIsLoading(false);
        } else {
          // 팝업 방식: 팝업 창 열기
          await openPaymentPopup(successUrl, failUrl);
        }
      } catch (err) {
        console.error("결제 초기화 실패:", err);
        setIsLoading(false);
        onError(err instanceof Error ? err.message : "카드 등록을 시작할 수 없습니다.");
      }
    };

    initializePayment();
  }, [isOpen, customerKey, customerName, customerEmail, useIframe, onError]);

  const openPaymentPopup = async (successUrl: string, failUrl: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    
    // 팝업 창 열기
    const popup = window.open(
      "",
      "tossPayment",
      "width=600,height=800,scrollbars=yes,resizable=yes"
    );

    if (!popup) {
      throw new Error("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
    }

    setPopupWindow(popup);

    // 토스페이먼츠 SDK 초기화 및 팝업에서 실행
    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>카드 등록</title>
          <script src="https://js.tosspayments.com/v2"></script>
        </head>
        <body>
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
            <div>카드 등록 페이지 로딩 중...</div>
          </div>
          <script>
            (async function() {
              try {
                const clientKey = "${process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ""}";
                if (!clientKey) {
                  throw new Error("토스페이먼츠 클라이언트 키가 설정되지 않았습니다.");
                }

                // SDK 로드 대기
                let retries = 0;
                while (typeof window.TossPayments === 'undefined' && retries < 50) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                  retries++;
                }

                if (typeof window.TossPayments === 'undefined') {
                  throw new Error("토스페이먼츠 SDK가 로드되지 않았습니다.");
                }

                const tossPayments = window.TossPayments(clientKey);
                const payment = tossPayments.payment();

                await payment.requestBillingAuth({
                  method: 'CARD',
                  customerKey: "${customerKey}",
                  customerName: "${customerName || ""}",
                  customerEmail: "${customerEmail || ""}",
                  successUrl: "${successUrl}",
                  failUrl: "${failUrl}",
                  windowTarget: 'self',
                });
              } catch (error) {
                console.error("토스페이먼츠 오류:", error);
                window.opener.postMessage({
                  type: "TOSS_PAYMENT_FAIL",
                  error: error.message || "카드 등록 중 오류가 발생했습니다."
                }, "${baseUrl}");
                window.close();
              }
            })();
          </script>
        </body>
      </html>
    `);
  };

  if (!isOpen) return null;

  return (
    <div className="payment-method-modal__overlay" onClick={onClose}>
      <div
        className="payment-method-modal__container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="payment-method-modal__header">
          <h2 className="payment-method-modal__title">카드 등록</h2>
          <button
            className="payment-method-modal__close-button"
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseIcon size={24} />
          </button>
        </div>
        <div className="payment-method-modal__content">
          {isLoading && !iframeUrl ? (
            <div className="payment-method-modal__loading">
              <p>카드 등록 페이지를 로딩 중...</p>
            </div>
          ) : iframeUrl ? (
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              className="payment-method-modal__iframe"
              title="카드 등록"
              allow="payment"
            />
          ) : (
            <div className="payment-method-modal__info">
              <p>카드 등록을 위해 토스페이먼츠 페이지가 열립니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

