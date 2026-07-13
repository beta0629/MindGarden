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
import './CardMeta.css';

const CardMeta = ({ status, remainingSessions, packageName }) => (
  <div className="integrated-schedule__card-meta">
    <StatusBadge status={status} />
    {packageName && (
      <span className="integrated-schedule__card-package">
        {renderCompactPackageName(packageName)}
      </span>
    )}
    <RemainingSessionsBadge remainingSessions={remainingSessions} />
  </div>
);

CardMeta.propTypes = {
  status: PropTypes.string,
  remainingSessions: PropTypes.number,
  packageName: PropTypes.string
};

CardMeta.defaultProps = {
  status: '',
  remainingSessions: null,
  packageName: ''
};

export default CardMeta;
