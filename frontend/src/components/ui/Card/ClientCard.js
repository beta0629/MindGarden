import React from 'react';
import { User, Calendar, Clock, TrendingUp, MessageCircle, Phone, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * 공통 내담자 카드 컴포넌트
 * - 디자인 시스템 v2.0 적용
 * - 글라스모피즘 효과
 * - 반응형 지원
 * - 선택 상태 관리
 * - 진행률 표시
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-10-15
 */
const ClientCard = ({ 
    client, 
    onClick, 
    selected = false,
    draggable = false,
    variant = 'detailed', // 'compact', 'detailed', 'mobile', 'mobile-simple'
    showActions = true,
    showProgress = true,
    className = ''
}) => {
    /**
     * 상태에 따른 클래스명 반환
     */
    const getStatusClass = () => {
        if (client.status === 'ACTIVE' || client.status === '진행중') return 'active';
        if (client.status === 'SCHEDULED' || client.status === '예약됨') return 'scheduled';
        if (client.status === 'COMPLETED' || client.status === '완료') return 'completed';
        if (client.status === 'PAUSED' || client.status === '일시정지') return 'paused';
        return 'default';
    };

    /**
     * 상태에 따른 텍스트 반환
     */
    const getStatusText = () => {
        const statusClass = getStatusClass();
        switch (statusClass) {
            case 'active': return '진행중';
            case 'scheduled': return '예약됨';
            case 'completed': return '완료';
            case 'paused': return '일시정지';
            default: return '대기중';
        }
    };

    /**
     * 상태에 따른 아이콘 반환
     */
    const getStatusIcon = () => {
        const statusClass = getStatusClass();
        switch (statusClass) {
            case 'active': return <TrendingUp size={12} />;
            case 'scheduled': return <Calendar size={12} />;
            case 'completed': return <CheckCircle size={12} />;
            case 'paused': return <AlertCircle size={12} />;
            default: return <Clock size={12} />;
        }
    };

    /**
     * 이니셜 반환
     */
    const getInitial = () => {
        if (client.name) {
            return client.name.charAt(0);
        }
        return '?';
    };

    /**
     * 클릭 핸들러
     */
    const handleClick = () => {
        if (onClick) {
            onClick(client);
        }
    };

    /**
     * 진행률 계산
     */
    const getProgressPercentage = () => {
        if (client.progressPercentage !== undefined) {
            return client.progressPercentage;
        }
        if (client.totalSessions && client.completedSessions !== undefined) {
            return Math.round((client.completedSessions / client.totalSessions) * 100);
        }
        return 0;
    };

    /**
     * 세션 정보 반환
     */
    const getSessionInfo = () => {
        const total = client.totalSessions || client.totalConsultations || 0;
        const completed = client.completedSessions || client.completedConsultations || 0;
        return { total, completed };
    };

    // 컴팩트 카드 렌더링
    const renderCompactCard = () => (
        <div
            className={`mg-client-card mg-client-card--compact ${selected ? 'mg-client-card--selected' : ''} ${className}`}
            onClick={handleClick}
            draggable={draggable}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            aria-label={`${client.name} 내담자 선택`}
        >
            <div className="mg-client-card__avatar">
                {getInitial()}
            </div>
            <div className="mg-client-card__info">
                <div className="mg-client-card__header">
                    <h4 className="mg-client-card__name">{client.name}</h4>
                    <div className="mg-client-card__status" style={{ backgroundColor: getStatusClass() === 'active' ? '#10b981' : getStatusClass() === 'scheduled' ? '#3b82f6' : getStatusClass() === 'completed' ? '#6b7280' : '#f59e0b' }}>
                        {getStatusIcon()}
                        <span>{getStatusText()}</span>
                    </div>
                </div>
                <div className="mg-client-card__meta">
                    <div className="mg-client-card__sessions">
                        총 {getSessionInfo().total}회 상담
                    </div>
                    {showProgress && (
                        <div className="mg-client-card__progress">
                            {getProgressPercentage()}% 완료
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // 상세 카드 렌더링
    const renderDetailedCard = () => (
        <div
            className={`mg-client-card mg-client-card--detailed ${selected ? 'mg-client-card--selected' : ''} ${className}`}
            onClick={handleClick}
            draggable={draggable}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            aria-label={`${client.name} 내담자 선택`}
        >
            {/* 상태 배지 */}
            <div className="mg-client-card__status-badge" style={{ backgroundColor: getStatusClass() === 'active' ? '#10b981' : getStatusClass() === 'scheduled' ? '#3b82f6' : getStatusClass() === 'completed' ? '#6b7280' : '#f59e0b' }}>
                {getStatusIcon()}
                <span>{getStatusText()}</span>
            </div>

            {/* 내담자 아바타 */}
            <div className="mg-client-card__avatar mg-client-card__avatar--large">
                {getInitial()}
            </div>

            {/* 내담자 정보 */}
            <div className="mg-client-card__info">
                <h4 className="mg-client-card__name mg-client-card__name--large">{client.name}</h4>
                
                <div className="mg-client-card__details">
                    <div className="mg-client-card__detail-item">
                        <Calendar size={16} />
                        <span>최근 상담: {client.lastConsultationDate || '없음'}</span>
                    </div>
                    
                    <div className="mg-client-card__detail-item">
                        <TrendingUp size={16} />
                        <span>총 {getSessionInfo().total}회 진행</span>
                    </div>
                    
                    {client.nextConsultationDate && (
                        <div className="mg-client-card__detail-item">
                            <Clock size={16} />
                            <span>다음 상담: {client.nextConsultationDate}</span>
                        </div>
                    )}
                </div>
                
                {/* 진행률 섹션 */}
                {showProgress && (
                    <div className="mg-client-card__progress-section">
                        <div className="mg-client-card__progress-header">
                            <span>진행률</span>
                            <span className="mg-client-card__progress-value">{getProgressPercentage()}%</span>
                        </div>
                        <div className="mg-progress-bar">
                            <div className="mg-progress-fill" style={{ width: `${getProgressPercentage()}%` }}></div>
                        </div>
                    </div>
                )}
                
                {/* 상담사 정보 */}
                {client.consultantName && (
                    <div className="mg-client-card__consultant-info">
                        <div className="mg-client-card__consultant-label">담당 상담사</div>
                        <div className="mg-client-card__consultant-name">{client.consultantName}</div>
                    </div>
                )}
                
                {/* 액션 버튼들 */}
                {showActions && (
                    <div className="mg-client-card__actions">
                        <button 
                            className="mg-button mg-button-primary mg-button-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClick();
                            }}
                        >
                            {selected ? '선택됨' : '선택하기'}
                        </button>
                        
                        <button 
                            className="mg-button mg-button-outline mg-button-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                // 내담자 상세 정보 모달 열기
                            }}
                        >
                            <MessageCircle size={16} />
                        </button>
                        
                        <button 
                            className="mg-button mg-button-ghost mg-button-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                // 전화 걸기
                            }}
                        >
                            <Phone size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    // 모바일 카드 렌더링
    const renderMobileCard = () => (
        <div
            className={`mg-client-card mg-client-card--mobile ${selected ? 'mg-client-card--selected' : ''} ${className}`}
            onClick={handleClick}
            draggable={draggable}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            aria-label={`${client.name} 내담자 선택`}
        >
            <div className="mg-client-card__header-mobile">
                <div className="mg-client-card__avatar mg-client-card__avatar--mobile">
                    {getInitial()}
                </div>
                <div className="mg-client-card__status" style={{ backgroundColor: getStatusClass() === 'active' ? '#10b981' : getStatusClass() === 'scheduled' ? '#3b82f6' : getStatusClass() === 'completed' ? '#6b7280' : '#f59e0b' }}>
                    {getStatusIcon()}
                    <span>{getStatusText()}</span>
                </div>
            </div>
            
            <div className="mg-client-card__content-mobile">
                <h4 className="mg-client-card__name mg-client-card__name--mobile">{client.name}</h4>
                
                <div className="mg-client-card__info-mobile">
                    <div className="mg-client-card__info-row">
                        <Calendar size={14} />
                        <span>최근: {client.lastConsultationDate || '없음'}</span>
                    </div>
                    <div className="mg-client-card__info-row">
                        <TrendingUp size={14} />
                        <span>총 {getSessionInfo().total}회</span>
                    </div>
                </div>
                
                {showProgress && (
                    <div className="mg-client-card__progress-mobile">
                        <div className="mg-client-card__progress-header-mobile">
                            <span>진행률</span>
                            <span className="mg-client-card__progress-value-mobile">{getProgressPercentage()}%</span>
                        </div>
                        <div className="mg-progress-bar mg-progress-bar--mobile">
                            <div className="mg-progress-fill" style={{ width: `${getProgressPercentage()}%` }}></div>
                        </div>
                    </div>
                )}
                
                {client.consultantName && (
                    <div className="mg-client-card__consultant-mobile">
                        <span className="mg-client-card__consultant-label-mobile">담당:</span>
                        <span className="mg-client-card__consultant-name-mobile">{client.consultantName}</span>
                    </div>
                )}
                
                {showActions && (
                    <div className="mg-client-card__actions mg-client-card__actions--mobile">
                        <button 
                            className="mg-button mg-button-primary mg-button-sm" 
                            style={{ flex: 1 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClick();
                            }}
                        >
                            {selected ? '선택됨' : '선택하기'}
                        </button>
                        <button 
                            className="mg-button mg-button-outline mg-button-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                // 내담자 상세 정보 모달 열기
                            }}
                        >
                            <MessageCircle size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    // 모바일 간단 카드 렌더링 (스케줄 모달용)
    const renderMobileSimpleCard = () => (
        <div
            className={`mg-client-card mg-client-card--mobile-simple ${selected ? 'mg-client-card--selected' : ''} ${getStatusClass() === 'unavailable' ? 'mg-client-card--unavailable' : ''} ${className}`}
            onClick={handleClick}
            draggable={draggable}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            aria-label={`${client.name} 내담자 선택`}
        >
            <div className="mg-client-card__avatar mg-client-card__avatar--mobile-simple">
                {getInitial()}
            </div>
            
            <div className="mg-client-card__info mg-client-card__info--mobile-simple">
                <h4 className="mg-client-card__name mg-client-card__name--mobile-simple">{client.name}</h4>
                
                <div className="mg-client-card__meta mg-client-card__meta--mobile-simple">
                    <div className="mg-client-card__progress mg-client-card__progress--mobile-simple">
                        <span>{getProgressPercentage()}% 진행</span>
                    </div>
                    <span>{getSessionInfo().total}회 상담</span>
                </div>
            </div>
            
            <div className="mg-client-card__status mg-client-card__status--mobile-simple" style={{ backgroundColor: getStatusColor() }}>
                <span>{getStatusText()}</span>
            </div>
        </div>
    );

    // 변형에 따른 렌더링
    switch (variant) {
        case 'compact':
            return renderCompactCard();
        case 'mobile':
            return renderMobileCard();
        case 'mobile-simple':
            return renderMobileSimpleCard();
        case 'detailed':
        default:
            return renderDetailedCard();
    }
};

export default ClientCard;
