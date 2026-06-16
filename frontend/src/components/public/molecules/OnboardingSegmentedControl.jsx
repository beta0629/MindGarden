/**
 * OnboardingSegmentedControl — 4분할 세그먼트 선택 Molecule (Phase C-Refine v2)
 *
 * SPEC §3.2: 임직원 규모 4분할 Segmented Control.
 *   - 각 세그먼트 균등 분할 (grid 1fr * n)
 *   - 선택된 항목 배경 Primary, 미선택은 옅은 회색
 *   - 키보드 (Enter/Space/Arrow) 접근성
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import './OnboardingSegmentedControl.css';

const KEY_LEFT = 'ArrowLeft';
const KEY_RIGHT = 'ArrowRight';
const KEY_ENTER = 'Enter';
const KEY_SPACE = ' ';

const OnboardingSegmentedControl = ({
  options,
  value,
  onChange,
  name = 'onboarding-segmented',
  className = '',
  ariaLabel,
}) => {
  const handleSelect = useCallback((nextValue) => {
    if (!onChange) return;
    onChange({
      target: { name, value: nextValue, type: 'text' },
    });
  }, [name, onChange]);

  const handleKeyDown = useCallback((event, index) => {
    if (event.key === KEY_ENTER || event.key === KEY_SPACE) {
      event.preventDefault();
      handleSelect(options[index].value);
      return;
    }
    if (event.key === KEY_LEFT || event.key === KEY_RIGHT) {
      event.preventDefault();
      const dir = event.key === KEY_LEFT ? -1 : 1;
      const nextIndex = (index + dir + options.length) % options.length;
      handleSelect(options[nextIndex].value);
    }
  }, [handleSelect, options]);

  return (
    <div
      className={`mg-v2-onboarding-segmented ${className}`.trim()}
      role="radiogroup"
      aria-label={ariaLabel}
      style={{ '--mg-v2-onboarding-segmented-cols': options.length }}
    >
      {options.map((option, index) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`mg-v2-onboarding-segmented__item${isSelected ? ' mg-v2-onboarding-segmented__item--selected' : ''}`}
            onClick={() => handleSelect(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            tabIndex={isSelected || (value === undefined && index === 0) ? 0 : -1}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

OnboardingSegmentedControl.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  name: PropTypes.string,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default OnboardingSegmentedControl;
