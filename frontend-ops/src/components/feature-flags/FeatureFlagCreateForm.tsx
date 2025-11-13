"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createFeatureFlag } from "@/services/featureFlagClient";

export function FeatureFlagCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [flagKey, setFlagKey] = useState("");
  const [description, setDescription] = useState("");
  const [targetScope, setTargetScope] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        await createFeatureFlag({
          flagKey: flagKey.trim(),
          description: description.trim() || undefined,
          targetScope: targetScope.trim() || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
        });
        setFeedback({ type: "success", message: "Feature Flag이 생성되었습니다." });
        setFlagKey("");
        setDescription("");
        setTargetScope("");
        setExpiresAt("");
        router.refresh();
      } catch (error) {
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Feature Flag 생성 중 오류가 발생했습니다."
        });
      }
    });
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2>Feature Flag 생성</h2>
      <div className="form-grid">
        <label className="form-field">
          <span>Flag Key</span>
          <input
            type="text"
            value={flagKey}
            onChange={(event) => setFlagKey(event.target.value.toUpperCase())}
            placeholder="예: OPS_DASHBOARD_V2"
            required
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>Target Scope</span>
          <input
            type="text"
            value={targetScope}
            onChange={(event) => setTargetScope(event.target.value)}
            placeholder="예: HQ_ADMIN"
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>만료 시각 (선택)</span>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            disabled={isPending}
          />
        </label>
        <label className="form-field form-field--full">
          <span>설명</span>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="플래그 목적 및 가이드라인을 입력하세요."
            disabled={isPending}
          />
        </label>
      </div>
      <div className="form-footer">
        <button type="submit" className="primary-button" disabled={isPending}>
          {isPending ? "생성 중..." : "Feature Flag 생성"}
        </button>
        {feedback && (
          <p
            className={`form-feedback ${
              feedback.type === "error"
                ? "form-feedback--error"
                : "form-feedback--success"
            }`}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </form>
  );
}

