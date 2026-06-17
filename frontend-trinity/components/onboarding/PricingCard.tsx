"use client";

import Image from "next/image";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import "../../styles/components/onboarding-pricing-v2.css";

export type PricingCardVariant =
  (typeof TRINITY_CONSTANTS.PRICING.VARIANT)[keyof typeof TRINITY_CONSTANTS.PRICING.VARIANT];

interface PricingCardProps {
  planKey: string;
  variant: PricingCardVariant;
  nameLabel: string;
  priceLabel: string;
  periodLabel: string;
  subText?: string;
  iconSrc: string;
  badgeLabel?: string;
  features: string[];
  selected: boolean;
  onSelect: () => void;
}

/**
 * Step3 요금제 카드 v2 — mockup PricingCard 패턴 (선택형)
 */
export default function PricingCard({
  planKey,
  variant,
  nameLabel,
  priceLabel,
  periodLabel,
  subText,
  iconSrc,
  badgeLabel,
  features,
  selected,
  onSelect,
}: PricingCardProps) {
  const cardClass = [
    "trinity-pricing-card",
    `trinity-pricing-card--${variant}`,
    selected ? "trinity-pricing-card--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClass}
      aria-label={`${nameLabel} plan`}
      data-plan-key={planKey}
      data-selected={selected ? "true" : "false"}
    >
      {badgeLabel ? (
        <div className="trinity-pricing-card__badge">{badgeLabel}</div>
      ) : null}

      <button
        type="button"
        className="trinity-pricing-card__select"
        onClick={onSelect}
        aria-pressed={selected}
      >
        <Image
          src={iconSrc}
          alt=""
          width={48}
          height={48}
          className="trinity-pricing-card__icon"
        />

        <header className="trinity-pricing-card__header">
          <h4 className="trinity-pricing-card__name">{nameLabel}</h4>
          <div className="trinity-pricing-card__price-row">
            <span className="trinity-pricing-card__price">{priceLabel}</span>
            <span className="trinity-pricing-card__period">/{periodLabel}</span>
          </div>
          {subText ? (
            <p className="trinity-pricing-card__sub-text">{subText}</p>
          ) : null}
        </header>

        <ul className="trinity-pricing-card__features">
          {features.map((feature) => (
            <li key={feature} className="trinity-pricing-card__feature">
              <span className="trinity-pricing-card__check" aria-hidden>
                ✓
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {selected ? (
          <span className="trinity-pricing-card__selected-label">
            {TRINITY_CONSTANTS.PRICING.LABELS.SELECTED}
          </span>
        ) : (
          <span className="trinity-pricing-card__cta">
            {TRINITY_CONSTANTS.PRICING.LABELS.SELECT_PLAN}
          </span>
        )}
      </button>
    </article>
  );
}
