"use client";

import { useState } from "react";
import MGButton from "@/components/ui/MGButton";

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    if (isPending) return;
    
    setIsPending(true);
    
    try {
      // 서버 API로 로그아웃 요청
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error);
      // API 실패해도 클라이언트 쿠키 삭제는 진행
    }
    
    // 클라이언트에서 쿠키 직접 삭제 (도메인과 경로 모두 명시)
    if (typeof document !== "undefined") {
      const domain = window.location.hostname;
      const cookieOptions = `path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      // 도메인별로 쿠키 삭제
      document.cookie = `ops_token=; ${cookieOptions}`;
      document.cookie = `ops_actor_id=; ${cookieOptions}`;
      document.cookie = `ops_actor_role=; ${cookieOptions}`;
      
      // 도메인 포함 쿠키 삭제 시도
      if (domain) {
        document.cookie = `ops_token=; ${cookieOptions}; domain=${domain}`;
        document.cookie = `ops_actor_id=; ${cookieOptions}; domain=${domain}`;
        document.cookie = `ops_actor_role=; ${cookieOptions}; domain=${domain}`;
      }
    }
    
    // 짧은 지연 후 전체 페이지 리로드를 통해 로그인 페이지로 이동
    // 이렇게 하면 쿠키가 완전히 삭제되고 인증 상태가 초기화됨
    setTimeout(() => {
      window.location.href = "/auth/login";
    }, 100);
  };

  return (
    <MGButton
      type="button"
      variant="outline"
      onClick={handleLogout}
      loading={isPending}
      loadingText="로그아웃 중..."
      preventDoubleClick={true}
      clickDelay={1000}
    >
      로그아웃
    </MGButton>
  );
}

