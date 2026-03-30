/**
 * ClientSessionInfo Component
 * 
 * @description 회기 현황 블록 컴포넌트 (Molecule)
 * @author Core Solution Team
 * @since 2026-03-09
 */

import React from 'react';
import PropTypes from 'prop-types';
import { TrendingUp } from 'lucide-react';

const ClientSessionInfo = ({
  totalSessions,
  usedSessions,
  remainingSessions
}) => {
  return (
    <div className="mg-v2-client-session-info">
      <div className="mg-v2-client-session-title">
        <TrendingUp size={16} />
        <span>회기 현황</span>
      </div>
      <div className="mg-v2-client-session-grid">
        <div className="mg-v2-client-session-item">
          <div className="mg-v2-client-session-value mg-v2-client-session-value--total">
            {totalSessions || 0}회
          </div>
          <div className="mg-v2-client-session-label">총 회기</div>
        </div>
        <div className="mg-v2-client-session-item">
          <div className="mg-v2-client-session-value mg-v2-client-session-value--used">
            {usedSessions || 0}회
          </div>
          <div className="mg-v2-client-session-label">사용</div>
        </div>
        <div className="mg-v2-client-session-item">
          <div className="mg-v2-client-session-value mg-v2-client-session-value--remaining">
            {remainingSessions || 0}회
          </div>
          <div className="mg-v2-client-session-label">남은 회기</div>
        </div>
      </div>
    </div>
  );
};

ClientSessionInfo.propTypes = {
  totalSessions: PropTypes.number,
  usedSessions: PropTypes.number,
  remainingSessions: PropTypes.number
};

export default ClientSessionInfo;
