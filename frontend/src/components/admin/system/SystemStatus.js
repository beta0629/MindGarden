import React, { useState, useCallback } from 'react';
import { FaServer, FaDatabase, FaSync } from 'react-icons/fa';

const SystemStatus = ({ onStatusCheck, systemStatus, loading }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return '#28a745';
            case 'error': return '#dc3545';
            default: return '#ffc107';
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
                <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={onStatusCheck}
                    disabled={loading}
                >
                    <FaSync className={loading ? 'spinning' : ''} />
                    상태 체크
                </button>
            </div>
            
            <div className="system-status-content">
                <div className="status-item">
                    <div className="status-indicator">
                        <FaServer />
                        <span 
                            className="status-dot"
                            data-status={systemStatus.server}
                        ></span>
                    </div>
                    <div className="status-info">
                        <span className="status-label">서버</span>
                        <span className="status-value">{getStatusText(systemStatus.server)}</span>
                    </div>
                </div>
                
                <div className="status-item">
                    <div className="status-indicator">
                        <FaDatabase />
                        <span 
                            className="status-dot"
                            data-status={systemStatus.database}
                        ></span>
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
