/**
 * EngagementTypeBadge — 배정 계약 유형 배지 (기관연동 / 바우처)
 *
 * 회기권은 기본값이라 그리지 않는다. 바우처 데이터가 없으면 렌더 슬롯만 두고 null.
 * remainingSessions 로 유형을 추정하지 않는다. 공용 RemainingSessionsBadge 를 바꾸지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import React from 'react';
import PropTypes from 'prop-types';
import Badge from './Badge';
import {
  ENGAGEMENT_TYPE_BADGE_CLASS,
  ENGAGEMENT_TYPE_BADGE_TEST_ID,
  MAPPING_ENGAGEMENT_BADGE_STATUS_VARIANT,
  MAPPING_ENGAGEMENT_TYPE,
  MAPPING_ENGAGEMENT_TYPE_LABELS,
  normalizeEngagementTypeValue,
  resolveMappingEngagementType,
  shouldRenderEngagementTypeBadge
} from '../../constants/mappingEngagementType';

function EngagementTypeBadge({
  type,
  mapping,
  source,
  size = 'sm',
  className = ''
}) {
  const resolved = type
    ? normalizeEngagementTypeValue(type)
    : resolveMappingEngagementType(mapping || source);
  if (!shouldRenderEngagementTypeBadge(resolved)) {
    return null;
  }
  const label = MAPPING_ENGAGEMENT_TYPE_LABELS[resolved];
  const statusVariant = MAPPING_ENGAGEMENT_BADGE_STATUS_VARIANT[resolved];
  const classes = [ENGAGEMENT_TYPE_BADGE_CLASS, className].filter(Boolean).join(' ');

  return (
    <Badge
      variant="status"
      size={size}
      statusVariant={statusVariant}
      label={label}
      className={classes}
      data-testid={ENGAGEMENT_TYPE_BADGE_TEST_ID}
      data-engagement-type={resolved}
    />
  );
}

EngagementTypeBadge.propTypes = {
  type: PropTypes.oneOf(Object.values(MAPPING_ENGAGEMENT_TYPE)),
  mapping: PropTypes.object,
  source: PropTypes.object,
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  className: PropTypes.string
};

EngagementTypeBadge.defaultProps = {
  type: undefined,
  mapping: null,
  source: null,
  size: 'sm',
  className: ''
};

export default EngagementTypeBadge;
