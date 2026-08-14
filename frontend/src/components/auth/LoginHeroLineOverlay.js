/**
 * 로그인 히어로 브랜드 라인 오버레이
 * MindGarden 필기체 path 외곽 + 나비(potrace) 외곽 dash-draw
 * 장면(창틀/가지 등) path 없음
 *
 * @author CoreSolution
 * @since 2026-08-14
 */
import React from 'react';
import { ReactComponent as ButterflyTraceSvg } from '../../assets/images/auth/core-logo-butterfly-trace.svg';
import { ReactComponent as WordmarkTraceSvg } from '../../assets/images/auth/core-wordmark-mindgarden-trace.svg';

/** 히어로 브랜드 표기 (필기체) */
export const LOGIN_HERO_BRAND_TITLE = 'MindGarden';

/** PNG / potrace 공통 viewBox (595×842) */
export const BUTTERFLY_LOGO_VIEWBOX = '0 0 595 842';

/**
 * MindGarden Great Vibes 워드마크 외곽 path
 * title-wrapper 위에 absolute overlay (h1은 레이아웃·접근성)
 */
export const LoginHeroTitleOutline = () => (
  <WordmarkTraceSvg
    className="mg-v2-login-hero-title-outline"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
  />
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
