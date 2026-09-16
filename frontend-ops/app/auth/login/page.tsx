"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { hasOpsAuthSession } from "@/utils/opsAuthSession";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 로그인 페이지 진입 시 처리
    const redirectTo = searchParams?.get("redirect");
    
    if (typeof window !== "undefined") {
      const hasSession = hasOpsAuthSession();
      
      // redirect 파라미터가 있고 세션이 없으면 인증 실패로 리다이렉트된 것
      if (redirectTo && !hasSession) {
        console.log("[LoginPage] 인증 실패로 리다이렉트됨 (세션 없음)");
      } else if (!redirectTo && hasSession) {
        // redirect 파라미터가 없고 세션이 있으면 직접 접근이므로 대시보드로 리다이렉트
        const defaultRedirect = "/dashboard";
        console.log("[LoginPage] 유효한 세션 있음, 대시보드로 리다이렉트");
        router.push(defaultRedirect);
      }
    }
  }, [searchParams, router]);

  if (!mounted) {
    return (
      <main className="layout__content">
        <div className="loading-message">
          <p>로딩 중...</p>
        </div>
      </main>
    );
  }

  const redirectTo = searchParams?.get("redirect") ?? "/dashboard";

  return (
    <main className="layout__content">
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="layout__content">
        <div className="loading-message">
          <p>로딩 중...</p>
        </div>
      </main>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
