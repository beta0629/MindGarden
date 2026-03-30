import React from 'react';
import { User, Package } from 'lucide-react';
import Avatar from '../common/Avatar';
import StatusBadge from '../common/StatusBadge';

const MappingCard = ({
    mapping,
    onClick,
    actions = null
}) => {
    return(
        <div 
            className="mg-v2-card mg-v2-mapping-card"
            onClick={ onClick }
        >
            <div className="mg-v2-mapping-card-header">
                <div className="mg-v2-mapping-card-title-section">
                    <Avatar
                        profileImageUrl={mapping.clientProfileImageUrl || mapping.client?.profileImageUrl}
                        displayName={mapping.clientName}
                        className="mg-v2-client-avatar"
                    />
                    <div className="mg-v2-mapping-client-info">
                        <h5 className="mg-v2-client-name">
                            { mapping.clientName || '알 수 없음' }
                        </h5>
                        <span className="mg-v2-client-badge">
                            내담자
                        </span>
                    </div>
                </div>
                <StatusBadge status={mapping.status} />
            </div>

            <div className="mg-v2-mapping-card-details">
                <div className="mg-v2-mapping-detail-item">
                    <User size={ 14 } />
                    { mapping.consultantName }
                </div>
                <div className="mg-v2-mapping-detail-item">
                    <Package size={ 14 } />
                    { mapping.packageName }
                </div>
            </div>

            <div className="mg-v2-mapping-sessions-grid">
                <div className="mg-v2-session-stat mg-v2-session-stat-total">
                    <div className="mg-v2-session-stat-label">총</div>
                    <div className="mg-v2-session-stat-value">{ mapping.totalSessions }</div>
                </div>
                <div className="mg-v2-session-stat mg-v2-session-stat-used">
                    <div className="mg-v2-session-stat-label">사용</div>
                    <div className="mg-v2-session-stat-value">{ mapping.usedSessions }</div>
                </div>
                <div className="mg-v2-session-stat mg-v2-session-stat-remaining">
                    <div className="mg-v2-session-stat-label">남은</div>
                    <div className="mg-v2-session-stat-value">{ mapping.remainingSessions }</div>
                </div>
            </div>

            {actions && (
                <div className="mg-v2-mapping-card-actions">
                    { actions }
                </div>
            )}
        </div>
    );
};

export default MappingCard;