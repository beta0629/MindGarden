"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deactivatePricingAddon,
  updatePricingAddon
} from "@/services/pricingClient";
import { FEE_TYPE_OPTIONS } from "@/constants/pricing";
import { PricingAddon } from "@/types/pricing";
import { FeeType } from "@/types/sharedPricing";

interface Props {
  addon: PricingAddon;
  onClose: () => void;
}

export function AddonEditForm({ addon, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [displayName, setDisplayName] = useState(addon.displayName);
  const [displayNameKo, setDisplayNameKo] = useState(addon.displayNameKo ?? "");
  const [category, setCategory] = useState(addon.category ?? "");
  const [categoryKo, setCategoryKo] = useState(addon.categoryKo ?? "");
  const [feeType, setFeeType] = useState<FeeType>(addon.feeType);
  const [unitPrice, setUnitPrice] = useState(String(addon.unitPrice));
  const [unit, setUnit] = useState(addon.unit ?? "");
  const [active, setActive] = useState(addon.active);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    setDisplayName(addon.displayName);
    setDisplayNameKo(addon.displayNameKo ?? "");
    setCategory(addon.category ?? "");
    setCategoryKo(addon.categoryKo ?? "");
    setFeeType(addon.feeType);
    setUnitPrice(String(addon.unitPrice));
    setUnit(addon.unit ?? "");
    setActive(addon.active);
    setFeedback(null);
  }, [addon]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const parsedUnitPrice = Number(unitPrice);
        if (Number.isNaN(parsedUnitPrice)) {
          throw new Error("단가는 숫자여야 합니다.");
        }

        await updatePricingAddon(addon.id, {
          displayName: displayName.trim(),
          displayNameKo: displayNameKo.trim() || undefined,
          category: category.trim() || undefined,
          categoryKo: categoryKo.trim() || undefined,
          feeType,
          unitPrice: parsedUnitPrice,
          unit: unit.trim() || undefined,
          active
        });

        setFeedback({ type: "success", message: "애드온이 수정되었습니다." });
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
              : "애드온 수정 중 오류가 발생했습니다."
        });
      }
    });
  };

  const handleDeactivate = () => {
    if (!active) {
      onClose();
      return;
    }

    const confirmMessage = `애드온 "${addon.displayName}"을(를) 비활성화하시겠습니까?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    startTransition(async () => {
      try {
        await deactivatePricingAddon(addon.id);
        setFeedback({
          type: "success",
          message: "애드온이 비활성화되었습니다."
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
              : "애드온 비활성화 중 오류가 발생했습니다."
        });
      }
    });
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-footer" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>애드온 수정</h2>
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
          <span>애드온 코드</span>
          <input type="text" value={addon.addonCode} disabled />
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
          <span>카테고리</span>
          <input
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>카테고리(한글)</span>
          <input
            type="text"
            value={categoryKo}
            onChange={(event) => setCategoryKo(event.target.value)}
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
            disabled={isPending}
            required
          />
        </label>
        <label className="form-field">
          <span>단위</span>
          <input
            type="text"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            disabled={isPending}
          />
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
      </div>

      <div className="form-footer">
        <button
          type="button"
          className="ghost-button"
          onClick={handleDeactivate}
          disabled={isPending}
        >
          비활성화
        </button>
        <button
          type="submit"
          className="primary-button"
          disabled={isPending}
        >
          {isPending ? "저장 중..." : "변경 사항 저장"}
        </button>
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

