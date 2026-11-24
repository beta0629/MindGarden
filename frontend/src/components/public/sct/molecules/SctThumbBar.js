/**
 * SCT 공개 — 하단 엄지 바 (주 액션 + 아동 쉬었다 할래요)
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../../common/MGButton';
import { SCT_CSS, SCT_TEST_ID, SCT_UI } from '../../../../constants/sctOnline';

/**
 * @param {{
 *   primaryLabel: string,
 *   onPrimary: () => void,
 *   primaryDisabled?: boolean,
 *   secondaryLabel?: string,
 *   onSecondary?: () => void,
 *   showPause?: boolean,
 *   onPause?: () => void,
 *   loading?: boolean
 * }} props
 */
const SctThumbBar = ({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
  showPause = false,
  onPause,
  loading = false
}) => (
  <footer className={SCT_CSS.BAR} data-testid={SCT_TEST_ID.THUMB_BAR}>
    {showPause ? (
      <MGButton
        type="button"
        variant="outline"
        preventDoubleClick={false}
        className="mg-v2-sct-bar__prev"
        onClick={onPause}
        data-testid={SCT_TEST_ID.PAUSE_CHILD}
      >
        {SCT_UI.PAUSE_CHILD}
      </MGButton>
    ) : null}
    {secondaryLabel && onSecondary ? (
      <MGButton
        type="button"
        variant="outline"
        preventDoubleClick={false}
        className="mg-v2-sct-bar__prev"
        onClick={onSecondary}
        disabled={loading}
      >
        {secondaryLabel}
      </MGButton>
    ) : null}
    <MGButton
      type="button"
      variant="primary"
      preventDoubleClick={false}
      onClick={onPrimary}
      disabled={primaryDisabled || loading}
      loading={loading}
    >
      {primaryLabel}
    </MGButton>
  </footer>
);

SctThumbBar.propTypes = {
  primaryLabel: PropTypes.string.isRequired,
  onPrimary: PropTypes.func.isRequired,
  primaryDisabled: PropTypes.bool,
  secondaryLabel: PropTypes.string,
  onSecondary: PropTypes.func,
  showPause: PropTypes.bool,
  onPause: PropTypes.func,
  loading: PropTypes.bool
};

export default SctThumbBar;
