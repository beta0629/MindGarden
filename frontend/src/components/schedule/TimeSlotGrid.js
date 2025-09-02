import React, { useState, useEffect } from 'react';
import './TimeSlotGrid.css';

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
    duration = 50, 
    onTimeSlotSelect, 
    selectedTimeSlot 
}) => {
    const [timeSlots, setTimeSlots] = useState([]);
    const [existingSchedules, setExistingSchedules] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        generateTimeSlots();
        if (consultantId && date) {
            loadExistingSchedules();
        }
    }, [date, consultantId, duration]);

    /**
     * 시간 슬롯 생성
     */
    const generateTimeSlots = () => {
        const slots = [];
        const startHour = 9;
        const endHour = 18;
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const endTime = calculateEndTime(timeString, duration);
                
                // 업무 시간 내에서만 종료되는 슬롯만 추가
                if (isWithinBusinessHours(endTime)) {
                    slots.push({
                        id: `slot-${timeString}`,
                        time: timeString,
                        endTime: endTime,
                        duration: duration,
                        available: true,
                        conflict: false
                    });
                }
            }
        }
        setTimeSlots(slots);
    };

    /**
     * 기존 스케줄 로드
     */
    const loadExistingSchedules = async () => {
        setLoading(true);
        try {
            // 날짜를 로컬 시간대로 처리하여 시간대 변환 문제 방지
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
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

            if (response.ok) {
                const schedules = await response.json();
                setExistingSchedules(schedules);
                updateSlotAvailability(schedules);
            }
        } catch (error) {
            console.error('기존 스케줄 로드 실패:', error);
        } finally {
            setLoading(false);
        }
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
     * 종료 시간 계산
     */
    const calculateEndTime = (startTime, durationMinutes) => {
        const [hour, minute] = startTime.split(':').map(Number);
        const totalMinutes = hour * 60 + minute + durationMinutes + 10; // 10분 휴식 시간 추가
        
        const endHour = Math.floor(totalMinutes / 60);
        const endMinute = totalMinutes % 60;
        
        return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    };

    /**
     * 업무 시간 내 확인
     */
    const isWithinBusinessHours = (timeString) => {
        const [hour] = timeString.split(':').map(Number);
        return hour >= 9 && hour <= 18;
    };

    /**
     * 시간 슬롯 클릭 핸들러
     */
    const handleSlotClick = (slot) => {
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
        
        if (!slot.available) classes.push('unavailable');
        if (slot.conflict) classes.push('conflict');
        if (selectedTimeSlot?.id === slot.id) classes.push('selected');
        
        return classes.join(' ');
    };

    /**
     * 슬롯 상태 아이콘
     */
    const getSlotIcon = (slot) => {
        if (slot.conflict) return '❌';
        if (!slot.available) return '🚫';
        if (selectedTimeSlot?.id === slot.id) return '✅';
        return '🕐';
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
            <div className="time-slot-grid">
                <div className="loading-time-slots">
                    <div className="loading-spinner">시간 로딩 중...</div>
                </div>
            </div>
        );
    }

    const groupedSlots = groupSlotsByHour();

    return (
        <div className="time-slot-grid">
            <div className="grid-header">
                <h5>시간 선택</h5>
                <div className="duration-info">
                    상담 시간: {duration}분 (휴식 10분 포함)
                </div>
            </div>

            <div className="time-legend">
                <div className="legend-item">
                    <span className="legend-icon">🕐</span>
                    <span>사용 가능</span>
                </div>
                <div className="legend-item">
                    <span className="legend-icon">❌</span>
                    <span>충돌</span>
                </div>
                <div className="legend-item">
                    <span className="legend-icon">🚫</span>
                    <span>사용 불가</span>
                </div>
                <div className="legend-item">
                    <span className="legend-icon">✅</span>
                    <span>선택됨</span>
                </div>
            </div>

            <div className="slots-container">
                {Object.keys(groupedSlots).map(hour => (
                    <div key={hour} className="hour-group">
                        <div className="hour-label">{hour}:00</div>
                        <div className="slots-row">
                            {groupedSlots[hour].map(slot => (
                                <div
                                    key={slot.id}
                                    className={getSlotClassName(slot)}
                                    onClick={() => handleSlotClick(slot)}
                                    title={`${slot.time} - ${slot.endTime} (${duration}분)`}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            handleSlotClick(slot);
                                        }
                                    }}
                                >
                                    <div className="slot-icon">
                                        {getSlotIcon(slot)}
                                    </div>
                                    <div className="slot-time">
                                        {slot.time}
                                    </div>
                                    <div className="slot-duration">
                                        {duration}분
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {timeSlots.length === 0 && (
                <div className="no-slots">
                    <p>사용 가능한 시간이 없습니다.</p>
                    <small>상담 시간과 휴식 시간을 고려한 결과입니다.</small>
                </div>
            )}

            {existingSchedules.length > 0 && (
                <div className="existing-schedules">
                    <h6>기존 스케줄</h6>
                    <div className="schedule-list">
                        {existingSchedules.map(schedule => (
                            <div key={schedule.id} className="existing-schedule">
                                <span className="schedule-time">
                                    {schedule.startTime} - {schedule.endTime}
                                </span>
                                <span className="schedule-title">
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
