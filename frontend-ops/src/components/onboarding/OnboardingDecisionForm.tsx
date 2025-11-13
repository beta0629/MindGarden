"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { decideOnboarding } from "@/services/onboardingClient";
import { OnboardingStatus } from "@/types/shared";

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
        <button type="submit" className="primary-button" disabled={isPending}>
          {isPending ? "저장 중..." : "결정 저장"}
        </button>
        {error && <p className="form-feedback form-feedback--error">{error}</p>}
        {success && (
          <p className="form-feedback form-feedback--success">{success}</p>
        )}
      </div>
    </form>
  );
}

