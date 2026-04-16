/**
 * ViewModeToggle — list view switcher (large card / small card / list, or custom options).
 * B0KlA pill styles; pills render **label text only** (no icons).
 *
 * Option `icon` / `iconName` and prop `iconOnly`: PropTypes only; not used for rendering (text-only pills).
 *
 * @author Core Solution
 * @since 2025-03-17
 * @see docs/project-management/USER_MANAGEMENT_VIEW_MODE_MEETING.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../utils/safeDisplay';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from './MGButton';
import './ViewModeToggle.css';

const DEFAULT_OPTIONS = [
  { value: 'largeCard', label: '\u{D070} \uCE74\uB4DC' },
  { value: 'smallCard', label: '\uC791\uC740 \uCE74\uB4DC' },
  { value: 'list', label: '\uB9AC\uC2A4\uD2B8' }
];

function ViewModeToggle({
  viewMode,
  onViewModeChange,
  options = DEFAULT_OPTIONS,
  className = '',
  ariaLabel = '\uBAA9\uB85D \uBCF4\uAE30 \uC804\uD658',
  // @deprecated Ignored; pills always show labels.
  iconOnly = false
}) {
  void iconOnly;

  const baseClass = 'mg-v2-ad-b0kla__pill-toggle';
  const containerClass = [baseClass, className].filter(Boolean).join(' ');

  return (
    <div
      className={containerClass}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const isActive = viewMode === opt.value;
        const title = toDisplayString(opt.title ?? opt.label);

        return (
          <MGButton
            key={opt.value}
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: `mg-v2-ad-b0kla__pill ${isActive ? 'mg-v2-ad-b0kla__pill--active' : ''}`
            })}
            onClick={() => onViewModeChange(opt.value)}
            aria-pressed={isActive}
            aria-label={toDisplayString(opt.label)}
            title={title}
            preventDoubleClick={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          >
            <span className="mg-v2-ad-b0kla__pill-label">{toDisplayString(opt.label)}</span>
          </MGButton>
        );
      })}
    </div>
  );
}

ViewModeToggle.propTypes = {
  viewMode: PropTypes.string.isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      title: PropTypes.string,
      /** @deprecated Ignored; kept for call-site compatibility. */
      icon: PropTypes.elementType,
      /** @deprecated Ignored; kept for call-site compatibility. */
      iconName: PropTypes.string
    })
  ),
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  /** @deprecated Ignored; labels are always shown. */
  iconOnly: PropTypes.bool
};

ViewModeToggle.defaultProps = {
  options: DEFAULT_OPTIONS,
  className: '',
  ariaLabel: '\uBAA9\uB85D \uBCF4\uAE30 \uC804\uD658',
  iconOnly: false
};

export default ViewModeToggle;
