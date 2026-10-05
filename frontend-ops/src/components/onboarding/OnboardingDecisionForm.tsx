"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ONBOARDING_DECISION_OPTIONS, ONBOARDING_MESSAGES } from "@/constants/onboarding";
import { OPS_SHELL_PATHS } from "@/constants/opsShell";
import { decideOnboarding } from "@/services/onboardingClient";
import { OnboardingRequest } from "@/types/onboarding";
import { OnboardingStatus } from "@/types/shared";
import { isClientApiErrorNotified } from "@/utils/clientApiError";
import { saveOnboardingDecision, settleOnboardingDecision, withSavingReleased } from "@/utils/onboardingDecisionSave";
import { getOpsAuthSession } from "@/utils/opsAuthSession";
import { getStatusLabel, resolveInitialDecision } from "@/utils/onboardingUtils";
import notificationManager from "@/utils/notification";

interface Props {
  requestId: string;
  initialStatus: OnboardingStatus;
  onDecided?: (request: OnboardingRequest) => void;
  onRefresh?: () => Promise<void>;
}

export function OnboardingDecisionForm({ requestId, initialStatus, onDecided, onRefresh }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus>(resolveInitialDecision(initialStatus));
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const savingRef = useRef(false);

  useEffect(() => {
    setStatus(resolveInitialDecision(initialStatus));
  }, [initialStatus]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingRef.current) {
      return;
    }

    const actorId = getOpsAuthSession().actorId;
    if (!actorId) {
      notificationManager.error(ONBOARDING_MESSAGES.LOGIN_REQUIRED);
      router.push(OPS_SHELL_PATHS.LOGIN);
      return;
    }

    setSaveError("");

    // React 18 startTransition does not track an async callback, so isPending can stay true.
    void withSavingReleased(
      async () => {
        const result = await settleOnboardingDecision({
          save: () =>
            saveOnboardingDecision({
              decide: () =>
                decideOnboarding(requestId, {
                  status,
                  actorId,
                  note: note.trim().length ? note.trim() : undefined,
                }),
              isNotified: isClientApiErrorNotified,
              notifySuccess: (message) => notificationManager.success(message),
              notifyError: (message) => notificationManager.error(message),
              successMessage: ONBOARDING_MESSAGES.SAVE_SUCCESS,
              failureMessage: ONBOARDING_MESSAGES.SAVE_FAILED,
            }),
          onSaved: (saved) => {
            if (saved.updated?.status) {
              setStatus(resolveInitialDecision(saved.updated.status));
              onDecided?.(saved.updated);
            }
          },
          refresh: async () => {
            await onRefresh?.();
          },
          failureMessage: ONBOARDING_MESSAGES.ERROR_BODY,
        });
        if (result.saveError) {
          console.error("[OnboardingDecisionForm] 결정 저장 실패");
        }
        setSaveError(result.saveError);
      },
      (saving) => {
        savingRef.current = saving;
        setIsSaving(saving);
      },
    );
  };

  return (
    <form className="ops-onboarding__decision" onSubmit={handleSubmit} aria-busy={isSaving}>
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
            reject ? "ops-onboarding__choice--reject" : "",
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
              disabled={isSaving}
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
          disabled={isSaving}
        />
      </label>
      <button className="ops-onboarding__primary" type="submit" disabled={isSaving}>
        {isSaving ? ONBOARDING_MESSAGES.SAVING : ONBOARDING_MESSAGES.SAVE}
      </button>
      {saveError ? (
        <p className="ops-onboarding__save-error" role="alert">
          {saveError}
        </p>
      ) : null}
      <p className="ops-onboarding__note">{ONBOARDING_MESSAGES.PASSWORD_NOTE}</p>
    </form>
  );
}
