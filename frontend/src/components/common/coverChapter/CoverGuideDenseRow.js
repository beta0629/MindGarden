/**
 * Cover guide dense row — 제목/본문 2줄 + 우측 chevron
 * 내담자 GuideChapter · 상담사 ConsultantHomeGuideChapter 공용.
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import SafeText from '../SafeText';
import './CoverGuideDenseRow.css';

const COVER_GUIDE_DENSE_CHEVRON = '›';

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.body
 * @param {() => void} [props.onClick]
 * @param {string} [props.href]
 * @param {string} [props.ariaLabel]
 * @param {boolean} [props.asButton]
 * @param {string} [props.className]
 * @param {string} [props['data-testid']]
 */
const CoverGuideDenseRow = ({
  title,
  body,
  onClick,
  href,
  ariaLabel,
  asButton = false,
  className = '',
  'data-testid': dataTestId
}) => {
  const rootClass = ['cover-guide-dense', className].filter(Boolean).join(' ');
  const content = (
    <>
      <span className="cover-guide-dense__text">
        <span className="cover-guide-dense__title">
          <SafeText tag="span">{title}</SafeText>
        </span>
        <span className="cover-guide-dense__body">
          <SafeText tag="span">{body}</SafeText>
        </span>
      </span>
      <span className="cover-guide-dense__go" aria-hidden="true">
        {COVER_GUIDE_DENSE_CHEVRON}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        className={rootClass}
        aria-label={ariaLabel}
        data-testid={dataTestId}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  if (asButton || typeof onClick === 'function') {
    return (
      <button
        type="button"
        className={rootClass}
        aria-label={ariaLabel}
        data-testid={dataTestId}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={rootClass}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      role={ariaLabel ? 'group' : undefined}
    >
      {content}
    </div>
  );
};

CoverGuideDenseRow.propTypes = {
  title: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  href: PropTypes.string,
  ariaLabel: PropTypes.string,
  asButton: PropTypes.bool,
  className: PropTypes.string,
  'data-testid': PropTypes.string
};

export default CoverGuideDenseRow;
