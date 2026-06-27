/**
 * SocialProofLogos — Hero 좌측 하단 사회적 증명 로고 (Molecule)
 *
 * Design v2 Refine v2 SPEC §3.2: "현재 N+ 기업이 사용 중" 라벨 + 기업 로고 리스트.
 * 로고는 인라인 SVG(grayscale + opacity)로 처리하여 외부 이미지 의존을 피한다.
 *
 * Props:
 * - label: 상단 텍스트 (예: "현재 200+ 기업이 사용 중") — 운영 슬롯
 * - logos: 로고 배열 [{ key, name, src }] — src 미지정 시 기본 로고 SVG 사용
 *
 * mg-v2-* 토큰 한정, 하드코딩 0.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import logoAcme from '../../../assets/landing/logo-acme.svg';
import logoGlobex from '../../../assets/landing/logo-globex.svg';
import logoInitech from '../../../assets/landing/logo-initech.svg';
import logoUmbrella from '../../../assets/landing/logo-umbrella.svg';
import logoCyberdyne from '../../../assets/landing/logo-cyberdyne.svg';
import { LANDING_SOCIAL_PROOF_LOGO_KEYS } from '../../../constants/landingPublic';
import './SocialProofLogos.css';

const DEFAULT_LOGO_SOURCES = {
  acme: logoAcme,
  globex: logoGlobex,
  initech: logoInitech,
  umbrella: logoUmbrella,
  cyberdyne: logoCyberdyne,
};

const SocialProofLogos = ({
  label = null,
  logos = LANDING_SOCIAL_PROOF_LOGO_KEYS,
  listAriaLabel = 'Customer logos',
}) => {
  if (!logos || logos.length === 0) {
    return null;
  }

  return (
    <div
      className="mg-v2-social-proof"
      aria-label={listAriaLabel}
      role="group"
    >
      {label && (
        <p className="mg-v2-social-proof__label">{label}</p>
      )}
      <ul className="mg-v2-social-proof__list">
        {logos.map((logo) => {
          const src = logo.src || DEFAULT_LOGO_SOURCES[logo.key];
          if (!src) return null;
          return (
            <li key={logo.key} className="mg-v2-social-proof__item">
              <img
                className="mg-v2-social-proof__logo"
                src={src}
                alt={logo.name}
                loading="lazy"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

SocialProofLogos.propTypes = {
  label: PropTypes.node,
  logos: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      src: PropTypes.string,
    })
  ),
  listAriaLabel: PropTypes.string,
};

export default SocialProofLogos;
