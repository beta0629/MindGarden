import React from 'react';
import PropTypes from 'prop-types';
import './SavedViewChip.css';

/**
 * 저장된 뷰 Chip (Atoms)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */
const SavedViewChip = ({
  label,
  isActive = false,
  onClick,
  onDismiss,
  isReadonly = false,
  testId
}) => {
  const dismissable = !isReadonly && typeof onDismiss === 'function';

  return (
    <span
      className={`mg-v2-saved-view-chip-wrap${
        isActive ? ' mg-v2-saved-view-chip-wrap--active' : ''
      }`}
    >
      <button
        type="button"
        className={`mg-v2-saved-view-chip${isActive ? ' mg-v2-saved-view-chip--active' : ''}`}
        onClick={onClick}
        aria-pressed={isActive}
        data-testid={testId}
      >
        {label}
      </button>
      {dismissable && (
        <button
          type="button"
          className="mg-v2-saved-view-chip__dismiss"
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          aria-label={`${label} 삭제`}
          data-testid={`${testId}-dismiss`}
        >
          ×
        </button>
      )}
    </span>
  );
};

SavedViewChip.propTypes = {
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onDismiss: PropTypes.func,
  isReadonly: PropTypes.bool,
  testId: PropTypes.string
};

export default SavedViewChip;
