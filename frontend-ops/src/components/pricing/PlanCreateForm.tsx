"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createPricingPlan } from "@/services/pricingClient";

const DEFAULT_CURRENCY = "KRW";

export function PlanCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [planCode, setPlanCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [displayNameKo, setDisplayNameKo] = useState("");
  const [baseFee, setBaseFee] = useState("0");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [description, setDescription] = useState("");
  const [descriptionKo, setDescriptionKo] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const parsedBaseFee = Number(baseFee);
        if (Number.isNaN(parsedBaseFee)) {
          throw new Error("기본 요금은 숫자여야 합니다.");
        }

        await createPricingPlan({
          planCode: planCode.trim(),
          displayName: displayName.trim(),
          displayNameKo: displayNameKo.trim() || undefined,
          baseFee: parsedBaseFee,
          currency,
          description: description.trim() || undefined,
          descriptionKo: descriptionKo.trim() || undefined
        });
        setFeedback({ type: "success", message: "요금제가 생성되었습니다." });
        setPlanCode("");
        setDisplayName("");
        setDisplayNameKo("");
        setBaseFee("0");
        setDescription("");
        setDescriptionKo("");
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
              : "요금제 생성 중 오류가 발생했습니다."
        });
      }
    });
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2>요금제 생성</h2>
      <div className="form-grid">
        <label className="form-field">
          <span>요금제 코드</span>
          <input
            type="text"
            value={planCode}
            onChange={(event) => setPlanCode(event.target.value.toUpperCase())}
            placeholder="예: MG_ACADEMY_BASE"
            required
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>표시 이름</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="예: 학원 표준 요금제"
            required
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>표시 이름(한글)</span>
          <input
            type="text"
            value={displayNameKo}
            onChange={(event) => setDisplayNameKo(event.target.value)}
            placeholder="예: 학원 표준 요금제"
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
            required
            disabled={isPending}
          />
        </label>
        <label className="form-field form-field--full">
          <span>설명(한글)</span>
          <textarea
            value={descriptionKo}
            onChange={(event) => setDescriptionKo(event.target.value)}
            rows={3}
            placeholder="요금제 설명(한글)을 입력하세요."
            disabled={isPending}
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
        <label className="form-field form-field--full">
          <span>설명</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="요금제 구성에 대한 설명을 입력하세요."
            disabled={isPending}
          />
        </label>
      </div>
      <div className="form-footer">
        <button type="submit" className="primary-button" disabled={isPending}>
          {isPending ? "생성 중..." : "요금제 생성"}
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

