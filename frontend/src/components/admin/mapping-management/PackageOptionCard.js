/**
 * PackageOptionCard — 매핑 패키지 선택 칩 (현재 vs 선택 구분)
 * Clinic-OS dusty teal. B0KlA/Pencil accent bar 금지.
 *
 * @author CoreSolution
 * @since 2026-09-05
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import './PackageOptionCard.css';

const ROOT = 'mg-v2-package-option-card';

/**
 * @param {object} props
 * @param {string|number} props.id
 * @param {string} props.label
 * @param {string} props.meta
 * @param {boolean} props.isCurrent
 * @param {boolean} props.isSelected
 * @param {string} props.badgeCurrentLabel
 * @param {string} [props.ariaLabel]
 * @param {Function} props.onClick
 * @param {boolean} [props.disabled]
 * @param {string} [props.className]
 */
const PackageOptionCard = ({
  id,
  label,
  meta,
  isCurrent,
  isSelected,
  badgeCurrentLabel,
  ariaLabel,
  onClick,
  disabled = false,
  className = ''
}) => {
  const stateClass = [
    ROOT,
    isCurrent ? `${ROOT}--current` : '',
    isSelected ? `${ROOT}--selected` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <MGButton
      type="button"
      variant="outline"
      className={stateClass}
      onClick={onClick}
      disabled={disabled}
      preventDoubleClick={false}
      aria-pressed={isSelected}
      aria-label={ariaLabel || label}
      data-package-id={id}
      data-package-current={isCurrent ? 'true' : 'false'}
      data-package-selected={isSelected ? 'true' : 'false'}
    >
      <span className={`${ROOT}__header`}>
        <SafeText className={`${ROOT}__label`} tag="span">
          {label}
        </SafeText>
        {isCurrent && (
          <span className={`${ROOT}__badge`}>
            {badgeCurrentLabel}
          </span>
        )}
      </span>
      <span className={`${ROOT}__meta`}>{meta}</span>
    </MGButton>
  );
};

PackageOptionCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  meta: PropTypes.string.isRequired,
  isCurrent: PropTypes.bool,
  isSelected: PropTypes.bool,
  badgeCurrentLabel: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default PackageOptionCard;
