"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

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
    <button
      type="button"
      className="ghost-button"
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}

