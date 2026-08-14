/**
 * 로그인 히어로 라인 오버레이 (모션 SSOT)
 * 수채화 히어로(1024×1536) 실윤곽에 맞춘 SVG Path 네이티브 애니메이션
 * prefers-reduced-motion 설정은 CSS 단에서 처리
 *
 * 좌표 기준(PNG 픽셀 실측):
 * - frame: 밝은 세로 밴드 중심 ≈ x 845–855
 * - sill: 상면 ≈ y 1132, 전면/드레이프 ≈ y 1198
 * - mug: bbox ≈ x 450–598, y 1019–1134 (양손잡이)
 * - cushion: 주 상단 윤곽 ≈ y 980–1010 (x 790–850), 우 숄더 ≈ y 840 (x 910+)
 *
 * @author CoreSolution
 * @since 2026-08-14
 */
import React from 'react';

/** viewBox 0 0 1024 1536 — login-hero-watercolor.png 과 동일 */
const HERO_LINE_PATHS = [
  {
    key: 'frame',
    className: 'mg-v2-hero-path mg-v2-path-frame',
    d: 'M 850 0 Q 853 520 851 1132'
  },
  {
    key: 'sill',
    className: 'mg-v2-hero-path mg-v2-path-sill',
    d: 'M 80 1132 Q 560 1144 1044 1130 M 60 1198 Q 560 1210 1044 1190'
  },
  {
    key: 'mug',
    className: 'mg-v2-hero-path mg-v2-path-mug mg-v2-delay-1',
    d: [
      'M 488 1035',
      'C 486 1090 488 1118 502 1124',
      'C 520 1132 540 1132 554 1124',
      'C 566 1118 568 1090 566 1035',
      'C 566 1025 488 1025 488 1035',
      'M 488 1065 C 458 1065 456 1096 490 1098',
      'M 566 1065 C 596 1065 598 1096 564 1098'
    ].join(' ')
  },
  {
    key: 'cushion',
    className: 'mg-v2-hero-path mg-v2-path-cushion mg-v2-delay-1',
    d: 'M 620 1135 C 700 1060 760 1005 820 995 C 880 988 940 1065 990 1138'
  },
  {
    key: 'curtain',
    className: 'mg-v2-hero-path mg-v2-path-curtain mg-v2-delay-2',
    d: 'M 120 0 Q 150 430 135 1128 M 240 0 Q 215 540 265 1120 M 365 0 Q 345 480 395 1110'
  },
  {
    key: 'foliage',
    className: 'mg-v2-hero-path mg-v2-path-foliage mg-v2-delay-3',
    d: [
      'M 25 130 C 105 95 185 175 205 290 C 120 310 25 255 15 215',
      'M 155 15 C 200 95 285 145 355 115 C 325 40 275 0 235 8'
    ].join(' ')
  }
];

const LoginHeroLineOverlay = () => {
  return (
    <div className="mg-v2-login-hero-overlay" aria-hidden="true">
      <svg
        className="mg-v2-hero-svg"
        viewBox="0 0 1024 1536"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {HERO_LINE_PATHS.map((path) => (
          <path
            key={path.key}
            className={path.className}
            d={path.d}
            fill="none"
          />
        ))}
      </svg>
    </div>
  );
};

export default LoginHeroLineOverlay;
