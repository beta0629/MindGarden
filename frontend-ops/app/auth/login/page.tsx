"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";

function parseCookie(cookieString: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieString) {
    return map;
  }

  cookieString.split(";").forEach((entry) => {
    const [rawKey, ...rawValue] = entry.trim().split("=");
    if (!rawKey) {
      return;
    }
    const key = decodeURIComponent(rawKey);
    const value = decodeURIComponent(rawValue.join("="));
    map.set(key, value);
  });

  return map;
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 로그인 페이지 진입 시 처리
    const redirectTo = searchParams?.get("redirect");
    
    if (typeof document !== "undefined") {
      const cookieMap = parseCookie(document.cookie ?? "");
      const token = cookieMap.get("ops_token");
      
      // redirect 파라미터가 있고 토큰이 없으면 인증 실패로 리다이렉트된 것
      // (clientApi.ts에서 이미 쿠키를 삭제했으므로 여기서는 확인만)
      if (redirectTo && !token) {
        console.log("[LoginPage] 인증 실패로 리다이렉트됨 (쿠키는 이미 삭제됨)");
      } else if (!redirectTo && token) {
        // redirect 파라미터가 없고 토큰이 있으면 직접 접근이므로 대시보드로 리다이렉트
        const defaultRedirect = "/dashboard";
        console.log("[LoginPage] 유효한 토큰 있음, 대시보드로 리다이렉트");
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
