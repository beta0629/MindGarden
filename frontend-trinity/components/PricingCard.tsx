"use client";

import Link from "next/link";
import { COMPONENT_CSS } from "../constants/css-variables";

interface PricingCardProps {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
}

export default function PricingCard({ id, name, price, currency, features, popular }: PricingCardProps) {
  const cardClass = popular
    ? `${COMPONENT_CSS.PRICING.CARD} ${COMPONENT_CSS.PRICING.CARD_POPULAR}`
    : COMPONENT_CSS.PRICING.CARD;

  const formattedPrice = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(price);

  return (
    <div className={cardClass}>
      {popular && <div className="trinity-pricing__badge">인기</div>}
      <h3 className={COMPONENT_CSS.PRICING.TITLE}>{name}</h3>
      <div className={COMPONENT_CSS.PRICING.PRICE}>
        <span className="trinity-pricing__price-amount">{formattedPrice}</span>
        <span className="trinity-pricing__price-period">/월</span>
      </div>
      <ul className={COMPONENT_CSS.PRICING.FEATURES}>
        {features.map((feature, index) => (
          <li key={index} className="trinity-pricing__feature">
            ✓ {feature}
          </li>
        ))}
      </ul>
      <Link 
        href={`/onboarding?planId=${id}`} 
        className={COMPONENT_CSS.PRICING.BUTTON}
      >
        시작하기
      </Link>
    </div>
  );
}

