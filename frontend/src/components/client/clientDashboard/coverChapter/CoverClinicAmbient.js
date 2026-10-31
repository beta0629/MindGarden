/**
 * 상담사 홈 커버 앰비언트 v3.2 레이어 — CoverClinicSvg `ambient` opt-in 전용.
 * 색은 clinic-os 토큰만, 애니메이션은 ConsultantCoverChapterHome.css (transform·opacity만).
 *
 * @author CoreSolution
 * @since 2026-10-31
 */
import React from 'react';
import PropTypes from 'prop-types';

/** 변형별 좌표 — CoverClinicSvg 의 창·빛줄기·가구·화분 좌표와 동기 */
export const COVER_AMBIENT_GEOMETRY = {
  portrait: {
    window: { x: 260, y: 90, w: 200, h: 260 },
    shade: { cx: 160, cy: 606, rx: 110, ry: 7 },
    beam: '260,110 460,110 200,720 40,720',
    furniture: [
      'M90 470c0-28 22-50 50-50h14v90H90z',
      'M60 520h200v14H60z', 'M80 534h12v70H80z', 'M228 534h12v70h-12z'
    ],
    hl: { x: 40, y: 400, w: 80, h: 220 },
    leaves: [
      { cx: 414, cy: 544, rx: 26, ry: 16, tip: [432, 538, 9, 6] },
      { cx: 400, cy: 556, rx: 14, ry: 10, tip: [390, 553, 5, 4] },
      { cx: 424, cy: 530, rx: 12, ry: 18, tip: [428, 514, 4, 6] },
      { cx: 404, cy: 534, rx: 11, ry: 16, tip: [399, 520, 4, 5] }
    ],
    dust: [[330, 240, 2], [290, 380, 3.5], [240, 520, 5], [180, 640, 2.5], [380, 200, 4], [270, 450, 3], [130, 690, 2], [320, 310, 4.5]]
  },
  landscape: {
    window: { x: 460, y: 48, w: 240, h: 220 },
    shade: { cx: 190, cy: 372, rx: 110, ry: 6 },
    beam: '460,64 700,64 300,480 80,480',
    furniture: ['M120 270c0-24 20-44 46-44h12v80H120z', 'M100 300h180v12H100z'],
    hl: { x: 60, y: 220, w: 70, h: 100 },
    leaves: [
      { cx: 653, cy: 306, rx: 24, ry: 14, tip: [670, 300, 8, 6] },
      { cx: 640, cy: 314, rx: 13, ry: 9, tip: [631, 311, 5, 4] },
      { cx: 662, cy: 294, rx: 11, ry: 16, tip: [665, 280, 4, 5] },
      { cx: 645, cy: 297, rx: 10, ry: 14, tip: [641, 285, 4, 5] }
    ],
    dust: [[560, 140, 2], [500, 220, 3.5], [420, 300, 5], [330, 400, 2.5], [600, 110, 4], [470, 260, 3], [260, 440, 2], [540, 180, 4.5]]
  }
};

const LEAF_KEYS = ['a', 'b', 'c', 'd'];

/** 창빛 overlay — 창 그라데이션 바로 위 */
export const CoverAmbientWindowWarm = ({ variant }) => {
  const g = COVER_AMBIENT_GEOMETRY[variant].window;
  return (
    <rect className="consultant-cover-ambient__warm" x={g.x} y={g.y} width={g.w} height={g.h} rx="4"
      fill="var(--mg-v2-color-primary-subtle)" />
  );
};

/** 바닥 그림자·가구 하이라이트·화분 잎 (빛줄기 아래) */
export const CoverAmbientScene = ({ variant, uid }) => {
  const g = COVER_AMBIENT_GEOMETRY[variant];
  const furnClip = `cover-furn-${uid}`;
  const hlGrad = `cover-hl-${uid}`;
  return (
    <>
      <defs>
        <clipPath id={furnClip}>{g.furniture.map((d) => <path key={d} d={d} />)}</clipPath>
        <linearGradient id={hlGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--mg-v2-color-surface-card)" stopOpacity="0" />
          <stop offset="0.5" stopColor="var(--mg-v2-color-surface-card)" stopOpacity="var(--mg-v2-motion-cover-hl-opacity)" />
          <stop offset="1" stopColor="var(--mg-v2-color-surface-card)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse className="consultant-cover-ambient__shade" cx={g.shade.cx} cy={g.shade.cy} rx={g.shade.rx} ry={g.shade.ry}
        fill="var(--mg-v2-color-neutral-900)" />
      <g clipPath={`url(#${furnClip})`}>
        <rect className="consultant-cover-ambient__hl" x={g.hl.x} y={g.hl.y} width={g.hl.w} height={g.hl.h} fill={`url(#${hlGrad})`} />
      </g>
      <g className="consultant-cover-ambient__plant">
        {g.leaves.map((l, i) => (
          <g key={LEAF_KEYS[i]} className={`consultant-cover-ambient__leaf consultant-cover-ambient__leaf--${LEAF_KEYS[i]}`}>
            <ellipse cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill="var(--mg-v2-color-primary-solid)" />
            <ellipse className="consultant-cover-ambient__tip" cx={l.tip[0]} cy={l.tip[1]} rx={l.tip[2]} ry={l.tip[3]}
              fill="var(--mg-v2-color-primary-solid)" />
          </g>
        ))}
      </g>
    </>
  );
};

/** 먼지 8개 — 빛줄기 클립 (빛줄기 위) */
export const CoverAmbientDust = ({ variant, uid }) => {
  const g = COVER_AMBIENT_GEOMETRY[variant];
  const clip = `cover-beamclip-${uid}`;
  return (
    <>
      <defs><clipPath id={clip}><polygon points={g.beam} /></clipPath></defs>
      <g className="consultant-cover-ambient__dust" clipPath={`url(#${clip})`}>
        {g.dust.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="var(--mg-v2-color-surface-card)" />
        ))}
      </g>
    </>
  );
};

const variantProp = { variant: PropTypes.oneOf(['portrait', 'landscape']).isRequired };
CoverAmbientWindowWarm.propTypes = variantProp;
CoverAmbientScene.propTypes = { ...variantProp, uid: PropTypes.string.isRequired };
CoverAmbientDust.propTypes = { ...variantProp, uid: PropTypes.string.isRequired };
