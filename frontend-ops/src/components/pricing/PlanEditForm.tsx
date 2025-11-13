"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deactivatePricingPlan,
  updatePricingPlan
} from "@/services/pricingClient";
import { PricingPlan } from "@/types/pricing";

interface Props {
  plan: PricingPlan;
  onClose: () => void;
}

export function PlanEditForm({ plan, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(plan.displayName);
  const [displayNameKo, setDisplayNameKo] = useState(plan.displayNameKo ?? "");
  const [baseFee, setBaseFee] = useState(String(plan.baseFee));
  const [currency, setCurrency] = useState(plan.currency);
  const [description, setDescription] = useState(plan.description ?? "");
  const [descriptionKo, setDescriptionKo] = useState(plan.descriptionKo ?? "");
  const [active, setActive] = useState(plan.active);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    setDisplayName(plan.displayName);
    setDisplayNameKo(plan.displayNameKo ?? "");
    setBaseFee(String(plan.baseFee));
    setCurrency(plan.currency);
    setDescription(plan.description ?? "");
    setDescriptionKo(plan.descriptionKo ?? "");
    setActive(plan.active);
    setFeedback(null);
  }, [plan]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const parsedBaseFee = Number(baseFee);
        if (Number.isNaN(parsedBaseFee)) {
          throw new Error("기본 요금은 숫자여야 합니다.");
        }

        await updatePricingPlan(plan.id, {
          displayName: displayName.trim(),
          displayNameKo: displayNameKo.trim() || undefined,
          baseFee: parsedBaseFee,
          currency,
          description: description.trim() || undefined,
          descriptionKo: descriptionKo.trim() || undefined,
          active
        });

        setFeedback({ type: "success", message: "요금제가 수정되었습니다." });
        router.refresh();
        onClose();
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          setFeedback({
            type: "error",
            message: "로그인이 만료되었습니다. 다시 로그인해주세요."
          });
          window.location.href = "/auth/login";
          return;
        }
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "요금제 수정 중 오류가 발생했습니다."
        });
      }
    });
  };

  const handleDeactivate = () => {
    if (!active) {
      onClose();
      return;
    }

    const confirmMessage = `요금제 "${plan.displayName}"을(를) 비활성화하시겠습니까?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    startTransition(async () => {
      try {
        await deactivatePricingPlan(plan.id);
        setFeedback({
          type: "success",
          message: "요금제가 비활성화되었습니다."
        });
        router.refresh();
        onClose();
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          setFeedback({
            type: "error",
            message: "로그인이 만료되었습니다. 다시 로그인해주세요."
          });
          window.location.href = "/auth/login";
          return;
        }
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "요금제 비활성화 중 오류가 발생했습니다."
        });
      }
    });
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-footer" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>요금제 수정</h2>
        <button
          type="button"
          className="ghost-button"
          onClick={onClose}
          disabled={isPending}
        >
          닫기
        </button>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span>요금제 코드</span>
          <input type="text" value={plan.planCode} disabled />
        </label>
        <label className="form-field">
          <span>표시 이름</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={isPending}
            required
          />
        </label>
        <label className="form-field">
          <span>표시 이름(한글)</span>
          <input
            type="text"
            value={displayNameKo}
            onChange={(event) => setDisplayNameKo(event.target.value)}
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>기본 요금</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={baseFee}
            onChange={(event) => setBaseFee(event.target.value)}
            disabled={isPending}
            required
          />
        </label>
        <label className="form-field">
          <span>통화</span>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            disabled={isPending}
          >
            <option value="KRW">KRW</option>
            <option value="USD">USD</option>
            <option value="JPY">JPY</option>
          </select>
        </label>
        <label className="form-field">
          <span>활성 여부</span>
          <select
            value={active ? "true" : "false"}
            onChange={(event) => setActive(event.target.value === "true")}
            disabled={isPending}
          >
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>
        </label>
        <label className="form-field form-field--full">
          <span>설명(한글)</span>
          <textarea
            value={descriptionKo}
            onChange={(event) => setDescriptionKo(event.target.value)}
            rows={3}
            disabled={isPending}
          />
        </label>
        <label className="form-field form-field--full">
          <span>설명</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            disabled={isPending}
          />
        </label>
      </div>

      <div className="form-footer">
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            className="ghost-button"
            onClick={handleDeactivate}
            disabled={isPending}
          >
            비활성화
          </button>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="submit"
            className="primary-button"
            disabled={isPending}
          >
            {isPending ? "저장 중..." : "변경 사항 저장"}
          </button>
        </div>
      </div>
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
    </form>
  );
}

