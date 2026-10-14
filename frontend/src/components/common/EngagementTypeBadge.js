/**
 * EngagementTypeBadge — 배정 계약 유형 배지 (기관연동 / 바우처)
 *
 * 회기권은 기본값이라 그리지 않는다. 바우처 데이터가 없으면 렌더 슬롯만 두고 null.
 * remainingSessions 로 유형을 추정하지 않는다. 공용 RemainingSessionsBadge 를 바꾸지 않는다.
 * 좁은 칩에서는 라벨 가운데 분리점(기관/연계)만 wrap 하고, 스크린리더는 전체 라벨을 읽는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import React from 'react';
import PropTypes from 'prop-types';
import Badge from './Badge';
import {
  ENGAGEMENT_TYPE_BADGE_CLASS,
  ENGAGEMENT_TYPE_BADGE_SEG_CLASS,
  ENGAGEMENT_TYPE_BADGE_TEST_ID,
  MAPPING_ENGAGEMENT_BADGE_STATUS_VARIANT,
  MAPPING_ENGAGEMENT_TYPE,
  MAPPING_ENGAGEMENT_TYPE_LABELS,
  getEngagementTypeLabelSegments,
  normalizeEngagementTypeValue,
  resolveMappingEngagementType,
  shouldRenderEngagementTypeBadge
} from '../../constants/mappingEngagementType';
import './EngagementTypeBadge.css';

/**
 * @param {string} label
 * @param {string[]} segments
 * @returns {import('react').ReactNode}
 */
function renderEngagementLabel(label, segments) {
  if (!Array.isArray(segments) || segments.length <= 1) {
    return label;
  }
  return segments.map((seg, index) => (
    <React.Fragment key={`${seg}-${index}`}>
      {index > 0 ? <wbr /> : null}
      <span className={ENGAGEMENT_TYPE_BADGE_SEG_CLASS} aria-hidden="true">{seg}</span>
    </React.Fragment>
  ));
}

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
  const segments = getEngagementTypeLabelSegments(resolved);
  const statusVariant = MAPPING_ENGAGEMENT_BADGE_STATUS_VARIANT[resolved];
  const classes = [ENGAGEMENT_TYPE_BADGE_CLASS, className].filter(Boolean).join(' ');

  return (
    <Badge
      variant="status"
      size={size}
      statusVariant={statusVariant}
      label={renderEngagementLabel(label, segments)}
      className={classes}
      data-testid={ENGAGEMENT_TYPE_BADGE_TEST_ID}
      data-engagement-type={resolved}
      aria-label={label}
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
