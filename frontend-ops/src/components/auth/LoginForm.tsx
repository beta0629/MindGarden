"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MGButton from "@/components/ui/MGButton";

interface LoginFormProps {
  redirectTo: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username, password })
        });

        const body = await response.json();

        if (!response.ok) {
          setFeedback(
            body?.message ?? "로그인에 실패했습니다. 입력 정보를 다시 확인하세요."
          );
          return;
        }

        router.replace(redirectTo || "/dashboard");
        router.refresh();
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "로그인 처리 중 오류가 발생했습니다."
        );
      }
    });
  };

  return (
    <form className="form-card form-card--auth" onSubmit={handleSubmit}>
      <h1>내부 운영 포털 로그인</h1>
      <p className="form-helper">
        MindGarden HQ 전용 시스템입니다. 승인된 계정만 로그인할 수 있습니다.
      </p>

      <div className="form-grid">
        <label className="form-field form-field--full">
          <span>아이디</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="예: ops-admin"
            autoComplete="username"
            disabled={isPending}
            required
          />
        </label>

        <label className="form-field form-field--full">
          <span>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
            disabled={isPending}
            required
          />
        </label>
      </div>

      <div className="form-footer">
        <MGButton
          type="submit"
          variant="primary"
          loading={isPending}
          loadingText="로그인 중..."
          preventDoubleClick={false}
          disabled={isPending}
        >
          로그인
        </MGButton>
        {feedback && (
          <p className="form-feedback form-feedback--error">{feedback}</p>
        )}
      </div>
    </form>
  );
}

