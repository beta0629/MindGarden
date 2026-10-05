"use client";

import { useState } from "react";

import {
  OPS_GNB_COPY,
  OPS_LOGOUT_REDIRECT_DELAY_MS
} from "@/constants/opsNav";
import { OPS_SHELL_PATHS } from "@/constants/opsShell";
import { logout } from "@/services/authApi";

type LogoutButtonProps = {
  label?: string;
  pendingLabel?: string;
  className?: string;
};

export function LogoutButton({
  label = OPS_GNB_COPY.LOGOUT,
  pendingLabel = OPS_GNB_COPY.LOGOUT_PENDING,
  className = "ops-shell__logout"
}: LogoutButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    if (isPending) {
      return;
    }
    setIsPending(true);
    try {
      await logout();
    } catch (error) {
      console.error("[LogoutButton] 로그아웃 실패:", error);
    }
    window.setTimeout(() => {
      window.location.href = OPS_SHELL_PATHS.LOGIN;
    }, OPS_LOGOUT_REDIRECT_DELAY_MS);
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleLogout}
      disabled={isPending}
      aria-label={label}
    >
      {isPending ? pendingLabel : label}
    </button>
  );
}
