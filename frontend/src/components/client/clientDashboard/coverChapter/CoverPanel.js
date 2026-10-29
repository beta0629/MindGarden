/**
 * 커버 패널 — SVG + 브랜드/내담자 메타 + 메뉴
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../../common/SafeText';
import {
  CLIENT_COVER_KICKER_SUFFIX,
  CLIENT_COVER_MENU_ARIA,
  CLIENT_COVER_NAME_SUFFIX,
  CLIENT_COVER_PANEL_ARIA
} from '../constants';
import CoverClinicSvg from './CoverClinicSvg';

/**
 * @param {object} props
 * @param {string} props.brandLabel
 * @param {string} props.userName
 * @param {string} props.coverSub
 * @param {() => void} props.onOpenMenu
 */
const CoverPanel = ({
  brandLabel,
  userName,
  coverSub,
  onOpenMenu
}) => {
  const brand = String(brandLabel || '').trim();
  const name = String(userName || '').trim();
  const kicker = brand
    ? `${brand} · ${CLIENT_COVER_KICKER_SUFFIX}`
    : CLIENT_COVER_KICKER_SUFFIX;

  return (
    <section className="client-cover__cover" aria-label={CLIENT_COVER_PANEL_ARIA}>
      <div className="client-cover__clip" aria-hidden="true">
        <CoverClinicSvg />
      </div>
      <div className="client-cover__top">
        <button
          type="button"
          className="client-cover__menu-btn"
          aria-label={CLIENT_COVER_MENU_ARIA}
          onClick={onOpenMenu}
          data-testid="client-cover-menu-btn"
        >
          <span aria-hidden="true">☰</span>
        </button>
        {brand ? (
          <span className="client-cover__brand-chip">
            <SafeText>{brand}</SafeText>
          </span>
        ) : (
          <span className="client-cover__brand-chip" aria-hidden="true" />
        )}
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
  onOpenMenu: PropTypes.func.isRequired
};

export default CoverPanel;
