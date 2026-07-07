/**
 * NoticeCard — B0KlA 안내 카드 organism (ComingSoon / BranchDeprecation 공유)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../SafeText';
import './NoticeCard.css';

const NOTICE_CARD_VARIANT_DEFAULT = 'default';
const NOTICE_CARD_VARIANT_WARNING = 'warning';

const NoticeCard = ({
  iconClass = 'bi bi-tools',
  title = '',
  description = '',
  features = [],
  actions = null,
  variant = NOTICE_CARD_VARIANT_DEFAULT
}) => {
  const cardVariantClass =
    variant === NOTICE_CARD_VARIANT_WARNING
      ? 'mg-v2-notice-card--warning'
      : '';

  return (
    <div className={`mg-v2-notice-card ${cardVariantClass}`.trim()}>
      <div className="mg-v2-notice-card__accent" aria-hidden="true" />
      <div className="mg-v2-notice-card__content">
        {iconClass ? (
          <div className="mg-v2-notice-card__icon" aria-hidden="true">
            <i className={iconClass} />
          </div>
        ) : null}
        {title ? (
          <h2 className="mg-v2-notice-card__title">
            <SafeText>{title}</SafeText>
          </h2>
        ) : null}
        {description ? (
          <p className="mg-v2-notice-card__desc">
            <SafeText>{description}</SafeText>
          </p>
        ) : null}
        {features.length > 0 ? (
          <ul className="mg-v2-notice-card__features">
            {features.map((feature) => (
              <li
                key={`${feature.iconClass}-${feature.text}`}
                className="mg-v2-notice-card__feature-item"
              >
                {feature.iconClass ? (
                  <i className={feature.iconClass} aria-hidden="true" />
                ) : null}
                <span>
                  <SafeText>{feature.text}</SafeText>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {actions ? (
          <div className="mg-v2-notice-card__actions">{actions}</div>
        ) : null}
      </div>
    </div>
  );
};

NoticeCard.propTypes = {
  iconClass: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  features: PropTypes.arrayOf(
    PropTypes.shape({
      iconClass: PropTypes.string,
      text: PropTypes.string.isRequired
    })
  ),
  actions: PropTypes.node,
  variant: PropTypes.oneOf([NOTICE_CARD_VARIANT_DEFAULT, NOTICE_CARD_VARIANT_WARNING])
};

export default NoticeCard;
export { NOTICE_CARD_VARIANT_DEFAULT, NOTICE_CARD_VARIANT_WARNING };
