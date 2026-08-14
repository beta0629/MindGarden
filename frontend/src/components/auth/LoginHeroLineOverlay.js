/**
 * 로그인 히어로 워드마크 오버레이
 * 상단 중앙 필기체 MindGarden + 외곽 stroke-dash 그리기 애니메이션
 * prefers-reduced-motion 은 CSS 단에서 처리
 *
 * @author CoreSolution
 * @since 2026-08-14
 */
import React from 'react';

const LoginHeroLineOverlay = () => {
  return (
    <div className="mg-v2-login-hero-overlay" aria-hidden="true">
      <svg
        className="mg-v2-login-hero-wordmark"
        viewBox="0 0 640 160"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
        focusable="false"
      >
        <text
          className="mg-v2-login-hero-wordmark-text"
          x="320"
          y="112"
          textAnchor="middle"
          fontSize="108"
        >
          MindGarden
        </text>
      </svg>
    </div>
  );
};

export default LoginHeroLineOverlay;
