"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { OPS_SHELL_PATHS } from "@/constants/opsShell";

/**
 * 인증 후 기본 랜딩 — 테넌트(main)
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(OPS_SHELL_PATHS.TENANTS);
  }, [router]);

  return (
    <div className="loading-message">
      <p>리다이렉트 중...</p>
    </div>
  );
}
