/**
 * CardMeta - StatusBadge + RemainingSessionsBadge (common 컴포넌트)
 * @param {string} status - 매칭 상태
 * @param {number} remainingSessions - 남은 회기 수
 */

import React from 'react';
import PropTypes from 'prop-types';
import StatusBadge from '../../../../common/StatusBadge';
import RemainingSessionsBadge from '../../../../common/RemainingSessionsBadge';
import { renderCompactPackageName } from '../../../../../utils/packagePricing';
import { SESSION_EXTENSION_UI } from '../../../../../utils/sessionExtensionPending';
import { toSafeNumber } from '../../../../../utils/safeDisplay';
import './CardMeta.css';

const CardMeta = ({ status, remainingSessions, packageName, pendingSessionExtension }) => {
  const pendingSessions = toSafeNumber(pendingSessionExtension?.additionalSessions, null);

  return (
  <div className="integrated-schedule__card-meta">
    <StatusBadge status={status} />
    {pendingSessionExtension ? (
      <StatusBadge status="PENDING" variant="info">
        {SESSION_EXTENSION_UI.BADGE_LABEL}
        {pendingSessions != null ? ` +${pendingSessions}회기` : ''}
      </StatusBadge>
    ) : null}
    {packageName && (
      <span className="integrated-schedule__card-package">
        {renderCompactPackageName(packageName)}
      </span>
    )}
    <RemainingSessionsBadge remainingSessions={remainingSessions} />
  </div>
  );
};

CardMeta.propTypes = {
  status: PropTypes.string,
  remainingSessions: PropTypes.number,
  packageName: PropTypes.string,
  pendingSessionExtension: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    additionalSessions: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })
};

CardMeta.defaultProps = {
  status: '',
  remainingSessions: null,
  packageName: '',
  pendingSessionExtension: null
};

export default CardMeta;
