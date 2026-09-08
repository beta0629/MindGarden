"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  OPS_SHELL_BRAND,
  OPS_SHELL_LNB_ITEMS,
  OPS_SHELL_PATHS
} from "@/constants/opsShell";
import { LogoutButton } from "@/components/auth/LogoutButton";

/**
 * OpsLnb — DesktopLnb twin wrapper (slate sidebar, Phase 1 3-item IA).
 * No new LNB organism; reuses .mg-v2-desktop-lnb classes.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

type OpsLnbProps = {
  actorId?: string | null;
  actorRole?: string | null;
};

function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) {
    return false;
  }
  if (href === OPS_SHELL_PATHS.OVERVIEW) {
    return pathname === href || pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function OpsLnb({ actorId = null, actorRole = null }: OpsLnbProps) {
  const pathname = usePathname();

  return (
    <aside className="mg-v2-desktop-lnb" role="navigation" aria-label="Ops 좌측 메뉴">
      <div className="mg-v2-desktop-lnb__header">
        <Link href={OPS_SHELL_PATHS.OVERVIEW} className="mg-v2-desktop-lnb__title">
          {OPS_SHELL_BRAND}
        </Link>
        {actorId ? (
          <span className="mg-v2-desktop-lnb__user">
            {actorId}
            {actorRole ? ` · ${actorRole}` : ""}
          </span>
        ) : null}
      </div>
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
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mg-v2-desktop-lnb__footer">
        {actorId ? (
          <LogoutButton />
        ) : (
          <Link className="ghost-button" href={OPS_SHELL_PATHS.LOGIN}>
            로그인
          </Link>
        )}
      </div>
    </aside>
  );
}
