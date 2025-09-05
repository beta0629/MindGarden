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
     * 전문분야를 한글로 변환
     */
    const convertSpecialtyToKorean = (specialty) => {
        if (!specialty) return '전문분야 미설정';
        
        const specialtyMap = {
            'DEPRESSION': '우울증',
            'ANXIETY': '불안장애',
            'TRAUMA': '트라우마',
            'RELATIONSHIP': '관계상담',
            'FAMILY': '가족상담',
            'COUPLE': '부부상담',
            'CHILD': '아동상담',
            'ADOLESCENT': '청소년상담',
            'ADDICTION': '중독상담',
            'EATING_DISORDER': '섭식장애',
            'PERSONALITY': '성격장애',
            'BIPOLAR': '양극성장애',
            'OCD': '강박장애',
            'PTSD': '외상후스트레스장애',
            'GRIEF': '상실상담',
            'CAREER': '진로상담',
            'STRESS': '스트레스관리',
            'SLEEP': '수면장애',
            'ANGER': '분노조절',
            'SELF_ESTEEM': '자존감'
        };
        
        return specialtyMap[specialty] || specialty;
    };

    /**
     * 전문분야 텍스트 반환
     */
    const getSpecialtyText = () => {
        // 백엔드에서 반환하는 필드명들 확인
        let specialty = null;
        
        if (consultant.specialization && consultant.specialization.trim() !== '') {
            specialty = consultant.specialization;
        } else if (consultant.specialty && consultant.specialty.trim() !== '') {
            specialty = consultant.specialty;
        } else if (consultant.specialties && consultant.specialties.length > 0) {
            specialty = consultant.specialties[0];
        } else if (consultant.specialtyName && consultant.specialtyName.trim() !== '') {
            specialty = consultant.specialtyName;
        } else if (consultant.expertise && consultant.expertise.trim() !== '') {
            specialty = consultant.expertise;
        }
        
        return convertSpecialtyToKorean(specialty);
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
                
                {/* 상태 및 등록일 */}
                <div className="consultant-status-info">
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
