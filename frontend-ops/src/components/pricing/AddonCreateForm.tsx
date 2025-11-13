"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createPricingAddon } from "@/services/pricingClient";
import { FEE_TYPE_OPTIONS } from "@/constants/pricing";
import { FeeType } from "@/types/sharedPricing";

export function AddonCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [addonCode, setAddonCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [displayNameKo, setDisplayNameKo] = useState("");
  const [category, setCategory] = useState("");
  const [categoryKo, setCategoryKo] = useState("");
  const [feeType, setFeeType] = useState<FeeType>("FLAT");
  const [unitPrice, setUnitPrice] = useState("0");
  const [unit, setUnit] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const parsedUnitPrice = Number(unitPrice);
        if (Number.isNaN(parsedUnitPrice)) {
          throw new Error("단가는 숫자여야 합니다.");
        }

        await createPricingAddon({
          addonCode: addonCode.trim(),
          displayName: displayName.trim(),
          displayNameKo: displayNameKo.trim() || undefined,
          category: category.trim() || undefined,
          categoryKo: categoryKo.trim() || undefined,
          feeType,
          unitPrice: parsedUnitPrice,
          unit: unit.trim() || undefined
        });
        setFeedback({ type: "success", message: "애드온이 생성되었습니다." });
        setAddonCode("");
        setDisplayName("");
        setDisplayNameKo("");
        setCategory("");
        setCategoryKo("");
        setUnitPrice("0");
        setUnit("");
        setFeeType("FLAT");
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
              : "애드온 생성 중 오류가 발생했습니다."
        });
      }
    });
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2>애드온 생성</h2>
      <div className="form-grid">
        <label className="form-field">
          <span>애드온 코드</span>
          <input
            type="text"
            value={addonCode}
            onChange={(event) => setAddonCode(event.target.value.toUpperCase())}
            placeholder="예: MG_AI_TOKEN"
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
            placeholder="예: AI 토큰 패키지"
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
            placeholder="예: AI 토큰 패키지"
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>카테고리</span>
          <input
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="예: AI"
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>카테고리(한글)</span>
          <input
            type="text"
            value={categoryKo}
            onChange={(event) => setCategoryKo(event.target.value)}
            placeholder="예: AI"
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>요금 방식</span>
          <select
            value={feeType}
            onChange={(event) => setFeeType(event.target.value as FeeType)}
            disabled={isPending}
          >
            {FEE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>단가</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            required
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>단위</span>
          <input
            type="text"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            placeholder="예: 1K 토큰"
            disabled={isPending}
          />
        </label>
      </div>
      <div className="form-footer">
        <button type="submit" className="primary-button" disabled={isPending}>
          {isPending ? "생성 중..." : "애드온 생성"}
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

