import React, { useState, useEffect } from 'react';
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
    const [statusInfo, setStatusInfo] = useState({
        color: 'var(--color-gray)',
        icon: '❓',
        label: '로딩 중...'
    });

    // 상태별 동적 처리 함수들 (비동기 처리)
    useEffect(() => {
        const loadStatusInfo = async () => {
            try {
                console.log('🔍 MappingCard 상태 로딩 시작:', mapping.status);
                
                const [statusColor, statusIcon, statusLabel] = await Promise.all([
                    getStatusColor(mapping.status, 'MAPPING_STATUS'),
                    getStatusIcon(mapping.status, 'MAPPING_STATUS'),
                    getMappingStatusKoreanName(mapping.status)
                ]);
                
                console.log('✅ MappingCard 상태 로딩 완료:', {
                    status: mapping.status,
                    color: statusColor,
                    icon: statusIcon,
                    label: statusLabel
                });
                
                setStatusInfo({
                    color: statusColor,
                    icon: statusIcon,
                    label: statusLabel
                });
            } catch (error) {
                console.error('❌ 상태 정보 로드 실패:', error);
                // 폴백 값 설정
                setStatusInfo({
                    color: 'var(--color-gray)',
                    icon: '❓',
                    label: mapping.status || '알 수 없음'
                });
            }
        };

        loadStatusInfo();
    }, [mapping.status]);

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
                        {statusInfo.icon}
                    </span>
                    {statusInfo.label}
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
