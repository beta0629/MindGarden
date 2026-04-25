import React from 'react';
import { User, Calendar, Clock, TrendingUp, MessageCircle, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import Avatar from '../../common/Avatar';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';

/**
 * 공통 내담자 카드 컴포넌트
 * - 디자인 시스템 v2.0 적용, 글라스모피즘, 반응형, 선택 상태 관리, 진행률 표시
 *
 * @author Core Solution
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
    className = '',
    /**
     * B0KlA 내담자 선택(스펙 §4~§8): 단일 CTA, 메시지/전화 보조 버튼 숨김.
     * §8 탭 순서: 카드 루트는 포커스 불가(중복 탭스톱 방지) — 「선택하기」만 키보드 포커스·aria-label.
     */
    scheduleClientSelectMode = false,
    /** B0KlA: 매핑/세션 없을 때 CTA 비활성 */
    selectDisabled = false
}) => {
/**
     * 상태에 따른 클래스명 반환
     */
    const getStatusClass = () => {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        if (client.status === 'ACTIVE' || client.status === '진행중') return 'active';
        if (client.status === 'SCHEDULED' || client.status === '예약됨') return 'scheduled';
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
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
        if (client.progressPercentage !== undefined && client.progressPercentage !== null) {
            return Math.round(toSafeNumber(client.progressPercentage, 0));
        }
        const total = toSafeNumber(client.totalSessions, toSafeNumber(client.totalConsultations, 0));
        const completed = toSafeNumber(
            client.completedSessions,
            toSafeNumber(client.completedConsultations, 0)
        );
        if (total > 0) {
            return Math.round((completed / total) * 100);
        }
        return 0;
    };

/**
     * 세션 정보 반환
     */
    const getSessionInfo = () => {
        const total = toSafeNumber(client.totalSessions, toSafeNumber(client.totalConsultations, 0));
        const completed = toSafeNumber(
            client.completedSessions,
            toSafeNumber(client.completedConsultations, 0)
        );
        return { total, completed };
    };

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
            aria-label={`${toDisplayString(client.name, '내담자')} 내담자 선택`}
        >
            <Avatar
                profileImageUrl={client.profileImageUrl}
                displayName={toDisplayString(client.name, '내담자')}
                className="mg-client-card__avatar"
            />
            <div className="mg-client-card__info">
                <div className="mg-client-card__header">
                    <SafeText tag="h4" className="mg-client-card__name">{client.name}</SafeText>
                    <div className={`mg-client-card__status mg-client-card__status--${getStatusClass()}`}>
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

    const renderDetailedCard = () => {
        const scheduleSelect = scheduleClientSelectMode;
        const progressPct = getProgressPercentage();
        const sessionInfo = getSessionInfo();
        const displayName = toDisplayString(client.name, '내담자');
        const lastConsultLabel = toDisplayString(client.lastConsultationDate, '없음');
        const rootClass = [
            'mg-client-card',
            'mg-client-card--detailed',
            scheduleSelect ? 'mg-client-card--b0kla-select' : '',
            selected ? 'mg-client-card--selected' : '',
            className
        ].filter(Boolean).join(' ');

        const keyboardActivation = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
            }
        };

        const rootCommon = {
            className: rootClass,
            draggable,
            onClick: scheduleSelect
                ? (selectDisabled ? undefined : handleClick)
                : handleClick
        };

        const rootA11y = scheduleSelect
            ? {}
            : {
                role: 'button',
                tabIndex: 0,
                onKeyDown: keyboardActivation,
                'aria-label': `${displayName} 내담자 선택`
            };

        return (
            <div {...rootCommon} {...rootA11y}>
                <div className={`mg-client-card__status-badge mg-client-card__status-badge--${getStatusClass()}`}>
                    <span aria-hidden="true">{getStatusIcon()}</span>
                    <span>{getStatusText()}</span>
                </div>

                <Avatar
                    profileImageUrl={client.profileImageUrl}
                    displayName={displayName}
                    className="mg-client-card__avatar mg-client-card__avatar--large"
                />

                <div className="mg-client-card__info">
                    <SafeText tag="h4" className="mg-client-card__name mg-client-card__name--large">{client.name}</SafeText>

                    <div className="mg-client-card__details">
                        <div className="mg-client-card__detail-item">
                            <Calendar size={16} aria-hidden="true" />
                            <span>{`최근 상담: ${lastConsultLabel}`}</span>
                        </div>

                        <div className="mg-client-card__detail-item">
                            <TrendingUp size={16} aria-hidden="true" />
                            <span>총 {sessionInfo.total}회 진행</span>
                        </div>

                        {client.nextConsultationDate && (
                            <div className="mg-client-card__detail-item">
                                <Clock size={16} aria-hidden="true" />
                                <span>
                                    다음 상담:{' '}
                                    <SafeText>{client.nextConsultationDate}</SafeText>
                                </span>
                            </div>
                        )}
                    </div>

                    {showProgress && (
                        <div className="mg-client-card__progress-section">
                            <div className="mg-client-card__progress-header">
                                <span>진행률</span>
                                <span className="mg-client-card__progress-value">{progressPct}%</span>
                            </div>
                            <div className="mg-progress-bar">
                                <div className="mg-progress-fill" style={{ '--progress': `${progressPct}%` }} />
                            </div>
                        </div>
                    )}

                    {client.consultantName && (
                        <div className="mg-client-card__consultant-info">
                            <div className="mg-client-card__consultant-label">담당 상담사</div>
                            <SafeText tag="div" className="mg-client-card__consultant-name">{client.consultantName}</SafeText>
                        </div>
                    )}

                    {showActions && (
                        <div className="mg-client-card__actions">
                            <MGButton
                                className={buildErpMgButtonClassName({
                                    variant: 'primary',
                                    size: 'sm',
                                    loading: false,
                                    className: scheduleSelect
                                        ? 'mg-button mg-button-primary mg-button-sm mg-client-card__select-cta'
                                        : 'mg-button mg-button-primary mg-button-sm'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                disabled={scheduleSelect && selectDisabled}
                                aria-label={scheduleSelect ? `${displayName} 선택` : undefined}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClick();
                                }}
                                variant="primary"
                                size="small"
                                preventDoubleClick={false}
                            >
                                {selected ? '선택됨' : '선택하기'}
                            </MGButton>

                            {!scheduleSelect && (
                                <>
                                    <MGButton
                                        className={buildErpMgButtonClassName({
                                            variant: 'outline',
                                            size: 'sm',
                                            loading: false,
                                            className: 'mg-button mg-button-outline mg-button-sm'
                                        })}
                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                        variant="outline"
                                        size="small"
                                        preventDoubleClick={false}
                                    >
                                        <MessageCircle size={16} aria-hidden="true" />
                                    </MGButton>

                                    <MGButton
                                        className={buildErpMgButtonClassName({
                                            variant: 'outline',
                                            size: 'sm',
                                            loading: false,
                                            className: 'mg-button mg-button-ghost mg-button-sm'
                                        })}
                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                        variant="outline"
                                        size="small"
                                        preventDoubleClick={false}
                                    >
                                        <Phone size={16} aria-hidden="true" />
                                    </MGButton>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

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
            aria-label={`${toDisplayString(client.name, '내담자')} 내담자 선택`}
        >
            <div className="mg-client-card__header-mobile">
                <Avatar
                    profileImageUrl={client.profileImageUrl}
                    displayName={toDisplayString(client.name, '내담자')}
                    className="mg-client-card__avatar mg-client-card__avatar--mobile"
                />
                <div className={`mg-client-card__status mg-client-card__status--${getStatusClass()}`}>
                    {getStatusIcon()}
                    <span>{getStatusText()}</span>
                </div>
            </div>
            
            <div className="mg-client-card__content-mobile">
                <SafeText tag="h4" className="mg-client-card__name mg-client-card__name--mobile">{client.name}</SafeText>
                
                <div className="mg-client-card__info-mobile">
                    <div className="mg-client-card__info-row">
                        <Calendar size={14} />
                        <span>최근: <SafeText>{client.lastConsultationDate || '없음'}</SafeText></span>
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
                            <div className="mg-progress-fill" style={{ '--progress': `${getProgressPercentage()}%` }} />
                        </div>
                    </div>
                )}
                
                {client.consultantName && (
                    <div className="mg-client-card__consultant-mobile">
                        <span className="mg-client-card__consultant-label-mobile">담당:</span>
                        <SafeText tag="span" className="mg-client-card__consultant-name-mobile">{client.consultantName}</SafeText>
                    </div>
                )}
                
                {showActions && (
                    <div className="mg-client-card__actions mg-client-card__actions--mobile">
                        <MGButton
                            className={buildErpMgButtonClassName({
                              variant: 'primary',
                              size: 'sm',
                              loading: false,
                              className: 'mg-button mg-button-primary mg-button-sm mg-v2-flex-1'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClick();
                            }}
                            variant="primary"
                            size="small"
                            preventDoubleClick={false}
                        >
                            {selected ? '선택됨' : '선택하기'}
                        </MGButton>
                        <MGButton
                            className={buildErpMgButtonClassName({
                              variant: 'outline',
                              size: 'sm',
                              loading: false,
                              className: 'mg-button mg-button-outline mg-button-sm'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            variant="outline"
                            size="small"
                            preventDoubleClick={false}
                        >
                            <MessageCircle size={16} />
                        </MGButton>
                    </div>
                )}
            </div>
        </div>
    );

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
            aria-label={`${toDisplayString(client.name, '내담자')} 내담자 선택`}
        >
            <Avatar
                profileImageUrl={client.profileImageUrl}
                displayName={toDisplayString(client.name, '내담자')}
                className="mg-client-card__avatar mg-client-card__avatar--mobile-simple"
            />
            
            <div className="mg-client-card__info mg-client-card__info--mobile-simple">
                <SafeText tag="h4" className="mg-client-card__name mg-client-card__name--mobile-simple">{client.name}</SafeText>
                
                <div className="mg-client-card__meta mg-client-card__meta--mobile-simple">
                    <div className="mg-client-card__progress mg-client-card__progress--mobile-simple">
                        <span>{getProgressPercentage()}% 진행</span>
                    </div>
                    <span>{getSessionInfo().total}회 상담</span>
                </div>
            </div>
            
            <div className={`mg-client-card__status mg-client-card__status--mobile-simple mg-client-card__status--${getStatusClass()}`}>
                <span>{getStatusText()}</span>
            </div>
        </div>
    );

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
