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
        // 입력값 trim 처리
        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();
        
        if (!trimmedUsername || !trimmedPassword) {
          setFeedback("아이디와 비밀번호를 모두 입력해주세요.");
          return;
        }
        
        // Next.js API Route 사용 (서버 사이드에서 백엔드 호출)
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username: trimmedUsername, password: trimmedPassword }),
          credentials: "include" // 쿠키 포함
        });

        let body: any;
        try {
          body = await response.json();
        } catch (e) {
          setFeedback("서버 응답을 읽을 수 없습니다.");
          return;
        }

        if (!response.ok) {
          // ApiResponse 래퍼 처리
          let errorMessage = body?.message || "로그인에 실패했습니다. 입력 정보를 다시 확인하세요.";
          if (body?.success === false && body?.data?.message) {
            errorMessage = body.data.message;
          } else if (body?.data?.message) {
            errorMessage = body.data.message;
          }
          setFeedback(errorMessage);
          return;
        }

        // ApiResponse 래퍼 처리: { success: true, data: {...} } 형태면 data 추출
        let responseData = body;
        if (body && typeof body === 'object' && 'success' in body && 'data' in body && body.success) {
          responseData = body.data;
        }

        // Next.js API Route가 쿠키를 설정했으므로, 성공 응답만 확인
        // 쿠키는 서버 사이드에서 설정되므로 클라이언트에서 별도 설정 불필요
        if (!response.ok) {
          // 이미 위에서 처리했지만, 추가 확인
          return;
        }

        // 로그인 성공 - 쿠키는 Next.js API Route에서 설정됨
        // 전체 페이지 리로드를 통해 대시보드로 이동
        const redirectPath = redirectTo || "/dashboard";
        window.location.href = redirectPath;
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

