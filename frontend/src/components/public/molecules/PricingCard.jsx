/**
 * PricingCard — 요금제 카드 (Molecule)
 *
 * Spec §3.3 / §9 (Refine v2):
 *   - variant: starter | popular | enterprise-dark
 *   - 카드 상단 일러스트 (PricingPlanIcon)
 *   - "가장 인기" 등 badge 슬롯 (Pill, 카드 상단 경계선에 걸침)
 *   - subText (예: "30일 무료 체험")
 *   - 가격 / 가격 단위 / 주기 라벨
 *   - 기능 체크리스트
 *   - CTA (Outline / Solid Gradient / White Outline)
 *
 * Backwards-compat: 기존 props (planKey, nameLabel, price, priceUnit,
 * pricePeriod, features, ctaLabel, ctaTo, isHighlighted, isEnterprise) 유지.
 * 추가 props (variant, iconKey, badgeLabel, subText) 는 모두 옵션.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PricingPlanIcon from '../atoms/PricingPlanIcon';
import { PRICING_PLAN_VARIANT, PRICING_ONBOARDING_PATH } from '../../../constants/pricing';
import { toDisplayString } from '../../../utils/safeDisplay';
import './PricingCard.css';

/* ================================================================
   INTERNAL — Variant 자동 결정 (backwards-compat)
   ================================================================ */
function resolveVariant({ variant, isEnterprise, isHighlighted }) {
  if (variant) return variant;
  if (isEnterprise) return PRICING_PLAN_VARIANT.ENTERPRISE_DARK;
  if (isHighlighted) return PRICING_PLAN_VARIANT.POPULAR;
  return PRICING_PLAN_VARIANT.STARTER;
}

const PricingCard = ({
  planKey = 'starter',
  variant,
  nameLabel,
  price,
  priceUnit,
  pricePeriod,
  subText,
  iconKey,
  badgeLabel,
  features = [],
  ctaLabel,
  ctaTo = PRICING_ONBOARDING_PATH,
  ctaOnClick,
  isHighlighted = false,
  isEnterprise = false,
}) => {
  const { t } = useTranslation('common');
  const resolvedVariant = resolveVariant({ variant, isEnterprise, isHighlighted });

  const cardClassName = [
    'mg-v2-pricing-card',
    `mg-v2-pricing-card--${resolvedVariant}`,
    /* Backwards-compat 클래스 (기존 테스트용) */
    isHighlighted ? 'mg-v2-pricing-card--highlighted' : '',
    isEnterprise ? 'mg-v2-pricing-card--enterprise' : '',
  ].filter(Boolean).join(' ');

  const ctaClassName = [
    'mg-v2-pricing-card__cta',
    `mg-v2-pricing-card__cta--${resolvedVariant}`,
    /* Backwards-compat: solid CTA on highlighted */
    isHighlighted ? 'mg-v2-pricing-card__cta--primary' : '',
  ].filter(Boolean).join(' ');

  const showCustom = isEnterprise && (price === null || price === undefined);

  /* CTA — Enterprise 카드는 onClick 만 사용하는 케이스 가능, Link 로 통일하되 onClick 지원 */
  const ctaContent = ctaLabel || t('public.pricing.getStarted', '시작하기');

  /* 명시 badge 가 없으면 backwards-compat 으로 'Recommended' 라벨 사용 (기존 테스트 보존) */
  const effectiveBadgeLabel =
    badgeLabel ||
    (isHighlighted ? t('public.pricing.recommended', 'Recommended') : null);

  return (
    <article
      className={cardClassName}
      aria-label={`${toDisplayString(nameLabel)} plan`}
      data-variant={resolvedVariant}
      data-plan-key={planKey}
    >
      {effectiveBadgeLabel && (
        <div className="mg-v2-pricing-card__badge" data-testid={`pricing-card-badge-${planKey}`}>
          {toDisplayString(effectiveBadgeLabel)}
        </div>
      )}

      {iconKey && (
        <PricingPlanIcon iconKey={iconKey} className="mg-v2-pricing-card__plan-icon" />
      )}

      <header className="mg-v2-pricing-card__header">
        <h3 className="mg-v2-pricing-card__name">{toDisplayString(nameLabel)}</h3>
        <div className="mg-v2-pricing-card__price-container">
          {showCustom ? (
            <span className="mg-v2-pricing-card__price mg-v2-pricing-card__price--custom">
              {toDisplayString(t('public.pricing.custom', '맞춤 견적'))}
            </span>
          ) : (
            <>
              {priceUnit && (
                <span className="mg-v2-pricing-card__currency">{toDisplayString(priceUnit)}</span>
              )}
              <span className="mg-v2-pricing-card__price">{toDisplayString(price)}</span>
              {pricePeriod && (
                <span className="mg-v2-pricing-card__period">/{toDisplayString(pricePeriod)}</span>
              )}
            </>
          )}
        </div>
        {subText && (
          <p className="mg-v2-pricing-card__sub-text">{toDisplayString(subText)}</p>
        )}
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
            <span>{toDisplayString(feature)}</span>
          </li>
        ))}
      </ul>

      {typeof ctaOnClick === 'function' ? (
        <button
          type="button"
          className={ctaClassName}
          onClick={ctaOnClick}
          data-testid={`pricing-card-cta-${planKey}`}
        >
          {toDisplayString(ctaContent)}
        </button>
      ) : (
        <Link
          to={ctaTo}
          className={ctaClassName}
          data-testid={`pricing-card-cta-${planKey}`}
        >
          {toDisplayString(ctaContent)}
        </Link>
      )}

    </article>
  );
};

PricingCard.propTypes = {
  planKey: PropTypes.string,
  variant: PropTypes.oneOf(Object.values(PRICING_PLAN_VARIANT)),
  nameLabel: PropTypes.string,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  priceUnit: PropTypes.string,
  pricePeriod: PropTypes.string,
  subText: PropTypes.string,
  iconKey: PropTypes.string,
  badgeLabel: PropTypes.string,
  features: PropTypes.arrayOf(PropTypes.string),
  ctaLabel: PropTypes.string,
  ctaTo: PropTypes.string,
  ctaOnClick: PropTypes.func,
  isHighlighted: PropTypes.bool,
  isEnterprise: PropTypes.bool,
};

export default PricingCard;
