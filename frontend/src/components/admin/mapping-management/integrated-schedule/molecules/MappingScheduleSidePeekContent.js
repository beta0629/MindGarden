/**
 * MappingScheduleSidePeekContent — 통합일정 Side Peek stub 본문
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import { parseCombinedPackageName } from '../../../../../utils/packagePricing';
import './MappingScheduleSidePeekContent.css';

const MappingScheduleSidePeekContent = ({ mapping }) => {
  if (!mapping) {
    return null;
  }

  const clientName = toDisplayString(mapping.clientName, '—');
  const consultantName = toDisplayString(mapping.consultantName, '—');
  const status = toDisplayString(mapping.status, '—');
  const remainingSessions = mapping.remainingSessions ?? '—';
  const packageParts = parseCombinedPackageName(mapping.packageName);

  return (
    <div className="integrated-schedule-side-peek-stub">
      <dl className="integrated-schedule-side-peek-stub__facts">
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>내담자</dt>
          <dd>{clientName}</dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>상담사</dt>
          <dd>{consultantName}</dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>패키지</dt>
          <dd>
            {packageParts.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                {packageParts.map((pkg, idx) => (
                  <span key={idx} className="mg-v2-chip mg-v2-chip--neutral" style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--spacing-xxs) var(--spacing-sm)' }}>
                    {pkg}
                  </span>
                ))}
              </div>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>상태</dt>
          <dd>{status}</dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>남은 회기</dt>
          <dd>{remainingSessions}</dd>
        </div>
      </dl>
      <p className="integrated-schedule-side-peek-stub__placeholder" role="note">
        타임라인·결제 이력 등 상세는 이후 Side Peek MVP에서 제공됩니다.
      </p>
    </div>
  );
};

MappingScheduleSidePeekContent.propTypes = {
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    clientName: PropTypes.string,
    consultantName: PropTypes.string,
    packageName: PropTypes.string,
    status: PropTypes.string,
    remainingSessions: PropTypes.number
  })
};

MappingScheduleSidePeekContent.defaultProps = {
  mapping: null
};

export default MappingScheduleSidePeekContent;
