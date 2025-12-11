"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MGButton from "@/components/ui/MGButton";
import { login, type LoginRequest } from "@/services/authApi";

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
        // 입력값 trim 처리
        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();
        
        if (!trimmedUsername || !trimmedPassword) {
          setFeedback("아이디와 비밀번호를 모두 입력해주세요.");
          return;
        }
        
        // 표준화된 로그인 API 호출
        const loginRequest: LoginRequest = {
          username: trimmedUsername,
          password: trimmedPassword
        };
        
        const responseData = await login(loginRequest);
        
        // 로그인 성공 - Next.js API 라우트에서 서버 사이드 쿠키가 이미 설정됨
        const redirectPath = redirectTo || "/dashboard";
        
        console.log("[LoginForm] 로그인 성공:", {
          actorId: responseData.actorId,
          actorRole: responseData.actorRole
        });
        
        // 서버 사이드 쿠키가 설정되었으므로 바로 리다이렉트
        // 브라우저가 자동으로 쿠키를 포함하여 다음 요청 전송
        window.location.href = redirectPath;
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : "로그인 처리 중 오류가 발생했습니다.";
        setFeedback(errorMessage);
        console.error("[LoginForm] 로그인 실패:", error);
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

