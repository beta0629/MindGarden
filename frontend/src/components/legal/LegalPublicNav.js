/**
 * 공개 /legal/* 공통 내비 (terms · privacy · products · refund)
 *
 * @author CoreSolution
 * @since 2026-09-11
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  LEGAL_PUBLIC_LABELS,
  LEGAL_PUBLIC_PATHS
} from '../../constants/legalPublic';

const NAV_ITEMS = Object.freeze([
  { key: 'terms', path: LEGAL_PUBLIC_PATHS.TERMS, label: LEGAL_PUBLIC_LABELS.TERMS },
  { key: 'privacy', path: LEGAL_PUBLIC_PATHS.PRIVACY, label: LEGAL_PUBLIC_LABELS.PRIVACY },
  { key: 'products', path: LEGAL_PUBLIC_PATHS.PRODUCTS, label: LEGAL_PUBLIC_LABELS.PRODUCTS },
  { key: 'refund', path: LEGAL_PUBLIC_PATHS.REFUND, label: LEGAL_PUBLIC_LABELS.REFUND }
]);

/**
 * @param {object} props
 * @param {'terms'|'privacy'|'products'|'refund'} [props.active]
 */
const LegalPublicNav = ({ active = '' }) => (
  <nav className="mg-platform-legal__nav" aria-label="법적 문서">
    {NAV_ITEMS.map((item) => (
      <Link
        key={item.key}
        to={item.path}
        className={`mg-platform-legal__nav-link${
          active === item.key ? ' mg-platform-legal__nav-link--active' : ''
        }`}
      >
        {item.label}
      </Link>
    ))}
  </nav>
);

LegalPublicNav.propTypes = {
  active: PropTypes.oneOf(['terms', 'privacy', 'products', 'refund', ''])
};

export default LegalPublicNav;
