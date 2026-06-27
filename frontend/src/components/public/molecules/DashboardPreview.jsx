/**
 * DashboardPreview — Hero 우측 대시보드 프리뷰 (Molecule)
 *
 * Design v2 Refine v2 SPEC §3.3 / §9 / §12 — 정적 SVG 자산을 `img` 태그로 삽입.
 * (React 합성 컴포넌트로 무거운 상태/DOM을 만들지 않는다.)
 *
 * 기본 자산: `frontend/src/assets/landing/dashboard-preview.svg` (16:10 viewBox 800x500).
 * 운영팀이 다른 자산(SVG/WebP)을 사용하려면 `src` prop으로 주입.
 *
 * Hover 효과(부유 + scale + shadow)는 CSS 래퍼로 처리.
 *
 * mg-v2-* 토큰 한정, 하드코딩 0.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import defaultDashboardSrc from '../../../assets/landing/dashboard-preview.svg';
import { LANDING_DASHBOARD_PREVIEW_DEFAULT_ALT } from '../../../constants/landingPublic';
import './DashboardPreview.css';

const DashboardPreview = ({
  src = defaultDashboardSrc,
  alt = LANDING_DASHBOARD_PREVIEW_DEFAULT_ALT,
  caption = null,
  loading = 'lazy',
}) => {
  return (
    <figure className="mg-v2-dashboard-preview" role="img" aria-label={alt}>
      <div className="mg-v2-dashboard-preview__frame">
        <img
          className="mg-v2-dashboard-preview__image"
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
        />
      </div>
      {caption && (
        <figcaption className="mg-v2-dashboard-preview__caption">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

DashboardPreview.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  caption: PropTypes.node,
  loading: PropTypes.oneOf(['eager', 'lazy']),
};

export default DashboardPreview;
