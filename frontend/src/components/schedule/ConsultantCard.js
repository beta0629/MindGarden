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
            style={{
                minHeight: '220px',
                background: selected ? 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)' : '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                border: selected ? '2px solid #667eea' : '2px solid #e9ecef',
                cursor: (() => {
                    const isFullDayVacation = consultant.isOnVacation && 
                        (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY');
                    return (isFullDayVacation || !consultant.available) ? 'not-allowed' : 'pointer';
                })(),
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                textAlign: 'left',
                position: 'relative',
                overflow: 'visible',
                boxShadow: selected ? '0 8px 25px rgba(102, 126, 234, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                margin: '0',
                gap: '16px'
            }}
            onMouseEnter={(e) => {
                if (!selected) {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
                    e.target.style.borderColor = '#667eea';
                }
            }}
            onMouseLeave={(e) => {
                if (!selected) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    e.target.style.borderColor = '#e9ecef';
                }
            }}
        >
            {/* 상담사 아바타 */}
            <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-xl)',
                fontWeight: '700',
                color: '#ffffff',
                flexShrink: '0',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                border: '2px solid #e9ecef'
            }}>
                {getInitial()}
            </div>

            {/* 상담사 정보 */}
            <div style={{
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                overflow: 'visible',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                height: '100%',
                minWidth: '0',
                textAlign: 'left'
            }}>
                <h5 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: '700',
                    color: '#495057',
                    margin: '0',
                    lineHeight: '1.2',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    textAlign: 'left'
                }}>{consultant.name}</h5>
                <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: '#6c757d',
                    margin: '0',
                    fontWeight: '400',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    textAlign: 'left'
                }}>{consultant.email || '이메일 없음'}</p>
                <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: '#6c757d',
                    margin: '0',
                    fontWeight: '400',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    textAlign: 'left'
                }}>{consultant.phone || '전화번호 없음'}</p>
                <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: '#6c757d',
                    fontWeight: '400',
                    margin: '0',
                    fontStyle: 'italic',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    textAlign: 'left'
                }}>{getSpecialtyText()}</p>
                
                {/* 상태 및 등록일 */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '12px',
                    marginTop: '8px',
                    marginLeft: '16px',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    textAlign: 'left'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: getAvailabilityClass() === 'available' ? '#d4edda' : 
                                   getAvailabilityClass() === 'busy' ? '#fff3cd' : '#f8d7da',
                        color: getAvailabilityClass() === 'available' ? '#28a745' : 
                               getAvailabilityClass() === 'busy' ? '#856404' : '#dc3545',
                        minWidth: '60px',
                        justifyContent: 'center',
                        border: getAvailabilityClass() === 'available' ? '1px solid #c3e6cb' : 
                                getAvailabilityClass() === 'busy' ? '1px solid #ffeaa7' : '1px solid #f5c6cb'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'currentColor',
                            boxShadow: '0 0 4px rgba(0, 0, 0, 0.2)'
                        }}></div>
                        {getAvailabilityText()}
                    </div>
                    <p style={{
                        fontSize: 'var(--font-size-xs)',
                        color: '#6c757d',
                        fontWeight: '400',
                        margin: '0',
                        textAlign: 'left'
                    }}>
                        등록일: {consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString('ko-KR') : '2025. 1. 5.'}
                    </p>
                </div>
                
                {/* 상담 가능 시간 정보 */}
                {getAvailabilityInfo() && getAvailabilityInfo().length > 0 && (
                    <div style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                    }}>
                        <div style={{
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600',
                            color: '#495057',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span>🕐</span>
                            상담 가능 시간
                        </div>
                        <div style={{
                            fontSize: 'var(--font-size-xs)',
                            color: '#6c757d',
                            lineHeight: '1.4'
                        }}>
                            {getAvailabilityInfo().slice(0, 3).map((info, index) => (
                                <div key={index} style={{ marginBottom: '2px' }}>
                                    {info}
                                </div>
                            ))}
                            {getAvailabilityInfo().length > 3 && (
                                <div style={{ 
                                    color: '#999',
                                    fontStyle: 'italic'
                                }}>
                                    +{getAvailabilityInfo().length - 3}개 더
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 선택 표시 */}
            {selected && (
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '24px',
                    height: '24px',
                    background: '#28a745',
                    color: '#ffffff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '700',
                    animation: 'selectionPulse 0.3s ease'
                }}>
                    ✓
                </div>
            )}
        </div>
    );
};

export default ConsultantCardNew;
