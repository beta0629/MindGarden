/**
 * 인증 체크 훅
 * 정적 export 환경에서 middleware가 작동하지 않으므로 클라이언트 사이드에서 인증 체크
 */

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

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

/**
 * 인증 체크 훅
 * 쿠키가 없으면 로그인 페이지로 리다이렉트
 */
export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // 공개 경로는 인증 체크 스킵
    if (PUBLIC_PATHS.some((path) => pathname?.startsWith(path))) {
      setIsAuthenticated(true);
      return;
    }

    // 클라이언트 사이드에서만 실행
    if (typeof window === "undefined") {
      return;
    }

    // 쿠키에서 토큰 확인
    const cookieString = document.cookie ?? "";
    const cookieMap = parseCookie(cookieString);
    const token = cookieMap.get("ops_token");

    if (!token || token.trim() === "") {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      const loginUrl =
        pathname && pathname !== "/"
          ? `/auth/login?redirect=${encodeURIComponent(pathname)}`
          : "/auth/login";
      console.log("[useAuth] 토큰 없음, 로그인 페이지로 리다이렉트:", loginUrl);
      router.push(loginUrl);
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  return { isAuthenticated };
}

