/**
 * MallSessionChip — 몰 회기 칩 (slate · 아이콘 14 + 「N회기」, §5.2)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ICONS, ICON_SIZES } from '../../../constants/icons';
import { SHOP_SESSION_COUNT_COPY } from '../../../constants/clientShopConstants';
import { formatMallSessionLabel } from '../../../utils/clientMall';
import { normalizeShopSessionCount } from '../../../utils/shopSessionCount';

const ChipIcon = ICONS.LAYERS;

/**
 * @param {{ sessionCount?: number|string|null, testId?: string }} props
 */
const MallSessionChip = ({ sessionCount = 1, testId }) => {
  const label = formatMallSessionLabel(sessionCount);
  return (
    <span
      className="client-mall-chip"
      data-testid={testId}
      data-session-count={normalizeShopSessionCount(sessionCount)}
      aria-label={`${SHOP_SESSION_COUNT_COPY.LABEL} ${label}`}
    >
      {ChipIcon ? <ChipIcon size={ICON_SIZES.SM} aria-hidden className="client-mall-chip__icon" /> : null}
      <span className="client-mall-chip__label">{label}</span>
    </span>
  );
};

MallSessionChip.propTypes = {
  sessionCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  testId: PropTypes.string
};

export default MallSessionChip;
