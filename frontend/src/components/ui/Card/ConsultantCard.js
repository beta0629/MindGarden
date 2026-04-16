import React, { useState } from 'react';
import { User, Star, Clock, Phone, Mail, MessageCircle, Calendar, Award, TrendingUp } from 'lucide-react';
import SpecialtyDisplay from '../SpecialtyDisplay';
import ConsultantDetailModal from '../ConsultantDetailModal';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Avatar from '../../common/Avatar';
import { getConsultantRatingInfo } from '../../../utils/ratingHelper';
import { getFormattedCurrentClients, getFormattedExperience } from '../../../utils/codeHelper';
import { formatCurrency } from '../../../utils/formatUtils';
import { toDisplayString } from '../../../utils/safeDisplay';

/**
 * 공통 상담사 카드 컴포넌트
 * - 디자인 시스템 v2.0 적용, 글라스모피즘, 반응형, 선택 상태 관리
 *
 * @author Core Solution
 * @version 2.0.0
 * @since 2025-10-15
 */
const ConsultantCard = ({
    consultant,
    onClick,
    selected = false,
    draggable = false,
    variant = 'detailed', // 'compact', 'detailed', 'mobile', 'mobile-simple', 'schedule-select', 'salary-profile'
    showActions = true,
    className = '',
    // salary-profile 전용
    grade,
    baseSalary = null,
    formattedBaseSalary,
    renderActions,
    onCardClick,
    compact: salaryProfileCompact = false,
    nameId
}) => {
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // 평점 정보 계산
    const ratingInfo = getConsultantRatingInfo(consultant);
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
     * 가용성 상태에 따른 색상 반환 (CSS 변수 사용)
     */
    const getAvailabilityColor = () => {
        const availabilityClass = getAvailabilityClass();
        switch (availabilityClass) {
            case 'available': return 'var(--color-success)';
            case 'busy': return 'var(--color-warning)';
            case 'unavailable': return 'var(--color-danger)';
            default: return 'var(--color-gray)';
        }
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
            aria-label={`${toDisplayString(consultant.name)} 상담사 선택`}
        >
            <Avatar
                profileImageUrl={consultant.profileImageUrl}
                displayName={toDisplayString(consultant.name)}
                className="mg-consultant-card__avatar"
            />
            <div className="mg-consultant-card__info">
                <div className="mg-consultant-card__header">
                    <h4 className="mg-consultant-card__name">{toDisplayString(consultant.name)}</h4>
                    <div className="mg-consultant-card__status" style={{ '--availability-color': getAvailabilityColor() }}>
                        <span>{getAvailabilityText()}</span>
                    </div>
                </div>
                <div className="mg-consultant-card__meta">
                    <div className="mg-consultant-card__rating">
                        <Star size={12} />
                        <span>{ratingInfo.formattedRating}</span>
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
            aria-label={`${toDisplayString(consultant.name)} 상담사 선택`}
        >
            {/* 상태 배지 */}
            <div className="mg-consultant-card__status-badge" style={{ '--availability-color': getAvailabilityColor() }}>
                <span>{getAvailabilityText()}</span>
            </div>

            {/* 상담사 아바타 */}
            <Avatar
                profileImageUrl={consultant.profileImageUrl}
                displayName={toDisplayString(consultant.name)}
                className="mg-consultant-card__avatar mg-consultant-card__avatar--large"
            />

            {/* 상담사 정보 */}
            <div className="mg-consultant-card__info">
                <h4 className="mg-consultant-card__name mg-consultant-card__name--large">{toDisplayString(consultant.name)}</h4>
                
                {/* 평점 섹션 */}
                <div className="mg-consultant-card__rating-section">
                    <div className="mg-consultant-card__rating">
                        <Star size={16} />
                        <span className="mg-consultant-card__rating-value">
                            {ratingInfo.formattedRating}
                        </span>
                        <span className="mg-consultant-card__rating-text">
                            ({ratingInfo.formattedReviewCount})
                        </span>
                    </div>
                    <div className="mg-consultant-card__experience">
                        <Award size={16} />
                    <span>{getFormattedExperience(consultant)} 경력</span>
                    </div>
                </div>
                
                <div className="mg-consultant-card__details">
                    <div className="mg-consultant-card__detail-item">
                        <Mail size={16} />
                        <span>{toDisplayString(consultant.email, '이메일 없음')}</span>
                    </div>
                    
                    <div className="mg-consultant-card__detail-item">
                        <Phone size={16} />
                        <span>{toDisplayString(consultant.phone, '전화번호 없음')}</span>
                    </div>
                    
                    <div className="mg-consultant-card__detail-item">
                        <User size={16} />
                        <span>{getFormattedCurrentClients(consultant)} 상담 중</span>
                    </div>
                </div>
                
                {/* 전문 분야 */}
                <SpecialtyDisplay 
                    consultant={consultant} 
                    variant="tag" 
                    showTitle={true}
                    maxItems={10}
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
                        <MGButton
                            className={buildErpMgButtonClassName({
                              variant: 'primary',
                              size: 'sm',
                              loading: false,
                              className: 'mg-button mg-button-primary mg-button-sm'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClick();
                            }}
                            disabled={!consultant.available || (consultant.isOnVacation && (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY'))}
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
                                setShowDetailModal(true);
                            }}
                            variant="outline"
                            size="small"
                            preventDoubleClick={false}
                        >
                            상세보기
                        </MGButton>
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
            aria-label={`${toDisplayString(consultant.name)} 상담사 선택`}
        >
            <div className="mg-consultant-card__header-mobile">
                <Avatar
                    profileImageUrl={consultant.profileImageUrl}
                    displayName={toDisplayString(consultant.name)}
                    className="mg-consultant-card__avatar mg-consultant-card__avatar--mobile"
                />
                <div className="mg-consultant-card__status" style={{ '--availability-color': getAvailabilityColor() }}>
                    <span>{getAvailabilityText()}</span>
                </div>
            </div>
            
            <div className="mg-consultant-card__content-mobile">
                <h4 className="mg-consultant-card__name mg-consultant-card__name--mobile">{toDisplayString(consultant.name)}</h4>
                
                <div className="mg-consultant-card__rating-mobile">
                    <div className="mg-consultant-card__rating-item">
                        <Star size={14} />
                        <span>{ratingInfo.formattedRating}</span>
                    </div>
                    <div className="mg-consultant-card__rating-item">
                        <TrendingUp size={14} />
                        <span>{consultant.availableSlots || 0}개</span>
                    </div>
                </div>
                
                <div className="mg-consultant-card__info-mobile">
                    <div className="mg-consultant-card__info-row">
                        <Mail size={14} />
                        <span>{toDisplayString(consultant.email, '이메일 없음')}</span>
                    </div>
                    <div className="mg-consultant-card__info-row">
                        <Phone size={14} />
                        <span>{toDisplayString(consultant.phone, '전화번호 없음')}</span>
                    </div>
                </div>
                
                <div className="mg-consultant-card__specialties-mobile">
                    <div className="mg-consultant-card__specialties-title-mobile">전문 분야</div>
                    <div className="mg-consultant-card__specialties-list-mobile">
                        <SpecialtyDisplay
                            consultant={consultant}
                            variant="tag"
                            showTitle={false}
                            maxItems={10}
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
                        <span className="mg-consultant-card__stat-value">{getFormattedCurrentClients(consultant)}</span>
                    </div>
                </div>
                
                {showActions && (
                    <div className="mg-consultant-card__actions mg-consultant-card__actions--mobile">
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
                            disabled={!consultant.available || (consultant.isOnVacation && (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY'))}
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
                                setShowDetailModal(true);
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

    // 스케줄 선택용 카드 (B0KlA, 48px 아바타, 전문분야 1줄, 평점/경력 간략, 선택하기/상세보기)
    const renderScheduleSelectCard = () => (
        <div
            className={`mg-consultant-card mg-consultant-card--schedule-select ${selected ? 'mg-consultant-card--selected' : ''} ${!consultant.available || (consultant.isOnVacation && (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY')) ? 'mg-consultant-card--unavailable' : ''} ${className}`}
            data-availability={getAvailabilityClass()}
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
            aria-label={`${toDisplayString(consultant.name)} 상담사 선택`}
        >
            <div className="mg-consultant-card__status-badge" style={{ '--availability-color': getAvailabilityColor() }}>
                <span>{getAvailabilityText()}</span>
            </div>

            <Avatar
                profileImageUrl={consultant.profileImageUrl}
                displayName={toDisplayString(consultant.name)}
                className="mg-consultant-card__avatar mg-consultant-card__avatar--schedule-select"
            />

            <div className="mg-consultant-card__info mg-consultant-card__info--schedule-select">
                <h4 className="mg-consultant-card__name mg-consultant-card__name--schedule-select">{toDisplayString(consultant.name)}</h4>

                <div className="mg-consultant-card__specialty-inline">
                    <SpecialtyDisplay
                        consultant={consultant}
                        variant="inline"
                        showTitle={false}
                        maxItems={5}
                        debug={false}
                    />
                </div>

                <div className="mg-consultant-card__meta-brief">
                    <div className="mg-consultant-card__rating mg-consultant-card__rating--brief">
                        <Star size={14} />
                        <span>{ratingInfo.formattedRating}</span>
                    </div>
                    <span className="mg-consultant-card__experience-brief">{getFormattedExperience(consultant)} 경력</span>
                </div>

                <div className="mg-consultant-card__actions mg-consultant-card__actions--schedule-select">
                    <MGButton
                        variant="primary"
                        size="small"
                        className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClick();
                        }}
                        disabled={!consultant.available || (consultant.isOnVacation && (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY'))}
                        preventDoubleClick={false}
                    >
                        {selected ? '선택됨' : '선택하기'}
                    </MGButton>
                    <MGButton
                        variant="outline"
                        size="small"
                        className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDetailModal(true);
                        }}
                        preventDoubleClick={false}
                    >
                        상세보기
                    </MGButton>
                </div>
            </div>
        </div>
    );

    /** salary-profile: 등급·기본급 메타, renderActions, onCardClick(선택). 상세 모달은 호출처에서 처리. */
    const getBaseSalaryDisplay = () => {
        if (formattedBaseSalary != null && formattedBaseSalary !== '') return formattedBaseSalary;
        if (baseSalary != null && baseSalary !== '') return formatCurrency(Number(baseSalary));
        return '—';
    };

    const renderSalaryProfileCard = () => {
        const profileNameId = nameId || `profile-name-${consultant.id}`;
        const cardContent = (
            <>
                <span className="mg-consultant-card__accent mg-consultant-card__accent--salary-profile" aria-hidden />
                <div className="mg-consultant-card__info mg-consultant-card__info--salary-profile">
                    <h4 className="mg-consultant-card__name mg-consultant-card__name--salary-profile" id={profileNameId}>
                        {toDisplayString(consultant.name)}
                    </h4>
                    <div className="mg-consultant-card__meta mg-consultant-card__meta--salary-profile">
                        {toDisplayString(consultant.email, '—')}
                    </div>
                    <div className="mg-consultant-card__grade mg-consultant-card__grade--salary-profile">
                        등급: {grade != null && grade !== '' ? toDisplayString(grade) : '—'}
                    </div>
                    <div className="mg-consultant-card__base mg-consultant-card__base--salary-profile">
                        <span className="mg-consultant-card__base-label">기본급</span>
                        <span className="mg-consultant-card__base-value">{getBaseSalaryDisplay()}</span>
                    </div>
                    {renderActions && (
                        <div className="mg-consultant-card__actions mg-consultant-card__actions--salary-profile" style={{ position: 'relative', zIndex: 2 }}>
                            {renderActions(consultant)}
                        </div>
                    )}
                </div>
            </>
        );

        const baseClass = `mg-consultant-card mg-consultant-card--salary-profile ${salaryProfileCompact ? 'mg-consultant-card--salary-profile-compact' : ''} ${className}`.trim();

        if (onCardClick) {
            return (
                <div
                    className={baseClass}
                    role="button"
                    tabIndex={0}
                    aria-labelledby={profileNameId}
                    aria-label={`${toDisplayString(consultant.name)} 상세 보기`}
                    style={{ position: 'relative' }}
                    onClick={() => onCardClick(consultant)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onCardClick(consultant);
                        }
                    }}
                >
                    {cardContent}
                </div>
            );
        }

        return (
            <article className={baseClass} aria-labelledby={profileNameId}>
                {cardContent}
            </article>
        );
    };

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
            aria-label={`${toDisplayString(consultant.name)} 상담사 선택`}
        >
            <Avatar
                profileImageUrl={consultant.profileImageUrl}
                displayName={toDisplayString(consultant.name)}
                className="mg-consultant-card__avatar mg-consultant-card__avatar--mobile-simple"
            />
            
            <div className="mg-consultant-card__info mg-consultant-card__info--mobile-simple">
                <h4 className="mg-consultant-card__name mg-consultant-card__name--mobile-simple">{toDisplayString(consultant.name)}</h4>
                
                <div className="mg-consultant-card__meta mg-consultant-card__meta--mobile-simple">
                    <div className="mg-consultant-card__rating mg-consultant-card__rating--mobile-simple">
                        <Star size={12} />
                        <span>{ratingInfo.formattedRating}</span>
                    </div>
                <span>{getFormattedExperience(consultant)}</span>
                    <span>{consultant.availableSlots || 0}개 가능</span>
                </div>
                
                {/* 전문 분야 - 모바일 심플 버전 */}
                <div className="mg-consultant-card__specialties-mobile-simple">
                    <SpecialtyDisplay
                        consultant={consultant}
                        variant="inline"
                        showTitle={false}
                        maxItems={5}
                        debug={false}
                    />
                </div>
            </div>
            
            <div className="mg-consultant-card__status mg-consultant-card__status--mobile-simple" style={{ '--availability-color': getAvailabilityColor() }}>
                <TrendingUp size={12} />
            </div>
        </div>
    );

    // 변형에 따른 렌더링
    const renderCard = () => {
        switch (variant) {
            case 'compact':
                return renderCompactCard();
            case 'mobile':
                return renderMobileCard();
            case 'mobile-simple':
                return renderMobileSimpleCard();
            case 'schedule-select':
                return renderScheduleSelectCard();
            case 'salary-profile':
                return renderSalaryProfileCard();
            case 'detailed':
            default:
                return renderDetailedCard();
        }
    };

    const showDetailModalForVariant = variant !== 'salary-profile';

    return (
        <>
            {renderCard()}
            {showDetailModalForVariant && (
                <ConsultantDetailModal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    consultant={consultant}
                />
            )}
        </>
    );
};

export default ConsultantCard;
