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
    
    // 로그인 페이지 진입 시 기존 쿠키 삭제 (유효하지 않은 토큰으로 인한 무한 루프 방지)
    const redirectTo = searchParams?.get("redirect");
    
    // redirect 파라미터가 있으면 인증 실패로 리다이렉트된 것이므로 쿠키 삭제
    if (redirectTo && typeof document !== "undefined") {
      console.log("[LoginPage] 인증 실패로 리다이렉트됨, 기존 쿠키 삭제");
      document.cookie = "ops_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "ops_actor_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "ops_actor_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } else {
      // redirect 파라미터가 없으면 직접 접근이므로 토큰 확인
      const cookieMap = parseCookie(typeof document !== "undefined" ? document.cookie ?? "" : "");
      const token = cookieMap.get("ops_token") ?? null;
      const defaultRedirect = "/dashboard";

      // 토큰이 있으면 대시보드로 리다이렉트
      if (token) {
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
