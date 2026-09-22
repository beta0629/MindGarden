"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

/**
 * 토스페이먼츠 SDK 스크립트 로더 (클라이언트 컴포넌트)
 * Next.js의 Script 컴포넌트를 사용하여 로드
 */
export default function TossPaymentsScript() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // SDK가 로드되었는지 주기적으로 확인
    const checkInterval = setInterval(() => {
      if (typeof (window as any).TossPayments !== 'undefined') {
        setIsLoaded(true);
        clearInterval(checkInterval);
        console.log('[TossPaymentsScript] ✅ TossPayments SDK 로드 완료');
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      if (!isLoaded) {
        console.warn('[TossPaymentsScript] ⚠️ SDK 로드 타임아웃 (20초)');
      }
    }, 20000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [isLoaded]);

  return (
    <Script
      src="https://js.tosspayments.com/v2/standard"
      strategy="afterInteractive"
      id="toss-payments-sdk"
      onLoad={() => {
        console.log('[TossPaymentsScript] ✅ 스크립트 onLoad 이벤트 발생');
        // TossPayments 함수가 정의될 때까지 추가 대기
        setTimeout(() => {
          if (typeof (window as any).TossPayments !== 'undefined') {
            console.log('[TossPaymentsScript] ✅ TossPayments 함수 확인됨');
          } else {
            console.warn('[TossPaymentsScript] ⚠️ 스크립트는 로드되었지만 TossPayments 함수가 정의되지 않음');
          }
        }, 1000);
      }}
      onError={(e) => {
        console.error('[TossPaymentsScript] ❌ 스크립트 로드 실패:', e);
        console.error('[TossPaymentsScript] 🔍 디버깅 체크리스트:');
        console.error('[TossPaymentsScript] 1. 브라우저 개발자 도구 > 네트워크 탭에서 https://js.tosspayments.com/v2/standard 요청 확인');
        console.error('[TossPaymentsScript] 2. 응답 상태 코드 확인 (200이어야 함)');
        console.error('[TossPaymentsScript] 3. 콘솔에서 CSP 위반 메시지 확인');
        console.error('[TossPaymentsScript] 4. 방화벽/프록시 설정 확인');
        console.error('[TossPaymentsScript] 5. 브라우저에서 직접 https://js.tosspayments.com/v2/standard 접속 테스트');
        console.log('[TossPaymentsScript] 💡 bare /v2 URL은 403을 반환합니다 — 반드시 /v2/standard를 사용하세요');
      }}
    />
  );
}

