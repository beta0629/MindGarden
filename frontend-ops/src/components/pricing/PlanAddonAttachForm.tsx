"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { attachAddonToPlan } from "@/services/pricingClient";
import { PricingAddon, PricingPlan } from "@/types/pricing";

interface Props {
  plans: PricingPlan[];
  addons: PricingAddon[];
}

export function PlanAddonAttachForm({ plans, addons }: Props) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>(
    plans[0]?.id ?? ""
  );
  const [selectedAddon, setSelectedAddon] = useState<string>(
    addons[0]?.addonCode ?? ""
  );
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        if (!selectedPlan || !selectedAddon) {
          setFeedback({
            type: "error",
            message: "요금제와 애드온을 선택해주세요."
          });
          return;
        }
        await attachAddonToPlan(selectedPlan, {
          addonCode: selectedAddon,
          notes: notes.trim() || undefined
        });
        setFeedback({ type: "success", message: "애드온이 연결되었습니다." });
        setNotes("");
        router.refresh();
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
              : "애드온 연결 중 오류가 발생했습니다."
        });
      }
    });
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2>애드온 연결</h2>
      <div className="form-grid">
        <label className="form-field">
          <span>요금제</span>
          <select
            value={selectedPlan}
            onChange={(event) => setSelectedPlan(event.target.value)}
            disabled={isPending || plans.length === 0}
          >
            {plans.length === 0 && <option value="">요금제가 없습니다.</option>}
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {(plan.displayNameKo ?? plan.displayName) ?? "-"} ({plan.planCode})
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>애드온</span>
          <select
            value={selectedAddon}
            onChange={(event) => setSelectedAddon(event.target.value)}
            disabled={isPending || addons.length === 0}
          >
            {addons.length === 0 && <option value="">애드온이 없습니다.</option>}
            {addons.map((addon) => (
              <option key={addon.id} value={addon.addonCode}>
                {(addon.displayNameKo ?? addon.displayName) ?? "-"} ({addon.addonCode})
              </option>
            ))}
          </select>
        </label>
        <label className="form-field form-field--full">
          <span>비고</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="필요 시 연결 사유나 제한사항을 입력하세요."
            disabled={isPending}
          />
        </label>
      </div>
      <div className="form-footer">
        <button type="submit" className="primary-button" disabled={isPending}>
          {isPending ? "연결 중..." : "애드온 연결"}
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

