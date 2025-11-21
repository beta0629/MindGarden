import Script from "next/script";

/**
 * PaymentIframe 페이지 전용 레이아웃
 * TossPayments SDK를 미리 로드합니다.
 */
export default function PaymentIframeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* TossPayments SDK를 head에 직접 추가 */}
      <Script
        src="https://js.tosspayments.com/v2"
        strategy="afterInteractive"
        id="toss-payments-sdk"
      />
      {children}
    </>
  );
}

