"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import "../styles/clinic-os-tokens.css";
import "../styles/globals.css";
import "../styles/ops-design-tokens.css";
import "../styles/ops-card-list.css";
import "../styles/ops-shell.css";
import "../styles/ops-onboarding.css";
import "../styles/ops-tenants.css";
import { GlobalNotification } from "@/components/common/GlobalNotification";
import OpsLnb from "@/components/shell/OpsLnb";
import { ONBOARDING_MESSAGES, ONBOARDING_PATHS } from "@/constants/onboarding";
import {
  OPS_PUBLIC_PATH_PREFIXES,
  OPS_SHELL_BRAND,
  OPS_SHELL_CHROME
} from "@/constants/opsShell";
import {
  getOpsAuthSession,
  hasOpsAuthSession
} from "@/utils/opsAuthSession";

// output: export 모드에서는 metadata를 사용할 수 없으므로 제거
// export const metadata: Metadata = { ... };

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
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
  const [authChecked, setAuthChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const publicRoute = isPublicPath(pathname);
  const normalizedPath = pathname ? normalizePath(pathname) : "";
  const onboardingDetail = normalizedPath === ONBOARDING_PATHS.DETAIL;
  const onboardingRoute = normalizedPath === ONBOARDING_PATHS.LIST || onboardingDetail;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const session = getOpsAuthSession();
    setActorId(session.actorId || null);

    if (publicRoute) {
      setAuthChecked(true);
      return;
    }

    if (!hasOpsAuthSession()) {
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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

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
            <header
              className={
                onboardingDetail
                  ? "ops-shell__gnb ops-shell__gnb--back"
                  : "ops-shell__gnb"
              }
            >
              {onboardingDetail ? (
                <Link
                  className="ops-shell__icon-button"
                  href={ONBOARDING_PATHS.LIST}
                  aria-label={OPS_SHELL_CHROME.BACK_LABEL}
                >
                  {OPS_SHELL_CHROME.BACK_GLYPH}
                </Link>
              ) : (
                <button
                  type="button"
                  className="ops-shell__icon-button"
                  aria-label={OPS_SHELL_CHROME.MENU_LABEL}
                  aria-expanded={menuOpen}
                  aria-controls="ops-shell-drawer"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  {OPS_SHELL_CHROME.MENU_GLYPH}
                </button>
              )}
              <strong className="ops-shell__brand ops-shell__brand--product">{OPS_SHELL_BRAND}</strong>
              {onboardingDetail ? (
                <strong className="ops-shell__brand ops-shell__brand--detail">
                  {ONBOARDING_MESSAGES.PAGE_TITLE}
                </strong>
              ) : null}
              <span className="ops-shell__actor">{actorId || ""}</span>
            </header>
            <div className="ops-shell__body">
              <div className="ops-shell__lnb">
                <OpsLnb />
              </div>
              <div className="ops-shell__main">
                <main
                  className={
                    onboardingRoute
                      ? "ops-shell__content ops-shell__content--onboarding"
                      : "ops-shell__content"
                  }
                >
                  {content}
                </main>
              </div>
            </div>
            {menuOpen ? (
              <div
                id="ops-shell-drawer"
                className="ops-shell__drawer"
                role="presentation"
                onClick={() => setMenuOpen(false)}
              >
                <div
                  className="ops-shell__drawer-panel"
                  onClick={(event) => event.stopPropagation()}
                >
                  <OpsLnb embedded onNavigate={() => setMenuOpen(false)} />
                </div>
              </div>
            ) : null}
          </div>
        )}
        <GlobalNotification />
      </body>
    </html>
  );
}
