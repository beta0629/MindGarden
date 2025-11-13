import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "MindGarden Ops Portal – 로그인"
};

interface LoginPageProps {
  searchParams?: {
    redirect?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = cookies();
  const token = cookieStore.get("ops_token")?.value ?? null;
  const redirectTo = searchParams?.redirect ?? "/dashboard";

  if (token) {
    redirect(redirectTo);
  }

  return (
    <main className="layout__content">
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}

