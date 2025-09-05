import React from 'react';
import { COMPONENT_CSS, SCHEDULE_MODAL_CONSTANTS } from '../../constants/css-variables';

/**
 * 새로운 디자인의 상담사 카드 컴포넌트
 * - CSS 클래스 상수 사용
 * - JavaScript 상수 사용
 * - 현대적인 디자인 적용
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-01-05
 */
const ConsultantCardNew = ({ 
    consultant, 
    onClick, 
    selected = false, 
    draggable = false 
}) => {
    /**
     * 가용성 상태에 따른 클래스명 반환
     */
    const getAvailabilityClass = () => {
        if (!consultant.available) return 'unavailable';
        if (consultant.busy) return 'busy';
        return 'available';
    };

    /**
     * 가용성 상태에 따른 텍스트 반환
     */
    const getAvailabilityText = () => {
        if (!consultant.available) return '휴';
        if (consultant.busy) return '바쁨';
        return '여유';
    };

    /**
     * 가용성 상태에 따른 색상 반환
     */
    const getAvailabilityColor = () => {
        if (!consultant.available) return SCHEDULE_MODAL_CONSTANTS.DANGER_COLOR;
        if (consultant.busy) return SCHEDULE_MODAL_CONSTANTS.WARNING_COLOR;
        return SCHEDULE_MODAL_CONSTANTS.SUCCESS_COLOR;
    };

    /**
     * 상담사 이름의 첫 글자 반환
     */
    const getInitial = () => {
        return consultant.name ? consultant.name.charAt(0) : '?';
    };

    /**
     * 전문분야 텍스트 반환
     */
    const getSpecialtyText = () => {
        return consultant.specialties?.[0] || consultant.specialty || '전문분야 없음';
    };

    /**
     * 카드 클릭 핸들러
     */
    const handleClick = () => {
        if (onClick) {
            onClick(consultant);
        }
    };

    return (
        <div
            className={`${COMPONENT_CSS.SCHEDULE_MODAL.CONSULTANT_CARD} ${selected ? 'selected' : ''}`}
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
            {/* 상담사 아바타 */}
            <div className="consultant-avatar">
                {getInitial()}
            </div>

            {/* 상담사 정보 */}
            <div className="consultant-info">
                <h5 className="consultant-name">{consultant.name}</h5>
                <p className="consultant-email">{consultant.email || '이메일 없음'}</p>
                <p className="consultant-phone">{consultant.phone || '전화번호 없음'}</p>
                <p className="consultant-specialty">{getSpecialtyText()}</p>
            </div>

            {/* 하단 정보 (가용성 상태, 등록일) */}
            <div className="consultant-bottom">
                <div 
                    className={`consultant-availability ${getAvailabilityClass()}`}
                    style={{ '--availability-color': getAvailabilityColor() }}
                >
                    <div className="availability-dot"></div>
                    {getAvailabilityText()}
                </div>
                <p className="consultant-registration-date">
                    등록일: {consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString('ko-KR') : '2025. 1. 5.'}
                </p>
            </div>

            {/* 선택 표시 */}
            {selected && (
                <div className="selection-indicator">
                    ✓
                </div>
            )}
        </div>
    );
};

export default ConsultantCardNew;
