/**
 * ScheduleCalendar 유틸리티 함수들
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

/**
 * 시간 포맷팅 함수
 */
export const formatTime = (timeObj) => {
    if (!timeObj) return '시간 미정';
    try {
        return timeObj.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (error) {
        console.warn('시간 변환 오류:', error);
        return '시간 미정';
    }
};

/**
 * 상태값을 한글로 변환 (동적 로드)
 */
export const convertStatusToKorean = (status, scheduleStatusOptions) => {
    const statusOption = scheduleStatusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : status || "알 수 없음";
};

/**
 * 상담 유형을 한글로 변환
 */
export const convertConsultationTypeToKorean = (consultationType) => {
    const typeMap = {
        'INITIAL': '초기 상담',
        'REGULAR': '정기 상담',
        'EMERGENCY': '긴급 상담',
        'FOLLOW_UP': '후속 상담',
        'GROUP': '그룹 상담',
        'FAMILY': '가족 상담'
    };
    return typeMap[consultationType] || consultationType || '일반 상담';
};

/**
 * 상담사별 색상 생성
 */
export const getConsultantColor = (consultantId) => {
    if (!consultantId) return '#6b7280';
    
    // 상담사 ID를 기반으로 일관된 색상 생성
    const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
        '#14b8a6', '#a855f7', '#22c55e', '#eab308', '#ef4444'
    ];
    
    // 간단한 해시 함수로 일관된 색상 선택
    let hash = 0;
    for (let i = 0; i < consultantId.toString().length; i++) {
        const char = consultantId.toString().charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32비트 정수로 변환
    }
    
    return colors[Math.abs(hash) % colors.length];
};

/**
 * 상태별 이벤트 색상
 */
export const getEventColor = (status) => {
    const statusColors = {
        'AVAILABLE': '#28a745',
        'BOOKED': '#007bff',
        'CONFIRMED': '#17a2b8',
        'VACATION': '#ffc107',
        'COMPLETED': '#6c757d',
        'CANCELLED': '#dc3545'
    };
    return statusColors[status] || '#6b7280';
};

/**
 * 휴가 데이터를 이벤트로 변환
 */
export const convertVacationToEvent = (vacationData, consultantId, date) => {
    const startDate = new Date(date + 'T00:00:00+09:00');
    const endDate = new Date(date + 'T23:59:59+09:00');
    
    return {
        id: `vacation-${consultantId}-${date}`,
        title: '휴가',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: '#ffc107',
        borderColor: '#ffc107',
        className: 'vacation-event',
        allDay: true,
        extendedProps: {
            id: `vacation-${consultantId}-${date}`,
            consultantId: consultantId,
            consultantName: vacationData.consultantName || '상담사',
            clientId: null,
            clientName: null,
            status: 'VACATION',
            statusKorean: '휴가',
            type: 'vacation',
            consultationType: null,
            description: vacationData.reason || '휴가'
        }
    };
};

/**
 * 모바일 환경 감지
 */
export const checkIsMobile = (forceMobileMode = false) => {
    const isSmallScreen = window.innerWidth <= 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return forceMobileMode || (isSmallScreen && (isTouchDevice || isMobileUserAgent));
};

/**
 * 시간 슬롯 생성
 */
export const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push(timeString);
        }
    }
    return slots;
};

/**
 * 시간 슬롯이 예약되었는지 확인
 */
export const isTimeSlotBooked = (startTime, endTime, bookedTimes) => {
    return bookedTimes.some(booked => {
        const bookedStart = new Date(`2000-01-01T${booked.startTime}`);
        const bookedEnd = new Date(`2000-01-01T${booked.endTime}`);
        const slotStart = new Date(`2000-01-01T${startTime}`);
        const slotEnd = new Date(`2000-01-01T${endTime}`);
        
        return (slotStart < bookedEnd && slotEnd > bookedStart);
    });
};
