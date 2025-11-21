"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { decideOnboarding, retryOnboardingApproval } from "@/services/onboardingClient";
import { OnboardingStatus } from "@/types/shared";
import MGButton from "@/components/ui/MGButton";

const DECISION_OPTIONS: OnboardingStatus[] = [
  "APPROVED",
  "REJECTED",
  "IN_REVIEW",
  "ON_HOLD"
];

interface Props {
  requestId: string;
  initialStatus: OnboardingStatus;
}

export function OnboardingDecisionForm({ requestId, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus>(initialStatus);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await decideOnboarding(requestId, {
          status,
          actorId: process.env.NEXT_PUBLIC_OPS_ACTOR_ID ?? "",
          note: note.trim().length ? note.trim() : undefined
        });
        setSuccess("결정이 저장되었습니다.");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "결정 처리 중 오류가 발생했습니다."
        );
      }
    });
  };

  const handleRetry = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const updated = await retryOnboardingApproval(requestId, note.trim().length ? note.trim() : undefined);
        // 재시도 후 업데이트된 상태 확인
        if (updated.status === "APPROVED") {
          setSuccess("재시도 성공: 프로시저가 성공적으로 실행되었습니다. 상태가 APPROVED로 변경되었습니다.");
        } else if (updated.status === "ON_HOLD") {
          setError(`재시도 실패: 프로시저 실행 중 오류가 발생했습니다. 상태가 ON_HOLD로 유지되었습니다.${updated.decisionNote ? "\n오류 내용: " + updated.decisionNote.split("\n").pop() : ""}`);
        } else {
          setSuccess(`재시도 완료: 상태가 ${updated.status}로 변경되었습니다.`);
        }
        // 상태 업데이트
        setStatus(updated.status);
        // 페이지 새로고침하여 최신 정보 표시
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "재시도 처리 중 오류가 발생했습니다."
        );
      }
    });
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2>결정 기록</h2>
      <div className="form-grid">
        <label className="form-field">
          <span>상태</span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as OnboardingStatus)
            }
            disabled={isPending}
          >
            {DECISION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field form-field--full">
          <span>결정 메모</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="필요 시 심사 코멘트를 남겨주세요."
            rows={3}
            disabled={isPending}
          />
        </label>
      </div>
      <div className="form-footer">
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <MGButton
            type="submit"
            variant="primary"
            loading={isPending}
            loadingText="저장 중..."
            preventDoubleClick={true}
            clickDelay={1000}
          >
            결정 저장
          </MGButton>
          {initialStatus === "ON_HOLD" && (
            <MGButton
              type="button"
              variant="success"
              onClick={handleRetry}
              loading={isPending}
              loadingText="재시도 중..."
              preventDoubleClick={true}
              clickDelay={2000}
            >
              프로시저 재시도
            </MGButton>
          )}
        </div>
        {error && <p className="form-feedback form-feedback--error">{error}</p>}
        {success && (
          <p className="form-feedback form-feedback--success">{success}</p>
        )}
      </div>
    </form>
  );
}

