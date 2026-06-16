/**
 * PricingCard — 요금제 카드 (Molecule)
 *
 * §P 옵션 C 결정: Basic/Pro 공개 + Enterprise 견적.
 * 가격 + 기능 리스트 + CTA 버튼 + Highlighted (추천) 상태.
 * mg-v2-* 토큰 한정.
 *
 * @author CoreSolution
 * @since 2026-06-15
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './PricingCard.css';

const PricingCard = ({
  planKey = 'basic',
  nameLabel,
  price,
  priceUnit,
  pricePeriod,
  features = [],
  ctaLabel,
  ctaTo = '/onboarding',
  isHighlighted = false,
  isEnterprise = false,
}) => {
  const { t } = useTranslation('common');

  const cardClassName = [
    'mg-v2-pricing-card',
    isHighlighted ? 'mg-v2-pricing-card--highlighted' : '',
    isEnterprise ? 'mg-v2-pricing-card--enterprise' : '',
  ].filter(Boolean).join(' ');

  return (
    <article className={cardClassName} aria-label={`${nameLabel} plan`}>
      {isHighlighted && (
        <div className="mg-v2-pricing-card__badge">
          {t('public.pricing.recommended', 'Recommended')}
        </div>
      )}

      <header className="mg-v2-pricing-card__header">
        <h3 className="mg-v2-pricing-card__name">{nameLabel}</h3>
        <div className="mg-v2-pricing-card__price-container">
          {isEnterprise ? (
            <span className="mg-v2-pricing-card__price mg-v2-pricing-card__price--custom">
              {t('public.pricing.custom', 'Custom')}
            </span>
          ) : (
            <>
              {priceUnit && (
                <span className="mg-v2-pricing-card__currency">{priceUnit}</span>
              )}
              <span className="mg-v2-pricing-card__price">{price}</span>
              {pricePeriod && (
                <span className="mg-v2-pricing-card__period">/{pricePeriod}</span>
              )}
            </>
          )}
        </div>
      </header>

      <ul className="mg-v2-pricing-card__features" role="list">
        {features.map((feature, idx) => (
          <li key={idx} className="mg-v2-pricing-card__feature">
            <svg
              className="mg-v2-pricing-card__feature-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        to={ctaTo}
        className={`mg-v2-pricing-card__cta${isHighlighted ? ' mg-v2-pricing-card__cta--primary' : ''}`}
      >
        {ctaLabel || t('public.pricing.getStarted', 'Get Started')}
      </Link>
    </article>
  );
};

export default PricingCard;
