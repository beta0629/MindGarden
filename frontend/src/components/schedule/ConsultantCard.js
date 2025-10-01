import React from 'react';
import { COMPONENT_CSS, SCHEDULE_MODAL_CONSTANTS } from '../../constants/css-variables';
import '../../styles/main.css';
import './ConsultantCard.css';

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
        // 디버깅을 위한 로그
        if (consultant.name === '김선희2') {
            console.log('🔍 김선희2 ConsultantCard 데이터:', {
                isOnVacation: consultant.isOnVacation,
                vacationType: consultant.vacationType,
                vacationReason: consultant.vacationReason,
                available: consultant.available,
                busy: consultant.busy
            });
        }
        
        // 휴가 정보 확인
        if (consultant.isOnVacation) {
            const vacationType = consultant.vacationType;
            if (vacationType === 'FULL_DAY' || vacationType === 'ALL_DAY') {
                return '🏖️ 종일 휴무';
            } else if (vacationType === 'MORNING') {
                return '🌅 오전 휴무';
            } else if (vacationType === 'AFTERNOON') {
                return '🌆 오후 휴무';
            } else if (vacationType === 'CUSTOM') {
                return '⏰ 시간 휴무';
            } else {
                return '🏖️ 휴무';
            }
        }
        
        if (!consultant.available) return '불가능';
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
        
        // 콤마로 구분된 여러 전문분야 처리
        if (specialty.includes(',')) {
            const specialties = specialty.split(',').map(s => s.trim());
            const koreanSpecialties = specialties.map(s => specialtyMap[s] || s);
            return koreanSpecialties.join(', ');
        }
        
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
        
        // 디버깅을 위한 로그
        console.log('Consultant data:', consultant);
        console.log('Specialty found:', specialty);
        
        return convertSpecialtyToKorean(specialty);
    };

    /**
     * 상담 가능 시간 정보 파싱
     */
    const getAvailabilityInfo = () => {
        if (!consultant.availabilityData) return null;
        
        // 요일별 상담 가능 시간 정보
        const dayNames = {
            'MONDAY': '월',
            'TUESDAY': '화', 
            'WEDNESDAY': '수',
            'THURSDAY': '목',
            'FRIDAY': '금',
            'SATURDAY': '토',
            'SUNDAY': '일'
        };
        
        const availabilityInfo = [];
        Object.keys(consultant.availabilityData).forEach(day => {
            const daySlots = consultant.availabilityData[day];
            if (daySlots && daySlots.length > 0) {
                const dayName = dayNames[day] || day;
                const timeRanges = daySlots.map(slot => 
                    `${slot.startTime}-${slot.endTime}`
                ).join(', ');
                availabilityInfo.push(`${dayName}: ${timeRanges}`);
            }
        });
        
        return availabilityInfo;
    };

    /**
     * 카드 클릭 핸들러
     */
    const handleClick = () => {
        // 종일 휴가인 경우 클릭 불가
        const isFullDayVacation = consultant.isOnVacation && 
            (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY');
        
        if (isFullDayVacation || !consultant.available) {
            return;
        }
        
        if (onClick) {
            onClick(consultant);
        }
    };

    return (
        <div
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
            className={`consultant-card-new ${selected ? 'consultant-card-new--selected' : ''} ${!consultant.available || (consultant.isOnVacation && (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY')) ? 'consultant-card-new--disabled' : ''}`}
        >
            {/* 상담사 아바타 */}
            <div className="consultant-card-avatar">
                {getInitial()}
            </div>

            {/* 상담사 정보 */}
            <div className="consultant-card-info">
                <h5 className="consultant-card-name">{consultant.name}</h5>
                <p className="consultant-card-email">{consultant.email || '이메일 없음'}</p>
                <p className="consultant-card-phone">{consultant.phone || '전화번호 없음'}</p>
                <p className="consultant-card-specialty">{getSpecialtyText()}</p>
                
                {/* 상태 및 등록일 */}
                <div className="consultant-card-status-row">
                    <div className={`consultant-card-status consultant-card-status--${getAvailabilityClass()}`}>
                        <div className="consultant-card-status-dot"></div>
                        {getAvailabilityText()}
                    </div>
                    <p className="consultant-card-created-date">
                        등록일: {consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString('ko-KR') : '2025. 1. 5.'}
                    </p>
                </div>
                
                {/* 상담 가능 시간 정보 */}
                {getAvailabilityInfo() && getAvailabilityInfo().length > 0 && (
                    <div className="consultant-card-availability">
                        <div className="consultant-card-availability-title">
                            <span>🕐</span>
                            상담 가능 시간
                        </div>
                        <div className="consultant-card-availability-times">
                            {getAvailabilityInfo().slice(0, 3).map((info, index) => (
                                <div key={index} className="consultant-card-availability-time">
                                    {info}
                                </div>
                            ))}
                            {getAvailabilityInfo().length > 3 && (
                                <div className="consultant-card-availability-more">
                                    +{getAvailabilityInfo().length - 3}개 더
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 선택 표시 */}
            {selected && (
                <div className="consultant-card-selected-badge">
                    ✓
                </div>
            )}
        </div>
    );
};

export default ConsultantCardNew;
