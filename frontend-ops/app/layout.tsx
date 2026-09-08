"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import "../styles/clinic-os-tokens.css";
import "../styles/globals.css";
import "../styles/ops-design-tokens.css";
import "../styles/ops-card-list.css";
import "../styles/ops-shell.css";
import { GlobalNotification } from "@/components/common/GlobalNotification";
import OpsLnb from "@/components/shell/OpsLnb";
import { OPS_PUBLIC_PATH_PREFIXES } from "@/constants/opsShell";

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

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  return OPS_PUBLIC_PATH_PREFIXES.some((path) => pathname.startsWith(path));
}

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
  const publicRoute = isPublicPath(pathname);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (publicRoute) {
      setAuthChecked(true);
      const cookieMap = parseCookie(document.cookie ?? "");
      setActorId(cookieMap.get("ops_actor_id") ?? null);
      setActorRole(cookieMap.get("ops_actor_role") ?? null);
      return;
    }

    const cookieMap = parseCookie(document.cookie ?? "");
    const token = cookieMap.get("ops_token");
    setActorId(cookieMap.get("ops_actor_id") ?? null);
    setActorRole(cookieMap.get("ops_actor_role") ?? null);

    if (!token || token.trim() === "") {
      if (pathname && !pathname.startsWith("/auth/login")) {
        const loginUrl =
          pathname !== "/"
            ? `/auth/login?redirect=${encodeURIComponent(pathname)}`
            : "/auth/login";
        router.push(loginUrl);
      }
    }

    setAuthChecked(true);
  }, [pathname, router, publicRoute]);

  const content = authChecked ? (
    children
  ) : (
    <div className="loading-message">
      <p>인증 확인 중...</p>
    </div>
  );

  return (
    <html lang="ko">
      <head>
        <title>Trinity Ops Portal</title>
        <meta name="description" content="Trinity internal operations console" />
        <meta name="robots" content="noindex, nofollow" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚙️</text></svg>"
        />
      </head>
      <body>
        {publicRoute ? (
          <div className="ops-shell--public">{content}</div>
        ) : (
          <div className="ops-shell">
            <OpsLnb actorId={actorId} actorRole={actorRole} />
            <div className="ops-shell__main">
              <main className="ops-shell__content">{content}</main>
            </div>
          </div>
        )}
        <GlobalNotification />
      </body>
    </html>
  );
}
