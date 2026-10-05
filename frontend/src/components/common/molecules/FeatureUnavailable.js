/**
 * FeatureUnavailable — 기능 비활성 빈 상태 (어드민·클라이언트 공용)
 * 세로 스택, measure 30rem, outline CTA. 게이트는 페이지 h1 을 두지 않고 이 제목만 h1 로 둔다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */

import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Ban, Lock } from 'lucide-react';
import SafeText from '../SafeText';
import './FeatureUnavailable.css';

export const FEATURE_UNAVAILABLE_ICON = Object.freeze({
  NONE: 'none',
  SLASH_CIRCLE: 'slash-circle',
  LOCK: 'lock'
});

const ICON_GLYPH = Object.freeze({
  [FEATURE_UNAVAILABLE_ICON.SLASH_CIRCLE]: Ban,
  [FEATURE_UNAVAILABLE_ICON.LOCK]: Lock
});

const GLYPH_SIZE = 20;

/**
 * @param {{
 *   title: string,
 *   description: string,
 *   actionLabel: string,
 *   actionHref: string,
 *   icon?: 'none' | 'slash-circle' | 'lock'
 * }} props
 */
const FeatureUnavailable = ({
  title,
  description,
  actionLabel,
  actionHref,
  icon = FEATURE_UNAVAILABLE_ICON.SLASH_CIRCLE
}) => {
  const titleId = useId();
  const Glyph = icon === FEATURE_UNAVAILABLE_ICON.NONE ? null : ICON_GLYPH[icon] || null;

  return (
    <section className="feature-unavailable" aria-labelledby={titleId}>
      {Glyph ? (
        <div className="feature-unavailable__icon" aria-hidden="true">
          <Glyph
            className="feature-unavailable__icon-glyph"
            size={GLYPH_SIZE}
            strokeWidth={1.75}
          />
        </div>
      ) : null}
      <h1 id={titleId} className="feature-unavailable__title">
        <SafeText>{title}</SafeText>
      </h1>
      <p className="feature-unavailable__description">
        <SafeText>{description}</SafeText>
      </p>
      <Link to={actionHref} className="feature-unavailable__action">
        <SafeText>{actionLabel}</SafeText>
      </Link>
    </section>
  );
};

FeatureUnavailable.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actionLabel: PropTypes.string.isRequired,
  actionHref: PropTypes.string.isRequired,
  icon: PropTypes.oneOf(Object.values(FEATURE_UNAVAILABLE_ICON))
};

export default FeatureUnavailable;
