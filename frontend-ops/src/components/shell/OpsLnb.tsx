"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { ONBOARDING_PATHS } from "@/constants/onboarding";
import {
  OPS_SHELL_CHROME,
  OPS_SHELL_LNB_ITEMS,
  OPS_SHELL_PATHS
} from "@/constants/opsShell";

/**
 * OpsLnb — 승인된 3항 내비. 신청 심사에서도 테넌트가 현재 위치다.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

type OpsLnbProps = {
  actorId?: string | null;
  embedded?: boolean;
  showSessionAction?: boolean;
  onNavigate?: () => void;
};

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) {
    return false;
  }
  const current = normalizePath(pathname);
  const target = normalizePath(href);
  if (target === OPS_SHELL_PATHS.TENANTS) {
    return (
      current === target ||
      current === "/" ||
      current.startsWith(`${target}/`) ||
      current === ONBOARDING_PATHS.LIST ||
      current.startsWith(`${ONBOARDING_PATHS.LIST}/`)
    );
  }
  return current === target || current.startsWith(`${target}/`);
}

export default function OpsLnb({
  actorId = null,
  embedded = false,
  showSessionAction = true,
  onNavigate
}: OpsLnbProps) {
  const pathname = usePathname();
  const asideClass = embedded
    ? "mg-v2-desktop-lnb mg-v2-desktop-lnb--embedded"
    : "mg-v2-desktop-lnb";

  return (
    <aside className={asideClass} aria-label={OPS_SHELL_CHROME.NAV_LABEL}>
      <nav className="mg-v2-desktop-lnb__nav">
        <ul className="mg-v2-desktop-lnb__list">
          {OPS_SHELL_LNB_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href} className="mg-v2-desktop-lnb__item">
                <Link
                  href={item.href}
                  className={
                    active
                      ? "mg-v2-desktop-lnb__link mg-v2-desktop-lnb__link--active"
                      : "mg-v2-desktop-lnb__link"
                  }
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {showSessionAction && actorId ? (
        <div className="mg-v2-desktop-lnb__footer ops-shell__logout">
          <LogoutButton />
        </div>
      ) : null}
      {showSessionAction && !actorId ? (
        <div className="mg-v2-desktop-lnb__footer">
          <Link className="mg-v2-desktop-lnb__link" href={OPS_SHELL_PATHS.LOGIN} onClick={onNavigate}>
            {OPS_SHELL_CHROME.LOGIN}
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
