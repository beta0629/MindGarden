/**
 * 로그인 히어로 라인 오버레이 (모션 SSOT)
 * 기존 Lottie 기반 모션을 SVG Path 네이티브 애니메이션으로 교체
 * prefers-reduced-motion 설정은 CSS 단에서 처리
 *
 * @author CoreSolution
 * @since 2026-08-14
 */
import React from 'react';

const LoginHeroLineOverlay = () => {
  return (
    <div className="mg-v2-login-hero-overlay" aria-hidden="true">
      <svg 
        className="mg-v2-hero-svg" 
        viewBox="0 0 800 1000" 
        preserveAspectRatio="xMidYMid slice" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path className="mg-v2-hero-path mg-v2-path-frame" d="M 100 0 L 100 1000 M 700 0 L 700 1000" />
        <path className="mg-v2-hero-path mg-v2-path-branch" d="M -50 200 C 150 250, 250 400, 400 450 C 550 500, 700 450, 850 350" />
        <path className="mg-v2-hero-path mg-v2-path-leaf mg-v2-delay-1" d="M 250 400 C 220 300, 300 250, 350 350 C 370 390, 300 420, 250 400 Z" />
        <path className="mg-v2-hero-path mg-v2-path-leaf mg-v2-delay-2" d="M 550 480 C 600 580, 700 550, 680 480 C 660 410, 580 430, 550 480 Z" />
      </svg>
    </div>
  );
};

export default LoginHeroLineOverlay;
