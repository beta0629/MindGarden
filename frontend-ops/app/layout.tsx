"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

import "../styles/globals.css";
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

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [actorId, setActorId] = useState<string | null>(null);
  const [actorRole, setActorRole] = useState<string | null>(null);

  useEffect(() => {
    // 클라이언트 사이드에서 쿠키 읽기
    const cookieMap = parseCookie(typeof document !== "undefined" ? document.cookie ?? "" : "");
    setActorId(cookieMap.get("ops_actor_id") ?? null);
    setActorRole(cookieMap.get("ops_actor_role") ?? null);
  }, []);

  return (
    <html lang="ko">
      <head>
        <title>Trinity Ops Portal</title>
        <meta name="description" content="Trinity internal operations console" />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>
        <div className="layout">
          <header className="layout__header">
            <div className="layout__brand">
              <Link href="/dashboard">Trinity Ops Portal</Link>
            </div>
            <nav className="layout__nav">
              <Link href="/dashboard">대시보드</Link>
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
          <main className="layout__content">{children}</main>
        </div>
        <GlobalNotification />
      </body>
    </html>
  );
}
