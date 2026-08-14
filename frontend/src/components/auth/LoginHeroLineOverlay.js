/**
 * 로그인 히어로 라인 오버레이 (모션 SSOT)
 * 수채화 히어로(1024×1536) 실윤곽에 맞춘 SVG Path 네이티브 애니메이션
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
        viewBox="0 0 1024 1536"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="mg-v2-hero-path mg-v2-path-frame"
          d="M 835 0 Q 842 400 838 1000"
        />
        <path
          className="mg-v2-hero-path mg-v2-path-sill"
          d="M -20 985 Q 512 1010 1044 990 M -20 1105 Q 512 1130 1044 1110"
        />
        <path
          className="mg-v2-hero-path mg-v2-path-mug"
          d="M 455 865 C 455 920 460 970 465 980 C 490 995 540 995 565 980 C 570 970 575 920 575 865 C 575 880 455 880 455 865 C 455 850 575 850 575 865 M 575 890 C 620 890 620 950 572 955"
        />
        <path
          className="mg-v2-hero-path mg-v2-path-cushion"
          d="M 700 995 C 710 820 850 780 940 990"
        />
        <path
          className="mg-v2-hero-path mg-v2-path-curtain"
          d="M 140 -20 Q 180 400 150 1010 M 260 -20 Q 220 500 280 1000 M 380 -20 Q 360 450 400 980"
        />
        <path
          className="mg-v2-hero-path mg-v2-path-foliage"
          d="M -20 150 C 100 120 180 200 200 300 C 100 320 0 280 -20 250 M 150 -20 C 180 100 280 150 350 120 C 320 40 280 -10 250 -20"
        />
      </svg>
    </div>
  );
};

export default LoginHeroLineOverlay;
