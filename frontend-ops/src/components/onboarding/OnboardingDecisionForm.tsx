"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ONBOARDING_DECISION_OPTIONS, ONBOARDING_MESSAGES } from "@/constants/onboarding";
import { OPS_SHELL_PATHS } from "@/constants/opsShell";
import { decideOnboarding } from "@/services/onboardingClient";
import { OnboardingRequest } from "@/types/onboarding";
import { OnboardingStatus } from "@/types/shared";
import { getOpsAuthSession } from "@/utils/opsAuthSession";
import { getStatusLabel, resolveInitialDecision } from "@/utils/onboardingUtils";
import notificationManager from "@/utils/notification";

interface Props {
  requestId: string;
  initialStatus: OnboardingStatus;
  onDecided?: (request: OnboardingRequest) => void;
}

export function OnboardingDecisionForm({ requestId, initialStatus, onDecided }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus>(resolveInitialDecision(initialStatus));
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setStatus(resolveInitialDecision(initialStatus));
  }, [initialStatus]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const actorId = getOpsAuthSession().actorId;
    if (!actorId) {
      notificationManager.error(ONBOARDING_MESSAGES.LOGIN_REQUIRED);
      router.push(OPS_SHELL_PATHS.LOGIN);
      return;
    }

    startTransition(async () => {
      try {
        const response = await decideOnboarding(requestId, {
          status,
          actorId,
          note: note.trim().length ? note.trim() : undefined
        });
        const updated = response?.request;
        if (updated?.status) {
          setStatus(resolveInitialDecision(updated.status));
          onDecided?.(updated);
        }
        notificationManager.success(ONBOARDING_MESSAGES.SAVE_SUCCESS);
      } catch (error) {
        console.error("[OnboardingDecisionForm] 결정 저장 실패:", error);
      }
    });
  };

  return (
    <form className="ops-onboarding__decision" onSubmit={handleSubmit}>
      <div
        className="ops-onboarding__choices"
        role="radiogroup"
        aria-label={ONBOARDING_MESSAGES.DECISION_GROUP}
      >
        {ONBOARDING_DECISION_OPTIONS.map((option) => {
          const selected = status === option;
          const reject = option === "REJECTED";
          const className = [
            "ops-onboarding__choice",
            selected ? "ops-onboarding__choice--on" : "",
            reject ? "ops-onboarding__choice--reject" : ""
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={option}
              type="button"
              role="radio"
              name="status"
              aria-checked={selected}
              className={className}
              disabled={isPending}
              onClick={() => setStatus(option)}
            >
              {getStatusLabel(option)}
            </button>
          );
        })}
      </div>
      <label className="ops-onboarding__memo">
        {ONBOARDING_MESSAGES.MEMO}
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          disabled={isPending}
        />
      </label>
      <button className="ops-onboarding__primary" type="submit" disabled={isPending}>
        {isPending ? ONBOARDING_MESSAGES.SAVING : ONBOARDING_MESSAGES.SAVE}
      </button>
      <p className="ops-onboarding__note">{ONBOARDING_MESSAGES.PASSWORD_NOTE}</p>
    </form>
  );
}
