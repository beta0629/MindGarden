import React from 'react';
import { FaServer, FaDatabase, FaSync } from 'react-icons/fa';
import MGButton from '../../common/MGButton';

const SystemStatus = ({ onStatusCheck, systemStatus, loading }) => {
    const getStatusModifier = (status) => {
        switch (status) {
            case 'healthy': return 'mg-status-dot--success';
            case 'error': return 'mg-status-dot--error';
            default: return 'mg-status-dot--warning';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'healthy': return '정상';
            case 'error': return '오류';
            default: return '미확인';
        }
    };

    return (
        <div className="system-status-display">
            <div className="system-status-header">
                <h4>시스템 상태</h4>
                <MGButton
                    variant="outline"
                    size="small"
                    onClick={onStatusCheck}
                    disabled={loading}
                >
                    <FaSync className={loading ? 'spinning' : ''} />
                    {' '}
                    상태 체크
                </MGButton>
            </div>
            
            <div className="system-status-content">
                <div className="status-item">
                    <div className="status-indicator">
                        <span className="status-icon-wrap">
                            <FaServer />
                        </span>
                        <span
                            className={`mg-status-dot ${getStatusModifier(systemStatus.server)}`}
                            data-status={systemStatus.server}
                        />
                    </div>
                    <div className="status-info">
                        <span className="status-label">서버</span>
                        <span className="status-value">{getStatusText(systemStatus.server)}</span>
                    </div>
                </div>
                
                <div className="status-item">
                    <div className="status-indicator">
                        <span className="status-icon-wrap">
                            <FaDatabase />
                        </span>
                        <span
                            className={`mg-status-dot ${getStatusModifier(systemStatus.database)}`}
                            data-status={systemStatus.database}
                        />
                    </div>
                    <div className="status-info">
                        <span className="status-label">데이터베이스</span>
                        <span className="status-value">{getStatusText(systemStatus.database)}</span>
                    </div>
                </div>
                
                {systemStatus.lastChecked && (
                    <div className="status-timestamp">
                        마지막 확인: {systemStatus.lastChecked}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemStatus;
