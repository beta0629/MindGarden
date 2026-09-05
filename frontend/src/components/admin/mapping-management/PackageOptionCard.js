/**
 * PackageOptionCard — 매핑 패키지 선택 칩 (현재 / 선택 / 변경예정 구분)
 * Clinic-OS dusty teal + warning pending-change. B0KlA/Pencil accent bar 금지.
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
 * @param {string} props.badgePendingChangeLabel
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
  badgePendingChangeLabel,
  ariaLabel,
  onClick,
  disabled = false,
  className = ''
}) => {
  const isPendingChange = Boolean(isSelected && !isCurrent);

  const stateClass = [
    ROOT,
    isCurrent ? `${ROOT}--current` : '',
    isSelected ? `${ROOT}--selected` : '',
    isPendingChange ? `${ROOT}--pending-change` : '',
    className
  ].filter(Boolean).join(' ');

  let badgeLabel = null;
  let badgeModifier = null;
  if (isCurrent) {
    badgeLabel = badgeCurrentLabel;
    badgeModifier = `${ROOT}__badge--current`;
  } else if (isPendingChange) {
    badgeLabel = badgePendingChangeLabel;
    badgeModifier = `${ROOT}__badge--pending-change`;
  }

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
      data-package-pending-change={isPendingChange ? 'true' : 'false'}
    >
      <span className={`${ROOT}__header`}>
        <SafeText className={`${ROOT}__label`} tag="span">
          {label}
        </SafeText>
        {badgeLabel && (
          <span className={[`${ROOT}__badge`, badgeModifier].filter(Boolean).join(' ')}>
            {badgeLabel}
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
  badgePendingChangeLabel: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default PackageOptionCard;
