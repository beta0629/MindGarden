import React, { useState, useEffect } from 'react';
import './TimeSlotGrid.css';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  BUSINESS_HOURS, 
  TIME_SLOT_INTERVAL, 
  DEFAULT_CONSULTATION_DURATION 
} from '../../constants/schedule';

/**
 * 시간 슬롯 그리드 컴포넌트
 * - 30분 단위 시간 슬롯 표시
 * - 상담 유형별 시간 할당
 * - 충돌 검사 및 가용성 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const TimeSlotGrid = ({ 
    date, 
    consultantId, 
    duration = DEFAULT_CONSULTATION_DURATION, 
    onTimeSlotSelect, 
    selectedTimeSlot 
}) => {
    // date prop을 selectedDate로 사용
    const selectedDate = date;
    const [timeSlots, setTimeSlots] = useState([]);
    const [existingSchedules, setExistingSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [consultantInfo, setConsultantInfo] = useState(null);
    const [vacationInfo, setVacationInfo] = useState(null);

    useEffect(() => {
        if (consultantId) {
            loadConsultantInfo();
        }
        if (consultantId && date) {
            loadExistingSchedules();
            loadVacationInfo();
        }
    }, [date, consultantId, duration]);

    useEffect(() => {
        if (consultantInfo) {
            generateTimeSlots();
        }
    }, [consultantInfo, duration, vacationInfo, existingSchedules]);

    // 선택된 시간 슬롯이 변경될 때마다 슬롯 가용성 업데이트
    useEffect(() => {
        if (selectedTimeSlot && timeSlots.length > 0) {
            updateSlotsForSelectedTime();
        }
    }, [selectedTimeSlot, timeSlots]);

    /**
     * 상담사 정보 로드
     */
    const loadConsultantInfo = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/v1/consultants/${consultantId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setConsultantInfo(result.data);
                } else {
                    setDefaultConsultantInfo();
                }
            } else {
                setDefaultConsultantInfo();
            }
        } catch (error) {
            console.error('상담사 정보 로드 실패:', error);
            setDefaultConsultantInfo();
        }
    };

    const setDefaultConsultantInfo = () => {
        setConsultantInfo({
            consultationHours: '09:00-18:00',
            breakTime: '12:00-13:00',
            sessionDuration: 50,
            breakBetweenSessions: 10
        });
    };

    /**
     * 휴가 정보 로드
     */
    const loadVacationInfo = async () => {
        if (!consultantId || !date) {
            console.log('휴가 정보 로드 건너뜀: consultantId 또는 date가 없음');
            return;
        }

        try {
            // 날짜 형식 변환 (Date 객체인 경우 YYYY-MM-DD 형식으로 변환)
            let dateStr;
            if (date instanceof Date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
            } else {
                dateStr = date;
            }

            console.log('휴가 정보 로드:', { consultantId, dateStr });

            const response = await fetch(`/api/consultant/vacations?date=${dateStr}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                console.log('휴가 정보 API 응답:', result);
                if (result.success && result.data) {
                    // API 응답 구조: {data: {consultantId: {date: vacationInfo}}}
                    const consultantData = result.data[consultantId];
                    if (consultantData && consultantData[dateStr]) {
                        const vacationInfo = consultantData[dateStr];
                        setVacationInfo(vacationInfo);
                        console.log('휴가 정보 설정:', vacationInfo);
                    } else {
                        setVacationInfo(null);
                        console.log('해당 상담사의 휴가 정보 없음');
                    }
                } else {
                    setVacationInfo(null);
                    console.log('휴가 정보 없음');
                }
            } else {
                console.error('휴가 정보 로드 실패:', response.status);
                setVacationInfo(null);
            }
        } catch (error) {
            console.error('휴가 정보 로드 실패:', error);
            setVacationInfo(null);
        }
    };

    /**
     * 시간 슬롯 생성
     */
    const generateTimeSlots = () => {
        if (!consultantInfo) return;
        console.log('🔍 generateTimeSlots 호출:', { duration, consultantInfo });
        const slots = [];
        
        // 상담사별 업무시간 파싱 (예: "09:00-18:00")
        const consultationHours = consultantInfo.consultationHours || '09:00-18:00';
        const [startTime, endTime] = consultationHours.split('-');
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // 상담사별 휴식시간 파싱 (예: "12:00-13:00")
        const breakTimes = consultantInfo.breakTime ? consultantInfo.breakTime.split('-') : null;
        const breakStart = breakTimes ? breakTimes[0].split(':').map(Number) : null;
        const breakEnd = breakTimes ? breakTimes[1].split(':').map(Number) : null;
        
        // 상담사별 세션 간 휴식 시간
        const breakBetweenSessions = consultantInfo.breakBetweenSessions || 10;
        
        // 상담 시간을 고려하여 마지막 가능한 시작 시간 계산
        const totalDuration = duration + breakBetweenSessions;
        const maxStartMinutes = (endHour * 60 + endMinute) - totalDuration;
        const maxStartHour = Math.floor(maxStartMinutes / 60);
        const maxStartMinute = maxStartMinutes % 60;
        
        console.log('🕐 시간 슬롯 생성 정보:', {
            consultationHours: consultationHours,
            duration: duration,
            breakBetweenSessions: breakBetweenSessions,
            totalDuration: totalDuration,
            maxStartMinutes: maxStartMinutes,
            maxStartHour: maxStartHour,
            maxStartMinute: maxStartMinute
        });
        
        // 상담 시간에 맞는 슬롯 간격 계산 (최소 30분, 상담 시간의 절반 이상)
        const slotInterval = Math.max(30, Math.ceil(duration / 2));
        
        for (let hour = startHour; hour <= maxStartHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotInterval) {
                // 마지막 시간대 체크
                if (hour === maxStartHour && minute > maxStartMinute) {
                    break;
                }
                
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const slotEndTime = calculateEndTime(timeString, duration);
                
                // 휴식 시간을 포함한 총 종료 시간 계산 (업무 시간 확인용)
                const breakBetweenSessions = consultantInfo?.breakBetweenSessions || 10;
                const totalEndTime = calculateEndTime(timeString, duration + breakBetweenSessions);
                
                // 업무 시간 내에서만 종료되는 슬롯만 추가
                if (isWithinConsultantHours(totalEndTime, startHour, startMinute, endHour, endMinute)) {
                    // 휴가 정보 확인
                    const isVacationTime = checkVacationTime(timeString, slotEndTime);
                    
                    // 현재 시간과 비교하여 지난 시간인지 확인
                    const isPastTime = isTimeInPast(timeString, selectedDate);
                    
                    // 기존 스케줄과의 충돌 확인
                    const hasConflict = checkTimeConflict({
                        time: timeString,
                        endTime: slotEndTime
                    }, existingSchedules);
                    
                    slots.push({
                        id: `slot-${timeString}`,
                        time: timeString,
                        endTime: slotEndTime,
                        duration: duration,
                        available: !isVacationTime && !isPastTime && !hasConflict,
                        conflict: hasConflict,
                        vacation: isVacationTime,
                        past: isPastTime
                    });
                }
            }
        }
        
        // 시간 순서대로 정렬 (더 안전한 정렬)
        const sortedSlots = [...slots].sort((a, b) => {
            const timeA = a.time.split(':').map(Number);
            const timeB = b.time.split(':').map(Number);
            const minutesA = timeA[0] * 60 + timeA[1];
            const minutesB = timeB[0] * 60 + timeB[1];
            return minutesA - minutesB;
        });
        
        console.log('🕐 정렬 전 시간 슬롯:', slots.map(slot => slot.time));
        console.log('🕐 정렬 후 시간 슬롯:', sortedSlots.map(slot => slot.time));
        console.log('🕐 생성된 시간 슬롯 상세:', sortedSlots.map(slot => ({
            time: slot.time,
            endTime: slot.endTime,
            available: slot.available,
            vacation: slot.vacation
        })));
        
        setTimeSlots(sortedSlots);
    };

    /**
     * 지난 시간인지 확인
     */
    const isTimeInPast = (timeString, selectedDate) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        
        // 선택된 날짜가 오늘보다 이전이면 모든 시간이 지난 시간
        if (selectedDay < today) {
            return true;
        }
        
        // 선택된 날짜가 오늘인 경우에만 시간 비교
        if (selectedDay.getTime() === today.getTime()) {
            const [hour, minute] = timeString.split(':').map(Number);
            const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
            
            // 현재 시간보다 30분 이전이면 지난 시간으로 간주 (예약 여유시간)
            const bufferMinutes = 30;
            const currentTimeWithBuffer = new Date(now.getTime() + bufferMinutes * 60000);
            
            return slotTime < currentTimeWithBuffer;
        }
        
        return false;
    };

    /**
     * 휴가 시간 확인
     */
    const checkVacationTime = (startTime, endTime) => {
        if (!vacationInfo) {
            console.log('🔍 휴가 정보 없음');
            return false;
        }
        
        const vacationType = vacationInfo.type;
        console.log('🔍 휴가 시간 확인:', {
            vacationType,
            startTime,
            endTime,
            vacationInfo
        });
        const vacationStartTime = vacationInfo.startTime;
        const vacationEndTime = vacationInfo.endTime;
        
        // 시간 문자열을 분으로 변환하는 헬퍼 함수
        const timeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        
        const slotStartMinutes = timeToMinutes(startTime);
        const slotEndMinutes = timeToMinutes(endTime);
        
        switch (vacationType) {
            case 'ALL_DAY':
            case 'FULL_DAY':
                return true; // 하루 종일 휴가
                
            case 'MORNING':
                // 오전 휴가: 09:00-12:00
                return slotStartMinutes < 720; // 12:00 = 720분
                
            case 'MORNING_HALF_1':
                // 오전 반반차 1: 09:00-11:00 (2시간)
                return slotStartMinutes < 660; // 11:00 = 660분
                
            case 'MORNING_HALF_2':
                // 오전 반반차 2: 11:00-13:00 (2시간)
                return slotStartMinutes >= 660 && slotStartMinutes < 780; // 11:00-13:00
                
            case 'AFTERNOON':
                // 오후 휴가: 14:00-18:00
                return slotStartMinutes >= 840; // 14:00 = 840분
                
            case 'AFTERNOON_HALF_1':
                // 오후 반반차 1: 14:00-16:00 (2시간)
                return slotStartMinutes >= 840 && slotStartMinutes < 960; // 14:00-16:00
                
            case 'AFTERNOON_HALF_2':
                // 오후 반반차 2: 16:00-18:00 (2시간)
                return slotStartMinutes >= 960; // 16:00-18:00
                
            case 'CUSTOM_TIME':
                if (vacationStartTime && vacationEndTime) {
                    const vacationStartMinutes = timeToMinutes(vacationStartTime);
                    const vacationEndMinutes = timeToMinutes(vacationEndTime);
                    
                    // 시간 겹침 확인
                    return (slotStartMinutes < vacationEndMinutes && slotEndMinutes > vacationStartMinutes);
                }
                return false;
                
            default:
                return false;
        }
    };

    /**
     * 기존 스케줄 로드
     */
    const loadExistingSchedules = async () => {
        // consultantId가 유효하지 않으면 요청하지 않음
        if (!consultantId || consultantId === 'undefined' || consultantId === 'null') {
            console.warn('⚠️ TimeSlotGrid: consultantId가 유효하지 않음:', consultantId);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // 날짜를 로컬 시간대로 처리하여 시간대 변환 문제 방지
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            console.log('🔍 TimeSlotGrid: 스케줄 로드 요청:', {
                consultantId,
                dateStr,
                url: `/api/schedules/consultant/${consultantId}/date?date=${dateStr}`
            });
            
            const response = await fetch(
                `/api/schedules/consultant/${consultantId}/date?date=${dateStr}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                }
            );

            console.log('📥 TimeSlotGrid: 응답 상태:', response.status, response.statusText);

            if (response.ok) {
                const schedules = await response.json();
                console.log('✅ TimeSlotGrid: 스케줄 로드 성공:', schedules);
                setExistingSchedules(schedules);
                updateSlotAvailability(schedules);
            } else {
                console.error('❌ TimeSlotGrid: 스케줄 로드 실패:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('기존 스케줄 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 선택된 시간에 따른 슬롯 가용성 업데이트
     */
    const updateSlotsForSelectedTime = () => {
        if (!selectedTimeSlot) return;
        
        setTimeSlots(prevSlots => 
            prevSlots.map(slot => {
                // 선택된 슬롯은 항상 사용 가능
                if (slot.id === selectedTimeSlot.id) {
                    return {
                        ...slot,
                        available: true,
                        conflict: false,
                        selected: true
                    };
                }
                
                // 선택된 시간과 충돌하는지 확인
                const conflictsWithSelected = checkTimeConflictWithSelected(slot, selectedTimeSlot);
                
                return {
                    ...slot,
                    available: !conflictsWithSelected && !slot.past && !slot.vacation,
                    conflict: conflictsWithSelected,
                    selected: false
                };
            })
        );
    };

    /**
     * 선택된 시간과의 충돌 검사
     */
    const checkTimeConflictWithSelected = (slot, selectedSlot) => {
        const slotStart = slot.time;
        const slotEnd = slot.endTime;
        const selectedStart = selectedSlot.time;
        const selectedEnd = selectedSlot.endTime;
        
        // 시간 겹침 확인
        const isOverlapping = isTimeOverlapping(slotStart, slotEnd, selectedStart, selectedEnd);
        
        // 휴식 시간 고려 (10분)
        const isTooClose = isTimeTooClose(slotStart, slotEnd, selectedStart, selectedEnd);
        
        return isOverlapping || isTooClose;
    };

    /**
     * 슬롯 가용성 업데이트
     */
    const updateSlotAvailability = (schedules) => {
        setTimeSlots(prevSlots => 
            prevSlots.map(slot => {
                const conflict = checkTimeConflict(slot, schedules);
                return {
                    ...slot,
                    available: !conflict,
                    conflict: conflict
                };
            })
        );
    };

    /**
     * 시간 충돌 검사
     */
    const checkTimeConflict = (slot, schedules) => {
        const slotStart = slot.time;
        const slotEnd = slot.endTime;
        
        return schedules.some(schedule => {
            const scheduleStart = schedule.startTime;
            const scheduleEnd = schedule.endTime;
            
            // 10분 휴식 시간을 고려한 충돌 검사
            return isTimeOverlapping(slotStart, slotEnd, scheduleStart, scheduleEnd) ||
                   isTimeTooClose(slotStart, slotEnd, scheduleStart, scheduleEnd);
        });
    };

    /**
     * 시간 겹침 여부 확인
     */
    const isTimeOverlapping = (start1, end1, start2, end2) => {
        return start1 < end2 && start2 < end1;
    };

    /**
     * 시간 간격이 너무 가까운지 확인 (10분 휴식 시간)
     */
    const isTimeTooClose = (start1, end1, start2, end2) => {
        const breakTime = 10; // 10분 휴식 시간
        
        // 첫 번째 스케줄이 두 번째 스케줄보다 먼저 끝나는 경우
        if (end1 <= start2) {
            const gapMinutes = getMinutesDifference(end1, start2);
            return gapMinutes < breakTime;
        }
        
        // 두 번째 스케줄이 첫 번째 스케줄보다 먼저 끝나는 경우
        if (end2 <= start1) {
            const gapMinutes = getMinutesDifference(end2, start1);
            return gapMinutes < breakTime;
        }
        
        return false;
    };

    /**
     * 분 단위 시간 차이 계산
     */
    const getMinutesDifference = (time1, time2) => {
        const [h1, m1] = time1.split(':').map(Number);
        const [h2, m2] = time2.split(':').map(Number);
        
        const minutes1 = h1 * 60 + m1;
        const minutes2 = h2 * 60 + m2;
        
        return Math.abs(minutes2 - minutes1);
    };

    /**
     * 종료 시간 계산 (휴식 시간 제외)
     */
    const calculateEndTime = (startTime, durationMinutes) => {
        const [hour, minute] = startTime.split(':').map(Number);
        const totalMinutes = hour * 60 + minute + durationMinutes;
        
        const endHour = Math.floor(totalMinutes / 60);
        const endMinute = totalMinutes % 60;
        
        return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    };

    /**
     * 상담사 업무 시간 내 확인
     */
    const isWithinConsultantHours = (timeString, startHour, startMinute, endHour, endMinute) => {
        const [hour, minute] = timeString.split(':').map(Number);
        const totalMinutes = hour * 60 + minute;
        
        const consultantStart = startHour * 60 + startMinute;
        const consultantEnd = endHour * 60 + endMinute;
        
        return totalMinutes >= consultantStart && totalMinutes <= consultantEnd;
    };

    /**
     * 휴식시간과 겹치는지 확인 (현재는 사용하지 않음)
     */
    const isOverlappingWithBreakTime = (startTime, endTime, breakStart, breakEnd) => {
        if (!breakStart || !breakEnd) return false;
        
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        const slotStartMinutes = startHour * 60 + startMinute;
        const slotEndMinutes = endHour * 60 + endMinute;
        const breakStartMinutes = breakStart[0] * 60 + breakStart[1];
        const breakEndMinutes = breakEnd[0] * 60 + breakEnd[1];
        
        return (slotStartMinutes < breakEndMinutes && slotEndMinutes > breakStartMinutes);
    };

    /**
     * 시간 슬롯 클릭 핸들러
     */
    const handleSlotClick = (slot) => {
        if (slot.past) {
            // 지난 시간 클릭 시 알림
            alert(`⏰ 해당 시간은 이미 지났습니다.\n현재 시간 이후의 시간을 선택해주세요.`);
            return;
        }
        
        if (slot.vacation) {
            // 휴가 시간대 클릭 시 알림
            const vacationType = vacationInfo?.type || '휴가';
            const vacationTypeNames = {
                'ALL_DAY': '하루 종일',
                'FULL_DAY': '하루 종일',
                'MORNING': '오전',
                'MORNING_HALF': '오전 반반차',
                'AFTERNOON': '오후',
                'AFTERNOON_HALF': '오후 반반차',
                'CUSTOM_TIME': '사용자 정의'
            };
            
            const typeName = vacationTypeNames[vacationType] || '휴가';
            alert(`🏖️ 해당 시간대는 상담사의 ${typeName} 휴가 시간입니다.\n다른 시간을 선택해주세요.`);
            return;
        }
        
        if (!slot.available) {
            return;
        }
        
        onTimeSlotSelect(slot);
    };

    /**
     * 슬롯 상태에 따른 CSS 클래스
     */
    const getSlotClassName = (slot) => {
        const classes = ['time-slot'];
        
        if (slot.vacation) classes.push('vacation');
        if (slot.past) classes.push('past');
        if (slot.selected) classes.push('selected');
        if (!slot.available) classes.push('unavailable');
        if (slot.conflict) classes.push('conflict');
        
        return classes.join(' ');
    };

    /**
     * 슬롯 상태 아이콘 (색상 원으로 대체)
     */
    const getSlotIcon = (slot) => {
        if (slot.vacation) return { color: '#ffc107', text: '휴' };
        if (slot.past) return { color: '#6c757d', text: '과' };
        if (slot.selected) return { color: '#28a745', text: '선' };
        if (slot.conflict) return { color: '#dc3545', text: '충' };
        if (!slot.available) return { color: '#6c757d', text: '불' };
        return { color: '#28a745', text: '가' };
    };

    /**
     * 시간대별 그룹핑
     */
    const groupSlotsByHour = () => {
        const grouped = {};
        timeSlots.forEach(slot => {
            const hour = slot.time.split(':')[0];
            if (!grouped[hour]) {
                grouped[hour] = [];
            }
            grouped[hour].push(slot);
        });
        return grouped;
    };

    if (loading) {
        return (
            <div style={{ width: '100%', maxHeight: '500px', overflowY: 'auto' }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '200px' 
                }}>
                    <LoadingSpinner 
                        text="시간 로딩 중..." 
                        size="medium" 
                        variant="pulse"
                        className="loading-spinner-inline"
                    />
                </div>
            </div>
        );
    }

    const groupedSlots = groupSlotsByHour();

    return (
        <div style={{ width: '100%', maxHeight: '500px', overflowY: 'auto' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px', 
                paddingBottom: '12px', 
                borderBottom: '2px solid #e9ecef' 
            }}>
                <h5 style={{ 
                    margin: '0', 
                    color: '#2c3e50', 
                    fontSize: '18px', 
                    fontWeight: '600',
                    fontFamily: 'Noto Sans KR, Malgun Gothic, 맑은 고딕, sans-serif'
                }}>시간 선택</h5>
                <div style={{ 
                    fontSize: '12px', 
                    color: '#6c757d', 
                    backgroundColor: '#f8f9fa', 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontWeight: '500' 
                }}>
                    상담 시간: {duration}분 (휴식 10분 포함)
                </div>
            </div>

            <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginBottom: '16px', 
                padding: '12px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '6px', 
                flexWrap: 'wrap' 
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '12px', 
                    color: '#495057' 
                }}>
                    <span style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#28a745', 
                        borderRadius: '50%',
                        display: 'inline-block'
                    }}></span>
                    <span>사용 가능</span>
                </div>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '12px', 
                    color: '#495057' 
                }}>
                    <span style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#ffc107', 
                        borderRadius: '50%',
                        display: 'inline-block'
                    }}></span>
                    <span>휴가 시간</span>
                </div>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '12px', 
                    color: '#495057' 
                }}>
                    <span style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#dc3545', 
                        borderRadius: '50%',
                        display: 'inline-block'
                    }}></span>
                    <span>충돌</span>
                </div>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '12px', 
                    color: '#495057' 
                }}>
                    <span style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#6c757d', 
                        borderRadius: '50%',
                        display: 'inline-block'
                    }}></span>
                    <span>사용 불가</span>
                </div>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '12px', 
                    color: '#495057' 
                }}>
                    <span style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#28a745', 
                        borderRadius: '50%',
                        display: 'inline-block'
                    }}></span>
                    <span>선택됨</span>
                </div>
            </div>

            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px' 
            }}>
                {Object.keys(groupedSlots)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map(hour => (
                    <div key={hour} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px' 
                    }}>
                        <div style={{ 
                            minWidth: '60px', 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: '#495057', 
                            textAlign: 'center', 
                            backgroundColor: '#e9ecef', 
                            padding: '8px 4px', 
                            borderRadius: '4px' 
                        }}>{hour}:00</div>
                        <div style={{ 
                            display: 'flex', 
                            gap: '8px', 
                            flexWrap: 'wrap' 
                        }}>
                            {groupedSlots[hour].map(slot => {
                                // 인라인 스타일 정의
                                const getSlotStyle = (slot) => {
                                    let baseStyle = {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '12px 8px',
                                        border: '2px solid #e9ecef',
                                        borderRadius: '8px',
                                        backgroundColor: '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        minWidth: '80px',
                                        textAlign: 'center',
                                        position: 'relative',
                                        fontFamily: 'Noto Sans KR, Malgun Gothic, 맑은 고딕, sans-serif'
                                    };

                                    // 상태별 스타일 적용
                                    if (slot.vacation) {
                                        baseStyle.borderColor = '#ffc107';
                                        baseStyle.backgroundColor = '#fff8e1';
                                        baseStyle.cursor = 'not-allowed';
                                    } else if (slot.past) {
                                        baseStyle.backgroundColor = '#e9ecef';
                                        baseStyle.color = '#adb5bd';
                                        baseStyle.cursor = 'not-allowed';
                                        baseStyle.opacity = '0.5';
                                        baseStyle.border = '1px solid #dee2e6';
                                    } else if (slot.selected) {
                                        baseStyle.borderColor = '#28a745';
                                        baseStyle.backgroundColor = '#f8fff9';
                                        baseStyle.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.25)';
                                        baseStyle.transform = 'translateY(-2px)';
                                        baseStyle.fontWeight = '600';
                                    } else if (slot.conflict) {
                                        baseStyle.borderColor = '#dc3545';
                                        baseStyle.backgroundColor = '#fff5f5';
                                    } else if (!slot.available) {
                                        baseStyle.opacity = '0.5';
                                        baseStyle.cursor = 'not-allowed';
                                        baseStyle.backgroundColor = '#f8f9fa';
                                    }

                                    return baseStyle;
                                };

                                const getHoverStyle = (slot) => {
                                    if (slot.vacation || slot.past || !slot.available) {
                                        return {};
                                    }
                                    return {
                                        borderColor: '#007bff',
                                        backgroundColor: '#f8f9ff',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 8px rgba(0, 123, 255, 0.15)'
                                    };
                                };

                                return (
                                    <div
                                        key={slot.id}
                                        style={getSlotStyle(slot)}
                                        onClick={() => handleSlotClick(slot)}
                                        title={`${slot.time} - ${slot.endTime} (${duration}분)`}
                                        role="button"
                                        tabIndex="0"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                handleSlotClick(slot);
                                            }
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!slot.vacation && !slot.past && slot.available) {
                                                Object.assign(e.target.style, getHoverStyle(slot));
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!slot.vacation && !slot.past && slot.available) {
                                                const originalStyle = getSlotStyle(slot);
                                                Object.assign(e.target.style, originalStyle);
                                            }
                                        }}
                                    >
                                        <div style={{ 
                                            width: '20px', 
                                            height: '20px', 
                                            backgroundColor: getSlotIcon(slot).color, 
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '10px',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            lineHeight: '1'
                                        }}>
                                            {getSlotIcon(slot).text}
                                        </div>
                                        <div style={{ 
                                            fontSize: '12px', 
                                            fontWeight: '600', 
                                            color: slot.selected ? '#28a745' : '#495057',
                                            lineHeight: '1'
                                        }}>
                                            {slot.time}
                                        </div>
                                        <div style={{ 
                                            fontSize: '10px', 
                                            color: '#6c757d',
                                            lineHeight: '1'
                                        }}>
                                            {duration}분
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {timeSlots.length === 0 && (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px', 
                    color: '#6c757d' 
                }}>
                    <p style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '16px', 
                        fontWeight: '500' 
                    }}>사용 가능한 시간이 없습니다.</p>
                    <small style={{ 
                        fontSize: '14px', 
                        opacity: '0.8' 
                    }}>상담 시간과 휴식 시간을 고려한 결과입니다.</small>
                </div>
            )}

            {existingSchedules.length > 0 && (
                <div style={{ 
                    marginTop: '20px', 
                    padding: '16px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px', 
                    border: '1px solid #e9ecef' 
                }}>
                    <h6 style={{ 
                        margin: '0 0 12px 0', 
                        color: '#495057', 
                        fontSize: '14px', 
                        fontWeight: '600' 
                    }}>기존 스케줄</h6>
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '8px' 
                    }}>
                        {existingSchedules.map(schedule => (
                            <div key={schedule.id} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '8px 12px', 
                                backgroundColor: '#fff', 
                                borderRadius: '6px', 
                                border: '1px solid #e9ecef', 
                                fontSize: '12px' 
                            }}>
                                <span style={{ 
                                    color: '#007bff', 
                                    fontWeight: '600', 
                                    fontFamily: 'monospace' 
                                }}>
                                    {schedule.startTime} - {schedule.endTime}
                                </span>
                                <span style={{ 
                                    color: '#495057', 
                                    fontWeight: '500' 
                                }}>
                                    {schedule.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSlotGrid;
