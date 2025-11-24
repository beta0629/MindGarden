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
    
    // 클라이언트 사이드에서 쿠키 읽기
    const cookieMap = parseCookie(typeof document !== "undefined" ? document.cookie ?? "" : "");
    const token = cookieMap.get("ops_token") ?? null;
    const redirectTo = searchParams?.get("redirect") ?? "/dashboard";

    // 토큰이 있고 redirect 파라미터가 없거나 대시보드인 경우에만 리다이렉트
    // 403 오류로 인한 리다이렉트는 무한 루프 방지를 위해 제외
    if (token && (!redirectTo || redirectTo === "/dashboard" || !redirectTo.includes("/onboarding/detail"))) {
      router.push(redirectTo);
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
