import React from 'react';
import { CheckCircle, PauseCircle, Clock, XCircle, User, Package, QuestionCircle } from 'lucide-react';
import { 
    getMappingStatusKoreanName,
    getStatusColor,
    getStatusIcon
} from '../../utils/codeHelper';
import './MappingCard.css';

/**
 * 매핑 카드 컴포넌트
 * - 매핑 정보를 표시하는 카드
 * - 아이폰 스타일과 글래스모피즘 효과 적용
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const MappingCard = ({ 
    mapping, 
    onClick,
    actions = null 
}) => {
    // 상태별 동적 처리 함수들 (하드코딩 제거)
    const getStatusInfo = (status) => {
        const statusColor = getStatusColor(status, 'MAPPING_STATUS');
        const statusIcon = getStatusIcon(status, 'MAPPING_STATUS');
        const statusLabel = getMappingStatusKoreanName(status);
        
        return {
            color: statusColor,
            icon: statusIcon,
            label: statusLabel
        };
    };

    return (
        <div 
            className="mapping-card"
            onClick={onClick}
        >
            <div className="mapping-card-header">
                <div className="client-info">
                    <div className="client-avatar">
                        {mapping.clientName?.charAt(0) || '?'}
                    </div>
                    <div className="client-details">
                        <h3 className="client-name">{mapping.clientName}</h3>
                        <p className="client-role">내담자</p>
                    </div>
                </div>
                
                <div className={`status-badge status-${mapping.status.toLowerCase()}`}>
                    <span className="status-icon">
                        {getStatusInfo(mapping.status).icon}
                    </span>
                    {getStatusInfo(mapping.status).label}
                </div>
            </div>

            <div className="mapping-card-body">
                <div className="consultant-info">
                    <div className="info-row">
                        <span className="info-label">
                            <User size={16} />
                            상담사
                        </span>
                        <span className="info-value">{mapping.consultantName}</span>
                    </div>
                </div>

                <div className="session-info">
                    <div className="session-stats">
                        <div className="stat-item">
                            <span className="stat-label">총 회기</span>
                            <span className="stat-value total">{mapping.totalSessions}회</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">사용</span>
                            <span className="stat-value used">{mapping.usedSessions}회</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">남은</span>
                            <span className="stat-value remaining">{mapping.remainingSessions}회</span>
                        </div>
                    </div>
                </div>

                <div className="package-info">
                    <div className="info-row">
                        <span className="info-label">
                            <Package size={16} />
                            패키지
                        </span>
                        <span className="info-value">{mapping.packageName}</span>
                    </div>
                </div>
            </div>

            {actions && (
                <div className="mapping-card-actions">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default MappingCard;
