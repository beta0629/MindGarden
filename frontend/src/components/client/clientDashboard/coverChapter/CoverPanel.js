/**
 * 커버 패널 — SVG + 내담자 메타 (햄버거·브랜드 칩은 TopChrome 단일)
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../../common/SafeText';
import {
  CLIENT_COVER_KICKER_SUFFIX,
  CLIENT_COVER_NAME_SUFFIX,
  CLIENT_COVER_PANEL_ARIA
} from '../constants';
import CoverClinicSvg, {
  COVER_CLINIC_SVG_VARIANT_PORTRAIT
} from './CoverClinicSvg';

/**
 * @param {object} props
 * @param {string} props.brandLabel
 * @param {string} props.userName
 * @param {string} props.coverSub
 * @param {'portrait'|'landscape'} [props.svgVariant] split 좌커버=portrait · stack 전폭=landscape
 */
const CoverPanel = ({
  brandLabel,
  userName,
  coverSub,
  svgVariant = COVER_CLINIC_SVG_VARIANT_PORTRAIT
}) => {
  const brand = String(brandLabel || '').trim();
  const name = String(userName || '').trim();
  const kicker = brand
    ? `${brand} · ${CLIENT_COVER_KICKER_SUFFIX}`
    : CLIENT_COVER_KICKER_SUFFIX;

  return (
    <section className="client-cover__cover" aria-label={CLIENT_COVER_PANEL_ARIA}>
      <div className="client-cover__clip" aria-hidden="true">
        <CoverClinicSvg variant={svgVariant} />
      </div>
      <div className="client-cover__meta">
        <p className="client-cover__kicker">
          <SafeText>{kicker}</SafeText>
        </p>
        <h1 className="client-cover__name">
          {name ? (
            <>
              <SafeText>{name}</SafeText>
              {' '}
              {CLIENT_COVER_NAME_SUFFIX}
            </>
          ) : (
            <SafeText fallback=""> </SafeText>
          )}
        </h1>
        {coverSub ? (
          <p className="client-cover__sub">
            <SafeText>{coverSub}</SafeText>
          </p>
        ) : null}
      </div>
    </section>
  );
};

CoverPanel.propTypes = {
  brandLabel: PropTypes.string,
  userName: PropTypes.string,
  coverSub: PropTypes.string,
  svgVariant: PropTypes.oneOf(['portrait', 'landscape'])
};

export default CoverPanel;
