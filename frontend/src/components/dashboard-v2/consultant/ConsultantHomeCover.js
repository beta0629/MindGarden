import React, { useId } from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  COVER_CHAPTER_MENU_ARIA
} from './consultantCoverChapterConstants';

/**
 * Clinic-OS Cover — 상담실 SVG + 센터·상담사 오버레이
 *
 * @author CoreSolution
 * @since 2026-10-29
 */
const ConsultantHomeCover = ({
  brandName,
  kicker,
  consultantName,
  subtitle,
  titleId,
  onMenuClick,
  children
}) => {
  const uid = useId().replace(/:/g, '');
  const winId = `cch-win-${uid}`;
  const beamId = `cch-beam-${uid}`;

  const handleMenu = () => {
    if (typeof onMenuClick === 'function') {
      onMenuClick();
      return;
    }
    if (typeof document === 'undefined') {
      return;
    }
    const gnbMenu = document.querySelector('.mg-v2-mobile-gnb__menu');
    if (gnbMenu && typeof gnbMenu.click === 'function') {
      gnbMenu.click();
    }
  };

  return (
    <div className="consultant-cover-chapter__cover">
      <div className="consultant-cover-chapter__cover-clip" aria-hidden="true">
        <svg
          className="consultant-cover-chapter__cover-svg"
          viewBox="0 0 540 800"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id={winId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--mg-v2-color-primary-subtle)" />
              <stop offset="100%" stopColor="var(--mg-v2-color-neutral-500)" />
            </linearGradient>
            <linearGradient id={beamId} x1="0.65" y1="0" x2="0.15" y2="1">
              <stop offset="0%" stopColor="var(--mg-v2-color-primary-subtle)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--mg-v2-color-primary-subtle)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="540" height="800" fill="var(--mg-v2-color-neutral-900)" />
          <rect width="540" height="800" fill="var(--mg-v2-color-neutral-800)" opacity="0.55" />
          <rect x="260" y="90" width="200" height="260" rx="4" fill={`url(#${winId})`} opacity="0.92" />
          <path d="M260 90h200v16H260z" fill="var(--mg-v2-color-secondary-dark)" />
          <path d="M360 90v260" stroke="var(--mg-v2-color-secondary-dark)" strokeWidth="5" />
          <path d="M260 220h200" stroke="var(--mg-v2-color-secondary-dark)" strokeWidth="4" />
          <polygon
            className="consultant-cover-chapter__light-beam"
            points="260,110 460,110 200,720 40,720"
            fill={`url(#${beamId})`}
          />
          <rect x="60" y="520" width="200" height="14" rx="2" fill="var(--mg-v2-color-secondary-dark)" />
          <rect x="80" y="534" width="12" height="70" fill="var(--mg-v2-color-text-secondary)" />
          <rect x="228" y="534" width="12" height="70" fill="var(--mg-v2-color-text-secondary)" />
          <path d="M90 470c0-28 22-50 50-50h14v90H90z" fill="var(--mg-v2-color-text-secondary)" />
          <path d="M100 510h90v10H100z" fill="var(--mg-v2-color-secondary-dark)" />
          <rect x="400" y="560" width="28" height="36" rx="3" fill="var(--mg-v2-color-secondary-dark)" />
          <ellipse cx="414" cy="544" rx="26" ry="16" fill="var(--mg-v2-color-primary-solid)" />
          <ellipse cx="400" cy="556" rx="14" ry="10" fill="var(--mg-v2-color-primary-main)" />
          <rect x="0" y="640" width="540" height="160" fill="var(--mg-v2-color-neutral-900)" />
        </svg>
      </div>

      <div className="consultant-cover-chapter__cover-top">
        <button
          type="button"
          className="consultant-cover-chapter__menu-btn"
          aria-label={COVER_CHAPTER_MENU_ARIA}
          onClick={handleMenu}
        >
          ☰
        </button>
        <SafeText tag="span" className="consultant-cover-chapter__brand">
          {toDisplayString(brandName, '')}
        </SafeText>
      </div>

      <div className="consultant-cover-chapter__meta">
        <p className="consultant-cover-chapter__kicker">
          <SafeText tag="span">{toDisplayString(kicker, '')}</SafeText>
        </p>
        <h1 className="consultant-cover-chapter__name" id={titleId}>
          <SafeText tag="span">{toDisplayString(consultantName, '')}</SafeText>
        </h1>
        <p className="consultant-cover-chapter__sub">
          <SafeText tag="span">{toDisplayString(subtitle, '')}</SafeText>
        </p>
      </div>

      {children}
    </div>
  );
};

ConsultantHomeCover.propTypes = {
  brandName: PropTypes.string,
  kicker: PropTypes.string,
  consultantName: PropTypes.string,
  subtitle: PropTypes.string,
  titleId: PropTypes.string,
  onMenuClick: PropTypes.func,
  children: PropTypes.node
};

export default ConsultantHomeCover;
