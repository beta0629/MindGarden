import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import { User, Package, Plus, PauseCircle, CheckCircle } from 'lucide-react';
import { getStatusColor, getStatusIcon, getMappingStatusKoreanName } from '../../utils/codeHelper';

const MappingCard = ({ 
    mapping, 
    onClick,
    actions = null 
}) => {
    const [statusInfo, setStatusInfo] = useState({
        color: 'var(--color-gray)',
        icon: '❓',
        label: '로딩 중...'
    });

    useEffect(() => {
        const loadStatusInfo = async() => {
            try {
                const [statusColor, statusIcon, statusLabel] = await Promise.all([
                    getStatusColor(mapping.status, 'MAPPING_STATUS'),
                    getStatusIcon(mapping.status, 'MAPPING_STATUS'),
                    getMappingStatusKoreanName(mapping.status)
                ]);
                
                setStatusInfo({
                    color: statusColor,
                    icon: statusIcon,
                    label: statusLabel
                });
            } catch (error) {
                console.error('❌ 상태 정보 로드 실패:', error);
                setStatusInfo({
                    color: 'var(--color-gray)',
                    icon: '❓',
                    label: mapping.status || '알 수 없음'
                });
            }
        };

        loadStatusInfo();
    }, [mapping.status]);

    return(
        <div 
            className="mg-v2-card mg-v2-mapping-card"
            onClick={ onClick }
        >
            <div className="mg-v2-mapping-card-header">
                <div className="mg-v2-mapping-card-title-section">
                    <div className="mg-v2-client-avatar">
                        { mapping.clientName?.charAt(0) || '?' }
                    </div>
                    <div className="mg-v2-mapping-client-info">
                        <h5 className="mg-v2-client-name">
                            { mapping.clientName || '알 수 없음' }
                        </h5>
                        <span className="mg-v2-client-badge">
                            내담자
                        </span>
                    </div>
                </div>
                
                <div className="mg-v2-status-badge" style={{ background: statusInfo.color }}>
                    { statusInfo.icon } { statusInfo.label }
                </div>
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