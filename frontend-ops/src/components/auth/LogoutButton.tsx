"use client";

import { useState } from "react";
import MGButton from "@/components/ui/MGButton";
import { logout } from "@/services/authApi";

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    if (isPending) return;
    
    setIsPending(true);
    
    try {
      // 표준화된 로그아웃 API 호출
      await logout();
    } catch (error) {
      console.error("[LogoutButton] 로그아웃 실패:", error);
      // API 실패해도 클라이언트 쿠키 삭제는 진행 (logout 함수 내부에서 처리)
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

