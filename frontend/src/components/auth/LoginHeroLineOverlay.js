/**
 * 로그인 히어로 중앙 로고 + SVG stroke-dash 윤곽 오버레이
 * 원본 나비 로고 PNG 위에 윤곽 라인만 애니메이트 (비트맵 미수정)
 * prefers-reduced-motion 은 CSS 단에서 처리
 *
 * @author CoreSolution
 * @since 2026-08-14
 */
import React from 'react';
import coreLogoButterfly from '../../assets/images/auth/core-logo-butterfly.png';

const BUTTERFLY_PATHS = [
  {
    key: 'upperL',
    d: 'M 230 220 C 180 150, 120 100, 80 120 C 40 140, 50 220, 90 260 C 130 300, 190 280, 230 260 Z'
  },
  {
    key: 'upperR',
    d: 'M 282 220 C 332 150, 392 100, 432 120 C 472 140, 462 220, 422 260 C 382 300, 322 280, 282 260 Z'
  },
  {
    key: 'lowerL',
    d: 'M 230 280 C 180 320, 140 380, 160 420 C 180 460, 220 440, 240 380 C 250 350, 240 310, 230 280 Z'
  },
  {
    key: 'lowerR',
    d: 'M 282 280 C 332 320, 372 380, 352 420 C 332 460, 292 440, 272 380 C 262 350, 272 310, 282 280 Z'
  },
  {
    key: 'antennaL',
    d: 'M 240 180 C 230 140, 210 110, 190 100'
  },
  {
    key: 'antennaR',
    d: 'M 272 180 C 282 140, 302 110, 322 100'
  }
];

const LoginHeroLineOverlay = () => {
  return (
    <div className="mg-v2-login-hero-logo-stage" aria-hidden="true">
      <img
        className="mg-v2-login-hero-butterfly"
        src={coreLogoButterfly}
        alt=""
        width={723}
        height={1024}
        decoding="async"
      />
      <svg
        className="mg-v2-login-hero-outline"
        viewBox="0 0 512 512"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {BUTTERFLY_PATHS.map((path) => (
          <path
            key={path.key}
            className="mg-v2-login-hero-outline-path"
            d={path.d}
            fill="none"
          />
        ))}
      </svg>
    </div>
  );
};

export default LoginHeroLineOverlay;
