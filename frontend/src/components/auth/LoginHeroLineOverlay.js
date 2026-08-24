/**
 * 로그인 히어로 브랜드 락업 (HQ 기본 = Core Solution)
 * Calm Forest 실드 마크 + 워드마크 one-shot draw-on (루프/erase 없음).
 * 테넌트 로고 테마는 별도 branding 훅 — 이 히어로 쇼케이스는 Core Solution 고정.
 *
 * @author CoreSolution
 * @since 2026-08-14
 */
import React from 'react';
import { ReactComponent as CoreSolutionHeroLockupSvg } from '../../assets/images/auth/core-solution-hero-lockup.svg';

/** HQ 로그인 히어로 브랜드 표기 */
export const LOGIN_HERO_BRAND_TITLE = 'CoreSolution';

/**
 * Core Solution 실드 + 워드마크 락업
 * h1(sr-only)은 레이아웃·접근성용, 시각 브랜드는 이 SVG
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
 * @deprecated 장면 오버레이는 제거됨. 브랜드 lockup named export 사용.
 */
const LoginHeroLineOverlay = () => null;

export default LoginHeroLineOverlay;
