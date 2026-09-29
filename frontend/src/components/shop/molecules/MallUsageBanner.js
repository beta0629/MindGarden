/**
 * MallUsageBanner — §9 이용기간 안내 (목록 · 장바구니 · 결제 줄마다)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ICONS, ICON_SIZES } from '../../../constants/icons';

const InfoIcon = ICONS.INFO;

/**
 * @param {{ text: string, example?: string, testId?: string, compact?: boolean }} props
 */
const MallUsageBanner = ({ text, example = '', testId, compact = false }) => (
  <div
    className={['client-mall-notice', compact ? 'client-mall-notice--compact' : ''].filter(Boolean).join(' ')}
    data-testid={testId}
  >
    {InfoIcon ? <InfoIcon size={ICON_SIZES.MD} aria-hidden className="client-mall-notice__icon" /> : null}
    <div className="client-mall-notice__text">
      <p className="client-mall-notice__body">{text}</p>
      {example ? <p className="client-mall-notice__example">{example}</p> : null}
    </div>
  </div>
);

MallUsageBanner.propTypes = {
  text: PropTypes.string.isRequired,
  example: PropTypes.string,
  testId: PropTypes.string,
  compact: PropTypes.bool
};

export default MallUsageBanner;
