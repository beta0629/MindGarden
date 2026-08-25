/**
 * 로그인 히어로 브랜드 락업 (HQ = Core Solution)
 * Secure Core(시안 05) mark + wordmark one-shot draw-on (루프/erase 없음).
 * MindGarden 필기체·나비·수채화 쇼케이스 아님.
 *
 * @author CoreSolution
 * @since 2026-08-14
 */
import React from 'react';
import { ReactComponent as CoreSolutionHeroLockupSvg } from '../../assets/images/auth/core-solution-hero-lockup.svg';

/** HQ 로그인 히어로 브랜드 표기 */
export const LOGIN_HERO_BRAND_TITLE = 'CoreSolution';

/**
 * Core Solution Secure Core + 워드마크·한국어·태그라인 락업
 * h1(sr-only)은 접근성용, 시각 브랜드는 이 SVG
 */
export const LoginHeroBrandLockup = () => (
  <CoreSolutionHeroLockupSvg
    className="mg-v2-login-hero-lockup"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
    focusable="false"
  />
);

/**
 * @deprecated LoginHeroBrandLockup 사용. 하위 호환용 별칭.
 */
export const LoginHeroTitleOutline = LoginHeroBrandLockup;

/**
 * @deprecated 나비 로고 오버레이 제거됨.
 */
export const LoginHeroLogoOutline = () => null;

/**
 * @deprecated 장면 오버레이는 제거됨. 브랜드 lockup named export 사용.
 */
const LoginHeroLineOverlay = () => null;

export default LoginHeroLineOverlay;
