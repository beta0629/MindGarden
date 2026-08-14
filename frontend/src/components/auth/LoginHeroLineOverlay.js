/**
 * 로그인 히어로 라인 오버레이 (모션 SSOT)
 * 수채화 히어로(1024×1536) 실윤곽에 맞춘 SVG Path 네이티브 애니메이션
 * prefers-reduced-motion 설정은 CSS 단에서 처리
 *
 * cover 정합: img object-fit:cover + object-position:center
 *            ↔ SVG preserveAspectRatio="xMidYMid slice" (전 BP 동일)
 *
 * 좌표 기준(PNG 픽셀 실측, viewBox 0 0 1024 1536):
 * - frame: 우측 창 세로 밴드 ≈ x 848–852, sill 상단까지
 * - sill: 좌석 상단 가장자리만 ≈ y 1126–1132 (머그 기부 아래, 허리 비관통)
 * - mug: bbox ≈ x 455–595, y 1018–1130 (양손잡이 타이트)
 * - cushion: 초록 쿠션 상단 외곽만 (큰 U아치 금지) — 좌숄더→상단→우숄더
 * - curtain/foliage: 실주름·잎 클러스터만 짧게
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
    d: 'M 850 48 L 851 1128'
  },
  {
    key: 'sill',
    className: 'mg-v2-hero-path mg-v2-path-sill',
    d: 'M 210 1128 Q 530 1134 848 1126'
  },
  {
    key: 'mug',
    className: 'mg-v2-hero-path mg-v2-path-mug mg-v2-delay-1',
    d: [
      'M 492 1032',
      'C 490 1088 492 1116 504 1122',
      'C 520 1130 540 1130 552 1122',
      'C 564 1116 566 1088 564 1032',
      'C 564 1024 492 1024 492 1032',
      'M 492 1062 C 464 1062 462 1092 494 1094',
      'M 564 1062 C 592 1062 594 1092 562 1094'
    ].join(' ')
  },
  {
    key: 'cushion',
    className: 'mg-v2-hero-path mg-v2-path-cushion mg-v2-delay-1',
    /* 상단 외곽만: 좌(머그 옆) → 완만한 상단 → 우 높은 숄더. sill로 닫는 U아치 금지 */
    d: 'M 648 1048 C 700 1000 760 978 818 982 C 870 960 905 890 928 848'
  },
  {
    key: 'curtain',
    className: 'mg-v2-hero-path mg-v2-path-curtain mg-v2-delay-2',
    d: 'M 220 60 Q 235 520 228 1110 M 330 90 Q 318 540 348 1100'
  },
  {
    key: 'foliage',
    className: 'mg-v2-hero-path mg-v2-path-foliage mg-v2-delay-3',
    d: [
      'M 40 160 C 110 120 170 190 185 270 C 120 285 45 240 35 210',
      'M 160 40 C 200 110 270 150 330 125'
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
