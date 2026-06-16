/**
 * LandingHero — 랜딩 Hero 섹션 (Organism)
 *
 * Design v2 Refine v2 W3 SPEC §3.2 / §3.3 — 좌우 50:50 분할.
 *  - 좌측: Eyebrow Chip → H1(2줄, 두번째 줄 그라데이션) → Sub-H1 →
 *          Primary / Secondary CTA → SocialProofLogos
 *  - 우측: DashboardPreview 슬롯 (SVG 이미지)
 *
 * 운영팀 슬롯은 모두 props로 주입(useState 없음). 디폴트는 W3 SPEC 카피.
 * 기존 `titleSlot` 단일 H1 prop은 하위 호환을 위해 유지 (titleLine1Slot이 없을 때 사용).
 *
 * mg-v2-* 토큰 한정, 하드코딩 0.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import HeroEyebrowChip from '../atoms/HeroEyebrowChip';
import './LandingHero.css';

const DEFAULT_LEGACY_TITLE = '마음을 돌보는 가장 안정적인 공간';
const DEFAULT_LEGACY_SUBTITLE = '상담 기록부터 예약 관리까지, 원장님을 위한 완벽한 솔루션';
const DEFAULT_PRIMARY_LABEL = '무료로 시작하기';
const DEFAULT_SECONDARY_LABEL = '요금제 보기';
const ARIA_LABEL_HERO = 'Hero';

const LandingHero = ({
  eyebrowSlot = null,
  titleSlot = DEFAULT_LEGACY_TITLE,
  titleLine1Slot = null,
  titleLine2Slot = null,
  subtitleSlot = DEFAULT_LEGACY_SUBTITLE,
  primaryCta = { label: DEFAULT_PRIMARY_LABEL, onClick: undefined },
  secondaryCta = { label: DEFAULT_SECONDARY_LABEL, onClick: undefined },
  heroImageSlot = null,
  dashboardSlot = null,
  socialProofSlot = null,
}) => {
  const hasTwoLineTitle = Boolean(titleLine1Slot) || Boolean(titleLine2Slot);
  const mediaContent = dashboardSlot || heroImageSlot;

  return (
    <section className="mg-v2-landing-hero" aria-label={ARIA_LABEL_HERO}>
      <div className="mg-v2-landing-hero__content">
        {eyebrowSlot && (
          <div className="mg-v2-landing-hero__eyebrow">
            {typeof eyebrowSlot === 'string' ? (
              <HeroEyebrowChip>{eyebrowSlot}</HeroEyebrowChip>
            ) : (
              eyebrowSlot
            )}
          </div>
        )}

        <h1 className="mg-v2-landing-hero__title">
          {hasTwoLineTitle ? (
            <>
              {titleLine1Slot && (
                <span className="mg-v2-landing-hero__title-line">
                  {titleLine1Slot}
                </span>
              )}
              {titleLine2Slot && (
                <span className="mg-v2-landing-hero__title-line mg-v2-landing-hero__title-line--gradient">
                  {titleLine2Slot}
                </span>
              )}
            </>
          ) : (
            titleSlot
          )}
        </h1>

        <p className="mg-v2-landing-hero__subtitle">{subtitleSlot}</p>

        <div className="mg-v2-landing-hero__cta-group">
          <button
            type="button"
            className="mg-v2-landing-hero__cta mg-v2-landing-hero__cta--primary"
            onClick={primaryCta.onClick}
          >
            {primaryCta.label}
          </button>
          <button
            type="button"
            className="mg-v2-landing-hero__cta mg-v2-landing-hero__cta--secondary"
            onClick={secondaryCta.onClick}
          >
            <span className="mg-v2-landing-hero__cta-label">{secondaryCta.label}</span>
          </button>
        </div>

        {socialProofSlot && (
          <div className="mg-v2-landing-hero__social-proof">
            {socialProofSlot}
          </div>
        )}
      </div>

      <div className="mg-v2-landing-hero__media">
        {mediaContent ? (
          typeof mediaContent === 'string' ? (
            <img
              className="mg-v2-landing-hero__image"
              src={mediaContent}
              alt="Core Solution 대시보드"
              loading="lazy"
              decoding="async"
            />
          ) : (
            mediaContent
          )
        ) : (
          <div
            className="mg-v2-landing-hero__image"
            role="img"
            aria-label="Hero placeholder"
          />
        )}
      </div>
    </section>
  );
};

LandingHero.propTypes = {
  eyebrowSlot: PropTypes.node,
  titleSlot: PropTypes.node,
  titleLine1Slot: PropTypes.node,
  titleLine2Slot: PropTypes.node,
  subtitleSlot: PropTypes.node,
  primaryCta: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
  }),
  secondaryCta: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
  }),
  heroImageSlot: PropTypes.node,
  dashboardSlot: PropTypes.node,
  socialProofSlot: PropTypes.node,
};

export default LandingHero;
