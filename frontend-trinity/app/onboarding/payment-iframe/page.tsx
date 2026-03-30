"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import "./payment-iframe.css";

/**
 * 토스페이먼츠 결제 수단 등록 iframe 페이지
 * 모달 내부에서 iframe으로 로드되어 토스페이먼츠 SDK를 실행
 * 모바일 반응형 최적화
 */
export default function PaymentIframePage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sdkLoadedRef = useRef(false);

  const customerKey = searchParams.get("customerKey");
  const customerName = searchParams.get("customerName");
  const customerEmail = searchParams.get("customerEmail");
  const successUrl = searchParams.get("successUrl");
  const failUrl = searchParams.get("failUrl");

  // TossPayments SDK 로드 대기 함수 (layout.tsx에서 로드됨)
  const waitForTossPaymentsSdk = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const timeout = 20000; // 20초 타임아웃
      const checkInterval = 100; // 100ms마다 체크
      const startTime = Date.now();

      // 이미 로드되어 있으면 즉시 resolve
      if (typeof (window as any).TossPayments !== "undefined") {
        console.log("[PaymentIframe] TossPayments SDK 이미 로드됨");
        sdkLoadedRef.current = true;
        resolve();
        return;
      }

      console.log("[PaymentIframe] TossPayments SDK 로드 대기 중... (layout.tsx에서 로드됨)");

      // TossPayments가 정의될 때까지 폴링
      const interval = setInterval(() => {
        if (typeof (window as any).TossPayments !== "undefined") {
          clearInterval(interval);
          console.log("[PaymentIframe] TossPayments SDK 로드 완료");
          sdkLoadedRef.current = true;
          resolve();
          return;
        }

        // 타임아웃 체크
        if (Date.now() - startTime >= timeout) {
          clearInterval(interval);
          reject(new Error("토스페이먼츠 SDK 로드 타임아웃 (20초). layout.tsx에서 스크립트가 로드되었는지 확인하세요."));
          return;
        }
      }, checkInterval);
    });
  };

  useEffect(() => {
    const initializeTossPayments = async () => {
      if (!customerKey || !successUrl || !failUrl) {
        setError("필수 파라미터가 누락되었습니다.");
        setLoading(false);
        return;
      }

      try {
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
        if (!clientKey) {
          throw new Error("토스페이먼츠 클라이언트 키가 설정되지 않았습니다.");
        }

        console.log("[PaymentIframe] SDK 로드 대기 시작... (layout.tsx에서 로드됨)");
        // SDK 로드 대기 (layout.tsx에서 로드됨)
        await waitForTossPaymentsSdk();

        if (typeof (window as any).TossPayments === "undefined") {
          throw new Error("토스페이먼츠 SDK가 로드되지 않았습니다.");
        }

        console.log("[PaymentIframe] TossPayments 초기화 시작...");
        const tossPayments = (window as any).TossPayments(clientKey);
        const payment = tossPayments.payment();

        console.log("[PaymentIframe] requestBillingAuth 호출...");
        setLoading(false);

        // 자동결제 등록창 열기
        await payment.requestBillingAuth({
          method: "CARD",
          customerKey: decodeURIComponent(customerKey),
          customerName: customerName ? decodeURIComponent(customerName) : undefined,
          customerEmail: customerEmail ? decodeURIComponent(customerEmail) : undefined,
          successUrl: decodeURIComponent(successUrl),
          failUrl: decodeURIComponent(failUrl),
          windowTarget: "self",
        });
      } catch (err) {
        console.error("[PaymentIframe] 토스페이먼츠 초기화 오류:", err);
        const errorMessage = err instanceof Error ? err.message : "카드 등록을 시작할 수 없습니다.";
        setError(errorMessage);
        setLoading(false);
        
        // 부모 창으로 오류 메시지 전달
        if (window.parent) {
          window.parent.postMessage(
            { type: "TOSS_PAYMENT_FAIL", error: errorMessage },
            window.location.origin
          );
        }
      }
    };

    initializeTossPayments();
  }, [customerKey, customerName, customerEmail, successUrl, failUrl]);

  return (
    <div className="payment-iframe__container">
      {loading && (
        <div className="payment-iframe__loading">
          <div className="payment-iframe__spinner" />
          <p className="payment-iframe__loading-text">카드 등록 페이지 로딩 중...</p>
        </div>
      )}
      {error && (
        <div className="payment-iframe__error">
          <p className="payment-iframe__error-title">오류 발생</p>
          <p className="payment-iframe__error-message">{error}</p>
        </div>
      )}
    </div>
  );
}

