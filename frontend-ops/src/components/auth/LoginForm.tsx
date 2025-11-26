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
        
        // 정적 빌드(개발/운영 서버)에서는 백엔드 API 직접 호출
        // 로컬 개발에서는 Next.js API 라우트 사용
        const isStaticBuild = typeof window !== "undefined" && !window.location.hostname.includes("localhost");
        const apiPath = isStaticBuild 
          ? "/api/v1/ops/auth/login"  // 백엔드 API (Nginx 프록시)
          : "/api/auth/login/";       // Next.js API 라우트
        
        console.log("[LoginForm] 로그인 API:", { apiPath, isStaticBuild });
        
        const response = await fetch(apiPath, {
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
          // 에러 메시지 처리
          let errorMessage = body?.message || "로그인에 실패했습니다. 입력 정보를 다시 확인하세요.";
          setFeedback(errorMessage);
          return;
        }

        // 로그인 성공
        const redirectPath = redirectTo || "/dashboard";
        
        // 정적 빌드에서는 백엔드 응답에서 토큰을 받아 직접 쿠키 설정
        if (isStaticBuild) {
          console.log("[LoginForm] 전체 응답:", body);
          
          // 응답 구조: { success: true, data: { token, actorId, actorRole } }
          const data = body?.data;
          if (!data) {
            console.error("[LoginForm] body.data가 없습니다:", body);
            setFeedback("로그인 응답 형식이 올바르지 않습니다.");
            return;
          }
          
          const token = data.token;
          const actorId = data.actorId || trimmedUsername;
          const actorRole = data.actorRole || "HQ_ADMIN";
          
          if (!token) {
            console.error("[LoginForm] 토큰이 없습니다:", data);
            setFeedback("로그인 응답에 토큰이 없습니다.");
            return;
          }
          
          // 쿠키 설정 (HTTPS에서는 secure 필요)
          const isHttps = window.location.protocol === "https:";
          const cookieOptions = `path=/; max-age=3600; samesite=lax${isHttps ? "; secure" : ""}`;
          
          document.cookie = `ops_token=${token}; ${cookieOptions}`;
          document.cookie = `ops_actor_id=${encodeURIComponent(actorId)}; ${cookieOptions}`;
          document.cookie = `ops_actor_role=${actorRole}; ${cookieOptions}`;
          
          console.log("[LoginForm] 쿠키 설정 완료:", { 
            token: token.substring(0, 30) + "...", 
            actorId, 
            actorRole,
            cookieOptions,
            isHttps
          });
          
          // 쿠키 설정 직후 확인
          console.log("[LoginForm] document.cookie:", document.cookie);
        }
        
        console.log("[LoginForm] 로그인 성공, 리다이렉트:", redirectPath);
        
        // 짧은 지연 후 리다이렉트 (쿠키 적용 대기)
        setTimeout(() => {
          console.log("[LoginForm] 쿠키 확인:", {
            hasCookie: document.cookie.includes("ops_token"),
            cookiePreview: document.cookie.substring(0, 100)
          });
          window.location.href = redirectPath;
        }, 500); // 500ms 지연
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

