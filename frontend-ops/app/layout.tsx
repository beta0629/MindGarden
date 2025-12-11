"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import "../styles/globals.css";
import "../styles/ops-design-tokens.css";
import "../styles/ops-card-list.css";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { GlobalNotification } from "@/components/common/GlobalNotification";

// output: export 모드에서는 metadata를 사용할 수 없으므로 제거
// export const metadata: Metadata = { ... };

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

const PUBLIC_PATHS = ["/auth/login", "/api/auth/login", "/api/auth/logout"];

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [actorId, setActorId] = useState<string | null>(null);
  const [actorRole, setActorRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === "undefined") {
      return;
    }

    // 공개 경로는 인증 체크 스킵
    if (PUBLIC_PATHS.some((path) => pathname?.startsWith(path))) {
      setAuthChecked(true);
      const cookieMap = parseCookie(document.cookie ?? "");
      setActorId(cookieMap.get("ops_actor_id") ?? null);
      setActorRole(cookieMap.get("ops_actor_role") ?? null);
      return;
    }

    // 쿠키에서 토큰 확인
    const cookieMap = parseCookie(document.cookie ?? "");
    const token = cookieMap.get("ops_token");
    setActorId(cookieMap.get("ops_actor_id") ?? null);
    setActorRole(cookieMap.get("ops_actor_role") ?? null);

    // 모든 환경에서 클라이언트 사이드 인증 체크 (로컬과 개발 서버 통일)
    // 로컬에서도 정적 export 모드와 동일하게 동작하도록 통일
    if (!token || token.trim() === "") {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      const loginUrl =
        pathname && pathname !== "/"
          ? `/auth/login?redirect=${encodeURIComponent(pathname)}`
          : "/auth/login";
      console.log("[RootLayout] 토큰 없음, 로그인 페이지로 리다이렉트:", loginUrl);
      router.push(loginUrl);
    }
    
    setAuthChecked(true);
  }, [pathname, router]);

  return (
    <html lang="ko">
      <head>
        <title>Trinity Ops Portal</title>
        <meta name="description" content="Trinity internal operations console" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚙️</text></svg>" />
      </head>
      <body>
        <div className="layout">
          <header className="layout__header">
            <div className="layout__brand">
              <Link href="/dashboard">Trinity Ops Portal</Link>
            </div>
            <nav className="layout__nav">
              <Link href="/dashboard">대시보드</Link>
              <Link href="/tenants">테넌트</Link>
              <Link href="/onboarding">온보딩</Link>
              <Link href="/pricing">요금제</Link>
              <Link href="/feature-flags">Feature Flag</Link>
            </nav>
            <div className="layout__user">
              {actorId ? (
                <>
                  <span className="layout__user-id">
                    {actorId}
                    {actorRole ? ` · ${actorRole}` : ""}
                  </span>
                  <LogoutButton />
                </>
              ) : (
                <Link className="ghost-button" href="/auth/login">
                  로그인
                </Link>
              )}
            </div>
          </header>
          <main className="layout__content">
            {authChecked ? children : (
              <div className="loading-message">
                <p>인증 확인 중...</p>
              </div>
            )}
          </main>
        </div>
        <GlobalNotification />
      </body>
    </html>
  );
}
