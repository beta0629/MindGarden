"use client";

import { useEffect, useState } from "react";
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

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 클라이언트 사이드에서 쿠키 읽기
    const cookieMap = parseCookie(typeof document !== "undefined" ? document.cookie ?? "" : "");
    const token = cookieMap.get("ops_token") ?? null;
    const redirectTo = searchParams?.get("redirect") ?? "/dashboard";

    if (token) {
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
