import React from 'react';
import PropTypes from 'prop-types';

/**
 * 저장된 뷰 Chip (Atoms)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */
const SavedViewChip = ({ label, isActive = false, onClick, testId }) => (
  <button
    type="button"
    className={`mg-v2-saved-view-chip${isActive ? ' mg-v2-saved-view-chip--active' : ''}`}
    onClick={onClick}
    aria-pressed={isActive}
    data-testid={testId}
  >
    {label}
  </button>
);

SavedViewChip.propTypes = {
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  testId: PropTypes.string
};

export default SavedViewChip;
