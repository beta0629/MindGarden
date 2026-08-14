/**
 * 로그인 히어로 브랜드 라인 오버레이
 * MindGarden 필기체 외곽 + 나비(potrace) 외곽 dash-draw
 * 장면(창틀/가지 등) path 없음
 *
 * @author CoreSolution
 * @since 2026-08-14
 */
import React from 'react';
import { ReactComponent as ButterflyTraceSvg } from '../../assets/images/auth/core-logo-butterfly-trace.svg';

/** 히어로 브랜드 표기 (필기체) */
export const LOGIN_HERO_BRAND_TITLE = 'MindGarden';

/** PNG / potrace 공통 viewBox (723×1024) */
export const BUTTERFLY_LOGO_VIEWBOX = '0 0 723 1024';

/**
 * MindGarden Great Vibes 텍스트 외곽 라인
 * title-wrapper 위에 absolute overlay (폰트 크기는 CSS로 h1과 동기)
 */
export const LoginHeroTitleOutline = () => (
  <svg
    className="mg-v2-login-hero-title-outline"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <text
      className="mg-v2-hero-path mg-v2-path-brand-title"
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="central"
    >
      {LOGIN_HERO_BRAND_TITLE}
    </text>
  </svg>
);

/**
 * 나비 로고 potrace 외곽 라인
 * logo-wrapper 위 absolute 100% overlay (viewBox = PNG)
 */
export const LoginHeroLogoOutline = () => (
  <ButterflyTraceSvg
    className="mg-v2-login-hero-logo-outline"
    viewBox={BUTTERFLY_LOGO_VIEWBOX}
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
  />
);

/**
 * @deprecated 장면 오버레이는 제거됨. 브랜드 outline named export 사용.
 */
const LoginHeroLineOverlay = () => null;

export default LoginHeroLineOverlay;
