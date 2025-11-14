import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

import "../styles/globals.css";
import { LogoutButton } from "@/components/auth/LogoutButton";

export const metadata: Metadata = {
  title: "Trinity Ops Portal",
  description: "Trinity internal operations console",
  robots: {
    index: false,
    follow: false
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const actorId = cookieStore.get("ops_actor_id")?.value ?? null;
  const actorRole = cookieStore.get("ops_actor_role")?.value ?? null;

  return (
    <html lang="ko">
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
      </body>
    </html>
  );
}
