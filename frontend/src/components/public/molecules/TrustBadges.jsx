/**
 * TrustBadges — 하단 인증/보안 마크 (Molecule)
 *
 * Spec §3.4 / §7:
 *   - ISO 27001, SOC 2, GDPR, KISA-ISMS
 *   - 가로 일렬 (모바일 wrap)
 *   - 모노톤/그레이스케일 처리
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PRICING_TRUST_BADGE_KEYS } from '../../../constants/pricing';
import { toDisplayString } from '../../../utils/safeDisplay';
import './TrustBadges.css';

/* ================================================================
   INTERNAL — Badge Definitions (i18n + label fallback)
   ================================================================ */
const BADGE_DEFINITIONS = {
  iso27001: {
    labelKey: 'public.pricing.trustBadges.iso27001',
    labelDefault: 'ISO 27001',
  },
  soc2: {
    labelKey: 'public.pricing.trustBadges.soc2',
    labelDefault: 'SOC 2',
  },
  gdpr: {
    labelKey: 'public.pricing.trustBadges.gdpr',
    labelDefault: 'GDPR',
  },
  kisaIsms: {
    labelKey: 'public.pricing.trustBadges.kisaIsms',
    labelDefault: 'KISA-ISMS',
  },
};

/* ================================================================
   INTERNAL — Single Badge
   ================================================================ */
function TrustBadgeItem({ badgeKey, label }) {
  return (
    <li
      className="mg-v2-trust-badges__item"
      data-testid={`trust-badge-${badgeKey}`}
    >
      <svg
        className="mg-v2-trust-badges__shield"
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M16 4 L26 8 V16 c0 6 -4.5 10.5 -10 12 -5.5 -1.5 -10 -6 -10 -12 V8 z" />
        <path d="M11 16 L15 20 L21 13" />
      </svg>
      <span className="mg-v2-trust-badges__label">{toDisplayString(label)}</span>
    </li>
  );
}

TrustBadgeItem.propTypes = {
  badgeKey: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

/* ================================================================
   PUBLIC — TrustBadges
   ================================================================ */
const TrustBadges = ({ badgeKeys = PRICING_TRUST_BADGE_KEYS, className = '' }) => {
  const { t } = useTranslation('common');

  const wrapperClass = ['mg-v2-trust-badges', className].filter(Boolean).join(' ');

  return (
    <ul
      className={wrapperClass}
      role="list"
      aria-label={t('public.pricing.trustBadges.ariaLabel', '보안·인증 마크')}
      data-testid="trust-badges"
    >
      {badgeKeys.map((key) => {
        const def = BADGE_DEFINITIONS[key];
        if (!def) return null;
        return (
          <TrustBadgeItem
            key={key}
            badgeKey={key}
            label={t(def.labelKey, def.labelDefault)}
          />
        );
      })}
    </ul>
  );
};

TrustBadges.propTypes = {
  badgeKeys: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
};

export default TrustBadges;
