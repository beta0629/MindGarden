/**
 * DensityToggle — 통합 스케줄 사이드바 밀도(Comfortable ↔ Compact) 토글
 *
 * @author CoreSolution
 * @since 2026-07-06
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Rows3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  SIDEBAR_DENSITY_COMFORTABLE,
  SIDEBAR_DENSITY_COMPACT
} from '../../constants/integratedScheduleSidebarDensityConstants';
import './DensityToggle.css';

const DensityToggle = ({ density, onDensityChange, disabled }) => {
  const { t } = useTranslation();
  const isCompact = density === SIDEBAR_DENSITY_COMPACT;

  const handleClick = () => {
    onDensityChange(isCompact ? SIDEBAR_DENSITY_COMFORTABLE : SIDEBAR_DENSITY_COMPACT);
  };

  const ariaLabel = isCompact
    ? t('integratedSchedule.sidebar.densityComfortableAria')
    : t('integratedSchedule.sidebar.densityCompactAria');

  return (
    <button
      type="button"
      className={`integrated-schedule__density-toggle${
        isCompact ? ' integrated-schedule__density-toggle--active' : ''
      }`}
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={isCompact}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <Rows3 size={16} aria-hidden="true" />
    </button>
  );
};

DensityToggle.propTypes = {
  density: PropTypes.string.isRequired,
  onDensityChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

DensityToggle.defaultProps = {
  disabled: false
};

export default DensityToggle;
