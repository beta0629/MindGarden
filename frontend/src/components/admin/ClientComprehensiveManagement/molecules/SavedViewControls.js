import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import SavedViewChip from '../atoms/SavedViewChip';
import SaveViewModal from './SaveViewModal';
import {
  USER_MANAGEMENT_SAVED_VIEW_CHIP_DROPDOWN_THRESHOLD,
  USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID,
  USER_MANAGEMENT_SAVED_VIEW_DEFAULT_LABEL
} from '../../../../constants/userManagementSavedViewConstants';
import './SavedViewControls.css';

const SAVED_VIEW_SAVE_LABEL = '현재 뷰 저장';
const SAVED_VIEW_LOAD_PLACEHOLDER = '저장된 뷰 불러오기';

/**
 * Saved View Controls (Molecules)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */
const SavedViewControls = ({
  views,
  activeViewId,
  onSelectView,
  onSaveView,
  onResetToDefault
}) => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const userViews = useMemo(
    () => (views ?? []).filter((view) => view.id !== USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID),
    [views]
  );

  const useDropdown = userViews.length >= USER_MANAGEMENT_SAVED_VIEW_CHIP_DROPDOWN_THRESHOLD;

  const handleLoadChange = (event) => {
    const { value } = event.target;
    if (!value) {
      return;
    }
    onSelectView(value);
  };

  return (
    <div className="mg-v2-saved-view-controls" data-testid="saved-view-controls">
      <SavedViewChip
        label={USER_MANAGEMENT_SAVED_VIEW_DEFAULT_LABEL}
        isActive={activeViewId === USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID}
        onClick={onResetToDefault}
        testId="saved-view-chip-default"
      />

      {!useDropdown && userViews.map((view) => (
        <SavedViewChip
          key={view.id}
          label={view.label}
          isActive={activeViewId === view.id}
          onClick={() => onSelectView(view.id)}
          testId={`saved-view-chip-${view.id}`}
        />
      ))}

      {useDropdown && userViews.length > 0 && (
        <select
          className="mg-v2-select mg-v2-saved-view-controls__load-select"
          value={activeViewId === USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID ? '' : activeViewId}
          onChange={handleLoadChange}
          aria-label={SAVED_VIEW_LOAD_PLACEHOLDER}
          data-testid="saved-view-load-select"
        >
          <option value="">{SAVED_VIEW_LOAD_PLACEHOLDER}</option>
          {userViews.map((view) => (
            <option key={view.id} value={view.id}>
              {view.label}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        className="mg-v2-saved-view-controls__save-btn"
        onClick={() => setSaveModalOpen(true)}
        data-testid="saved-view-save-btn"
      >
        {SAVED_VIEW_SAVE_LABEL}
      </button>

      <SaveViewModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={onSaveView}
      />
    </div>
  );
};

SavedViewControls.propTypes = {
  views: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  activeViewId: PropTypes.string.isRequired,
  onSelectView: PropTypes.func.isRequired,
  onSaveView: PropTypes.func.isRequired,
  onResetToDefault: PropTypes.func.isRequired
};

export default SavedViewControls;
