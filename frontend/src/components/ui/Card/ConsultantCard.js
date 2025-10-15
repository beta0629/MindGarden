import React from 'react';
import { User, Star, Clock, Phone, Mail, MessageCircle, Calendar, Award, TrendingUp } from 'lucide-react';
import SpecialtyDisplay from '../SpecialtyDisplay';

/**
 * 공통 상담사 카드 컴포넌트
 * - 디자인 시스템 v2.0 적용
 * - 글라스모피즘 효과
 * - 반응형 지원
 * - 선택 상태 관리
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-10-15
 */
const ConsultantCard = ({ 
    consultant, 
    onClick, 
    selected = false,
    draggable = false,
    variant = 'detailed', // 'compact', 'detailed', 'mobile', 'mobile-simple'
    showActions = true,
    className = ''
}) => {
    /**
     * 가용성 상태에 따른 클래스명 반환
     */
    const getAvailabilityClass = () => {
        // 종일 휴가인 경우만 선택 불가능
        const isFullDayVacation = consultant.isOnVacation && 
            (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY');
        
        if (isFullDayVacation) return 'unavailable';
        if (!consultant.available) return 'unavailable';
        if (consultant.busy) return 'busy';
        return 'available';
    };

    /**
     * 가용성 상태에 따른 텍스트 반환
     */
    const getAvailabilityText = () => {
        const availabilityClass = getAvailabilityClass();
        switch (availabilityClass) {
            case 'available': return '상담 가능';
            case 'busy': return '상담 중';
            case 'unavailable': return '휴무';
            default: return '알 수 없음';
        }
    };


    /**
     * 이니셜 반환
     */
    const getInitial = () => {
        if (consultant.name) {
            return consultant.name.charAt(0);
        }
        return '?';
    };

    /**
     * 클릭 핸들러
     */
    const handleClick = () => {
        if (onClick) {
            onClick(consultant);
        }
    };

    /**
     * 가용성 정보 반환
     */
    const getAvailabilityInfo = () => {
        if (!consultant.availableSlots || consultant.availableSlots.length === 0) {
            return [];
        }
        return consultant.availableSlots.slice(0, 3);
    };

    // 컴팩트 카드 렌더링
    const renderCompactCard = () => (
        <div
            className={`mg-consultant-card mg-consultant-card--compact ${selected ? 'mg-consultant-card--selected' : ''} ${!consultant.available || (consultant.isOnVacation && (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY')) ? 'mg-consultant-card--unavailable' : ''} ${className}`}
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
            aria-label={`${consultant.name} 상담사 선택`}
        >
            <div className="mg-consultant-card__avatar">
                {getInitial()}
            </div>
            <div className="mg-consultant-card__info">
                <div className="mg-consultant-card__header">
                    <h4 className="mg-consultant-card__name">{consultant.name}</h4>
                    <div className="mg-consultant-card__status" style={{ backgroundColor: getAvailabilityClass() === 'available' ? '#10b981' : getAvailabilityClass() === 'busy' ? '#f59e0b' : '#ef4444' }}>
                        <span>{getAvailabilityText()}</span>
                    </div>
                </div>
                <div className="mg-consultant-card__meta">
                    <div className="mg-consultant-card__rating">
                        <Star size={12} />
                        <span>4.8</span>
                    </div>
                    <div className="mg-consultant-card__slots">
                        {consultant.availableSlots || 0}개 슬롯
                    </div>
                </div>
            </div>
        </div>
    );

    // 상세 카드 렌더링
    const renderDetailedCard = () => (
        <div
            className={`mg-consultant-card mg-consultant-card--detailed ${selected ? 'mg-consultant-card--selected' : ''} ${!consultant.available || (consultant.isOnVacation && (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY')) ? 'mg-consultant-card--unavailable' : ''} ${className}`}
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
            aria-label={`${consultant.name} 상담사 선택`}
        >
            {/* 상태 배지 */}
            <div className="mg-consultant-card__status-badge" style={{ backgroundColor: getAvailabilityClass() === 'available' ? '#10b981' : getAvailabilityClass() === 'busy' ? '#f59e0b' : '#ef4444' }}>
                <span>{getAvailabilityText()}</span>
            </div>

            {/* 상담사 아바타 */}
            <div className="mg-consultant-card__avatar mg-consultant-card__avatar--large">
                {getInitial()}
            </div>

            {/* 상담사 정보 */}
            <div className="mg-consultant-card__info">
                <h4 className="mg-consultant-card__name mg-consultant-card__name--large">{consultant.name}</h4>
                
                {/* 평점 섹션 */}
                <div className="mg-consultant-card__rating-section">
                    <div className="mg-consultant-card__rating">
                        <Star size={16} />
                        <span className="mg-consultant-card__rating-value">4.8</span>
                        <span className="mg-consultant-card__rating-text">(45명)</span>
                    </div>
                    <div className="mg-consultant-card__experience">
                        <Award size={16} />
                        <span>{consultant.experience || '3년'} 경력</span>
                    </div>
                </div>
                
                <div className="mg-consultant-card__details">
                    <div className="mg-consultant-card__detail-item">
                        <Mail size={16} />
                        <span>{consultant.email || '이메일 없음'}</span>
                    </div>
                    
                    <div className="mg-consultant-card__detail-item">
                        <Phone size={16} />
                        <span>{consultant.phone || '전화번호 없음'}</span>
                    </div>
                    
                    <div className="mg-consultant-card__detail-item">
                        <User size={16} />
                        <span>{consultant.currentClients || 0}명 상담 중</span>
                    </div>
                </div>
                
                {/* 전문 분야 */}
                <SpecialtyDisplay 
                    consultant={consultant} 
                    variant="tag" 
                    showTitle={true}
                    maxItems={1}
                    debug={true}
                />
                
                {/* 상담 가능 시간 정보 */}
                {getAvailabilityInfo().length > 0 && (
                    <div className="mg-consultant-card__availability">
                        <div className="mg-consultant-card__availability-title">
                            <Clock size={16} />
                            상담 가능 시간
                        </div>
                        <div className="mg-consultant-card__availability-times">
                            {getAvailabilityInfo().map((info, index) => (
                                <div key={index} className="mg-consultant-card__availability-time">
                                    {info}
                                </div>
                            ))}
                            {(consultant.availableSlots || []).length > 3 && (
                                <div className="mg-consultant-card__availability-more">
                                    +{(consultant.availableSlots || []).length - 3}개 더
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* 액션 버튼들 */}
                {showActions && (
                    <div className="mg-consultant-card__actions">
                        <button 
                            className="mg-button mg-button-primary mg-button-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClick();
                            }}
                            disabled={!consultant.available || (consultant.isOnVacation && (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY'))}
                        >
                            {selected ? '선택됨' : '선택하기'}
                        </button>
                        
                        <button 
                            className="mg-button mg-button-outline mg-button-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                // 상담사 상세 정보 모달 열기
                            }}
                        >
                            상세보기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    // 모바일 카드 렌더링
    const renderMobileCard = () => (
        <div
            className={`mg-consultant-card mg-consultant-card--mobile ${selected ? 'mg-consultant-card--selected' : ''} ${!consultant.available || (consultant.isOnVacation && (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY')) ? 'mg-consultant-card--unavailable' : ''} ${className}`}
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
            aria-label={`${consultant.name} 상담사 선택`}
        >
            <div className="mg-consultant-card__header-mobile">
                <div className="mg-consultant-card__avatar mg-consultant-card__avatar--mobile">
                    {getInitial()}
                </div>
                <div className="mg-consultant-card__status" style={{ backgroundColor: getAvailabilityClass() === 'available' ? '#10b981' : getAvailabilityClass() === 'busy' ? '#f59e0b' : '#ef4444' }}>
                    <span>{getAvailabilityText()}</span>
                </div>
            </div>
            
            <div className="mg-consultant-card__content-mobile">
                <h4 className="mg-consultant-card__name mg-consultant-card__name--mobile">{consultant.name}</h4>
                
                <div className="mg-consultant-card__rating-mobile">
                    <div className="mg-consultant-card__rating-item">
                        <Star size={14} />
                        <span>4.8</span>
                    </div>
                    <div className="mg-consultant-card__rating-item">
                        <TrendingUp size={14} />
                        <span>{consultant.availableSlots || 0}개</span>
                    </div>
                </div>
                
                <div className="mg-consultant-card__info-mobile">
                    <div className="mg-consultant-card__info-row">
                        <Mail size={14} />
                        <span>{consultant.email || '이메일 없음'}</span>
                    </div>
                    <div className="mg-consultant-card__info-row">
                        <Phone size={14} />
                        <span>{consultant.phone || '전화번호 없음'}</span>
                    </div>
                </div>
                
                <div className="mg-consultant-card__specialties-mobile">
                    <div className="mg-consultant-card__specialties-title-mobile">전문 분야</div>
                    <div className="mg-consultant-card__specialties-list-mobile">
                        <SpecialtyDisplay
                            consultant={consultant}
                            variant="tag"
                            showTitle={false}
                            maxItems={3}
                            debug={false}
                        />
                    </div>
                </div>
                
                <div className="mg-consultant-card__stats-mobile">
                    <div className="mg-consultant-card__stat">
                        <span className="mg-consultant-card__stat-label">상담 횟수</span>
                        <span className="mg-consultant-card__stat-value">{consultant.totalConsultations || 0}회</span>
                    </div>
                    <div className="mg-consultant-card__stat">
                        <span className="mg-consultant-card__stat-label">현재 상담</span>
                        <span className="mg-consultant-card__stat-value">{consultant.currentClients || 0}명</span>
                    </div>
                </div>
                
                {showActions && (
                    <div className="mg-consultant-card__actions mg-consultant-card__actions--mobile">
                        <button 
                            className="mg-button mg-button-primary mg-button-sm" 
                            style={{ flex: 1 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClick();
                            }}
                            disabled={!consultant.available || (consultant.isOnVacation && (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY'))}
                        >
                            {selected ? '선택됨' : '선택하기'}
                        </button>
                        <button 
                            className="mg-button mg-button-outline mg-button-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                // 상담사 상세 정보 모달 열기
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
            className={`mg-consultant-card mg-consultant-card--mobile-simple ${selected ? 'mg-consultant-card--selected' : ''} ${!consultant.available || (consultant.isOnVacation && (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY')) ? 'mg-consultant-card--unavailable' : ''} ${className}`}
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
            aria-label={`${consultant.name} 상담사 선택`}
        >
            <div className="mg-consultant-card__avatar mg-consultant-card__avatar--mobile-simple">
                {getInitial()}
            </div>
            
            <div className="mg-consultant-card__info mg-consultant-card__info--mobile-simple">
                <h4 className="mg-consultant-card__name mg-consultant-card__name--mobile-simple">{consultant.name}</h4>
                
                <div className="mg-consultant-card__meta mg-consultant-card__meta--mobile-simple">
                    <div className="mg-consultant-card__rating mg-consultant-card__rating--mobile-simple">
                        <Star size={12} />
                        <span>4.8</span>
                    </div>
                    <span>{consultant.experience || '3년'}</span>
                    <span>{consultant.availableSlots || 0}개 가능</span>
                </div>
            </div>
            
            <div className="mg-consultant-card__status mg-consultant-card__status--mobile-simple" style={{ backgroundColor: getAvailabilityClass() === 'available' ? '#10b981' : getAvailabilityClass() === 'busy' ? '#f59e0b' : '#ef4444' }}>
                <TrendingUp size={12} />
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

export default ConsultantCard;
