/**
 * 로그인 히어로 라인 오버레이 (모션 SSOT)
 * 수채화 히어로(1024×1536) 실윤곽에 맞춘 SVG Path 네이티브 애니메이션
 * prefers-reduced-motion 설정은 CSS 단에서 처리
 *
 * 좌표 기준(픽셀 실측):
 * - frame mullion ≈ x 845–890 (주선 865)
 * - sill 상단 ≈ y 1130, 전면/드레이프 ≈ y 1195
 * - mug 바디 중심 ≈ x 510–530, 베이스 ≈ y 1125 (양손잡이)
 * - cushion 상단 숄더 ≈ (870–920, 900), 좌하 ≈ (630, 1130)
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
    d: 'M 865 0 Q 870 520 868 1132'
  },
  {
    key: 'sill',
    className: 'mg-v2-hero-path mg-v2-path-sill',
    d: 'M 80 1130 Q 560 1142 1044 1128 M 60 1198 Q 560 1210 1044 1190'
  },
  {
    key: 'mug',
    className: 'mg-v2-hero-path mg-v2-path-mug mg-v2-delay-1',
    d: [
      'M 498 1038',
      'C 496 1092 498 1118 512 1124',
      'C 528 1132 546 1132 560 1124',
      'C 572 1118 574 1092 572 1038',
      'C 572 1028 498 1028 498 1038',
      'M 498 1068 C 470 1068 468 1098 500 1100',
      'M 572 1068 C 600 1068 602 1098 570 1100'
    ].join(' ')
  },
  {
    key: 'cushion',
    className: 'mg-v2-hero-path mg-v2-path-cushion mg-v2-delay-1',
    d: 'M 630 1132 C 710 1000 790 910 870 900 C 930 895 975 1030 1005 1135'
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
