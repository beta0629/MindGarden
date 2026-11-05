/**
 * EngagementTypeBadge — 배정 계약 유형 배지 (기관연동)
 *
 * 회기권은 기본값이라 그리지 않는다. remainingSessions 로 유형을 추정하지 않는다.
 * 바우처 선택지/CRUD 없음.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import React from 'react';
import PropTypes from 'prop-types';
import StatusBadge from './StatusBadge';
import {
  ENGAGEMENT_TYPE_BADGE_TEST_ID,
  INSTITUTION_LINK_BADGE_LABEL,
  shouldRenderInstitutionLinkBadge
} from '../../constants/clientEngagementType';

function EngagementTypeBadge({ mapping, source, type, className = '' }) {
  const resolved = type || mapping || source;
  if (!shouldRenderInstitutionLinkBadge(resolved)) {
    return null;
  }
  return (
    <StatusBadge
      variant="info"
      className={className}
      data-testid={ENGAGEMENT_TYPE_BADGE_TEST_ID}
      data-engagement-type="INSTITUTION_LINK"
    >
      {INSTITUTION_LINK_BADGE_LABEL}
    </StatusBadge>
  );
}

EngagementTypeBadge.propTypes = {
  mapping: PropTypes.object,
  source: PropTypes.object,
  type: PropTypes.string,
  className: PropTypes.string
};

EngagementTypeBadge.defaultProps = {
  mapping: null,
  source: null,
  type: undefined,
  className: ''
};

export default EngagementTypeBadge;
