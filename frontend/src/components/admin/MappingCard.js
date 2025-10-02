import React from 'react';
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
    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE': return 'success';
            case 'INACTIVE': return 'secondary';
            case 'PENDING': return 'warning';
            case 'EXPIRED': return 'danger';
            default: return 'secondary';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ACTIVE': return 'bi-check-circle-fill';
            case 'INACTIVE': return 'bi-pause-circle';
            case 'PENDING': return 'bi-clock';
            case 'EXPIRED': return 'bi-x-circle';
            default: return 'bi-question-circle';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ACTIVE': return '활성';
            case 'INACTIVE': return '비활성';
            case 'PENDING': return '대기';
            case 'EXPIRED': return '만료';
            default: return '알 수 없음';
        }
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
                
                <div className={`status-badge ${getStatusColor(mapping.status)}`}>
                    <i className={`bi ${getStatusIcon(mapping.status)}`}></i>
                    {getStatusLabel(mapping.status)}
                </div>
            </div>

            <div className="mapping-card-body">
                <div className="consultant-info">
                    <div className="info-row">
                        <span className="info-label">
                            <i className="bi bi-person"></i>
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
                            <i className="bi bi-box"></i>
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
