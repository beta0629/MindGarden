"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import MGButton from "@/components/ui/MGButton";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      router.replace("/auth/login");
      router.refresh();
    });
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

