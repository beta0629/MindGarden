import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ScheduleModal from './ScheduleModal';
import ScheduleDetailModal from './ScheduleDetailModal';
import './ScheduleCalendar.css';

/**
 * FullCalendar 기반 스케줄 관리 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ScheduleCalendar = ({ userRole, userId }) => {
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedInfo, setSelectedInfo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [loading, setLoading] = useState(false);

    /**
     * 상태값을 한글로 변환
     */
    const convertStatusToKorean = (status) => {
        const statusMap = {
            'BOOKED': '예약됨',
            'CONFIRMED': '확정됨',
            'IN_PROGRESS': '진행중',
            'COMPLETED': '완료됨',
            'CANCELLED': '취소',
            'BLOCKED': '차단됨'
        };
        return statusMap[status] || status || "알 수 없음";
    };

    /**
     * 스케줄 데이터 로드
     */
    const loadSchedules = useCallback(async () => {
        setLoading(true);
        try {
            console.log('📅 스케줄 로드 시작:', { userId, userRole });
            
            // 실제 API 호출 (캐시 방지를 위해 timestamp 추가)
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/schedules?userId=${userId}&userRole=${userRole}&_t=${timestamp}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('📅 API 응답 데이터:', responseData);
                
                // API 응답 구조에 따라 데이터 추출
                const schedules = responseData.data || responseData;
                
                if (!Array.isArray(schedules)) {
                    console.error('스케줄 데이터가 배열이 아닙니다:', schedules);
                    setEvents([]);
                    return;
                }
                
                const calendarEvents = schedules.map(schedule => ({
                    id: schedule.id,
                    title: schedule.title,
                    start: `${schedule.date}T${schedule.startTime}`,
                    end: `${schedule.date}T${schedule.endTime}`,
                    backgroundColor: getConsultantColor(schedule.consultantId),
                    borderColor: getConsultantColor(schedule.consultantId),
                    className: `schedule-event status-${schedule.status?.toLowerCase()}`,
                    extendedProps: {
                        id: schedule.id,
                        consultantId: schedule.consultantId,
                        consultantName: schedule.consultantName,
                        clientId: schedule.clientId,
                        clientName: schedule.clientName,
                        status: schedule.status,
                        statusKorean: convertStatusToKorean(schedule.status),
                        type: schedule.scheduleType,
                        consultationType: schedule.consultationType,
                        description: schedule.description
                    }
                }));
                setEvents(calendarEvents);
                console.log('📅 스케줄 로드 완료 (실제 API)');
            } else {
                console.error('스케줄 API 응답 오류:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('스케줄 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, userRole]);

    // 스케줄 데이터 로드
    useEffect(() => {
        loadSchedules();
    }, [loadSchedules]);

    /**
     * 상담사별 색상 반환
     */
    const getConsultantColor = (consultantId) => {
        const colors = [
            '#3b82f6', // 파란색
            '#10b981', // 녹색
            '#f59e0b', // 주황색
            '#ef4444', // 빨간색
            '#8b5cf6', // 보라색
            '#06b6d4', // 청록색
            '#84cc16', // 라임색
            '#f97316', // 오렌지색
            '#ec4899', // 핑크색
            '#6366f1'  // 인디고색
        ];
        
        // 상담사 ID를 기반으로 일관된 색상 할당
        const colorIndex = consultantId % colors.length;
        return colors[colorIndex];
    };



    /**
     * 상담 유형을 한글로 변환
     */
    const convertConsultationTypeToKorean = (consultationType) => {
        const typeMap = {
            'INDIVIDUAL': '개인상담',
            'COUPLE': '부부상담',
            'FAMILY': '가족상담',
            'INITIAL': '초기상담',
            'GROUP': '그룹상담'
        };
        return typeMap[consultationType] || consultationType || "알 수 없음";
    };

    /**
     * 스케줄 상태에 따른 색상 반환
     */
    const getEventColor = (status) => {
        switch (status) {
            case 'BOOKED':
                return '#007bff'; // 파란색 - 예약됨
            case 'IN_PROGRESS':
                return '#28a745'; // 초록색 - 진행중
            case 'COMPLETED':
                return '#6c757d'; // 회색 - 완료
            case 'CANCELLED':
                return '#dc3545'; // 빨간색 - 취소
            case 'BLOCKED':
                return '#ffc107'; // 노란색 - 차단
            default:
                return '#007bff';
        }
    };

    /**
     * 날짜 클릭 이벤트 핸들러
     */
    const handleDateClick = (info) => {
        console.log('📅 날짜 클릭:', info.dateStr);
        
        // 관리자 또는 상담사만 스케줄 생성 가능
        if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'CONSULTANT') {
            setSelectedDate(info.date);
            setSelectedInfo(info);
            setIsModalOpen(true);
        } else {
            alert('스케줄 생성 권한이 없습니다.');
        }
    };

    /**
     * 기존 이벤트 클릭 이벤트 핸들러
     */
    const handleEventClick = (info) => {
        console.log('📋 이벤트 클릭:', info.event.title);
        console.log('📋 이벤트 extendedProps:', info.event.extendedProps);
        console.log('📋 상담 유형 원본:', info.event.extendedProps.consultationType);
        
        const event = info.event;
        const koreanStatus = event.extendedProps.statusKorean || convertStatusToKorean(event.extendedProps.status);
        const koreanConsultationType = convertConsultationTypeToKorean(event.extendedProps.consultationType);
        const consultantName = event.extendedProps.consultantName || `상담사 ${event.extendedProps.consultantId}`;
        const clientName = event.extendedProps.clientName || `클라이언트 ${event.extendedProps.clientId}`;

        console.log('📋 변환된 상담 유형:', koreanConsultationType);

        // 스케줄 상세 정보 설정
        const scheduleData = {
            id: event.extendedProps.id,
            title: event.title,
            consultantName: consultantName,
            clientName: clientName,
            consultationType: koreanConsultationType,
            startTime: event.start.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            endTime: event.end.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            status: koreanStatus
        };

        setSelectedSchedule(scheduleData);
        setIsDetailModalOpen(true);
    };

    /**
     * 이벤트 드래그 앤 드롭 핸들러
     */
    const handleEventDrop = async (info) => {
        console.log('🔄 이벤트 이동:', info.event.title);
        
        const event = info.event;
        const newStart = event.start;
        const newEnd = event.end;

        try {
            const response = await fetch(`/api/schedules/${event.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: newStart.toISOString().split('T')[0],
                    startTime: newStart.toTimeString().split(' ')[0].slice(0, 5),
                    endTime: newEnd.toTimeString().split(' ')[0].slice(0, 5)
                })
            });

            if (!response.ok) {
                // 실패 시 원래 위치로 되돌리기
                info.revert();
                alert('스케줄 이동에 실패했습니다.');
            } else {
                console.log('✅ 스케줄 이동 완료');
            }
        } catch (error) {
            console.error('스케줄 이동 오류:', error);
            info.revert();
            alert('스케줄 이동 중 오류가 발생했습니다.');
        }
    };

    /**
     * 모달 닫기
     */
    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedDate(null);
        setSelectedInfo(null);
    };

    /**
     * 스케줄 생성 완료 후 콜백
     */
    const handleScheduleCreated = async () => {
        console.log('🔄 스케줄 생성 완료 - 캘린더 새로고침 시작');
        await loadSchedules(); // 스케줄 목록 새로고침
        handleModalClose();
        console.log('✅ 캘린더 새로고침 완료');
    };

    /**
     * 상세 모달 닫기 핸들러
     */
    const handleDetailModalClose = () => {
        setIsDetailModalOpen(false);
        setSelectedSchedule(null);
    };

    /**
     * 스케줄 업데이트 후 처리
     */
    const handleScheduleUpdated = () => {
        loadSchedules(); // 스케줄 목록 새로고침
    };

    /**
     * 강제 새로고침 함수
     */
    const forceRefresh = useCallback(async () => {
        console.log('🔄 강제 새로고침 시작');
        setEvents([]); // 이벤트 초기화
        await loadSchedules(); // 데이터 다시 로드
        console.log('✅ 강제 새로고침 완료');
    }, [loadSchedules]);

    return (
        <div className="schedule-calendar">
            <div className="calendar-header">
                <h2>📅 스케줄 관리</h2>
                <div className="header-actions">
                    <button 
                        onClick={forceRefresh}
                        className="refresh-button"
                        title="데이터 강제 새로고침"
                    >
                        🔄 새로고침
                    </button>
                </div>
                <div className="calendar-legend">
                    <div className="legend-section">
                        <div className="legend-title">상담사별 색상</div>
                        <div className="legend-items consultant-legend">
                            {events.reduce((acc, event) => {
                                const consultantId = event.extendedProps.consultantId;
                                const consultantName = event.extendedProps.consultantName || `상담사 ${consultantId}`;
                                if (!acc.find(item => item.id === consultantId)) {
                                    acc.push({
                                        id: consultantId,
                                        name: consultantName,
                                        color: getConsultantColor(consultantId)
                                    });
                                }
                                return acc;
                            }, []).map(consultant => (
                                <div key={consultant.id} className="legend-item">
                                    <span 
                                        className="legend-color" 
                                        style={{ backgroundColor: consultant.color }}
                                    ></span>
                                    <span>{consultant.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="legend-section">
                        <div className="legend-title">스케줄 상태</div>
                        <div className="legend-items">
                            <div className="legend-item">
                                <span className="legend-color available"></span>
                                <span>예약 가능</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color booked"></span>
                                <span>예약됨</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color in-progress"></span>
                                <span>진행중</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color completed"></span>
                                <span>완료</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color cancelled"></span>
                                <span>취소</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color blocked"></span>
                                <span>차단</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner">로딩 중...</div>
                </div>
            )}

            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                initialView="timeGridWeek"
                locale="ko"
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                events={events}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                editable={userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'}
                droppable={userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'}
                height="auto"
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                slotDuration="00:30:00"
                scrollTime="09:00:00"
                scrollTimeReset={false}
                allDaySlot={false}
                businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5], // 월-금
                    startTime: '09:00',
                    endTime: '18:00'
                }}
                expandRows={true}
                stickyHeaderDates={true}
                eventDisplay="block"
                displayEventTime={true}
                displayEventEnd={true}
            />

            {/* 스케줄 생성/수정 모달 */}
            {isModalOpen && (
                <ScheduleModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    selectedDate={selectedDate}
                    selectedInfo={selectedInfo}
                    userRole={userRole}
                    userId={userId}
                    onScheduleCreated={handleScheduleCreated}
                />
            )}

            {/* 스케줄 상세 정보 모달 */}
            {isDetailModalOpen && (
                <ScheduleDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={handleDetailModalClose}
                    scheduleData={selectedSchedule}
                    onScheduleUpdated={handleScheduleUpdated}
                />
            )}
        </div>
    );
};

export default ScheduleCalendar;

// CSS 스타일
const styles = `
.schedule-calendar {
    padding: 20px;
    background: #f8fafc;
    min-height: 100vh;
}

.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;
}

.header-actions {
    display: flex;
    gap: 10px;
}

.refresh-button {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.refresh-button:hover {
    background: #2563eb;
    transform: translateY(-1px);
}

.refresh-button:active {
    background: #1d4ed8;
    transform: translateY(0);
}

.calendar-header h2 {
    color: #1e293b;
    margin: 0;
    font-size: 24px;
    font-weight: 600;
}

.calendar-legend {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
}

.legend-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.legend-title {
    font-size: 14px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 5px;
}

.legend-items {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}

.consultant-legend {
    max-width: 400px;
    flex-wrap: wrap;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #64748b;
}

.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
}

.legend-color.available { background-color: #e5e7eb; }
.legend-color.booked { background-color: #3b82f6; }
.legend-color.in-progress { background-color: #10b981; }
.legend-color.completed { background-color: #6b7280; }
.legend-color.cancelled { background-color: #ef4444; }
.legend-color.blocked { background-color: #f59e0b; }

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.loading-spinner {
    background: white;
    padding: 20px 30px;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    font-size: 16px;
    color: #374151;
}

/* FullCalendar 커스터마이징 */
.fc {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.fc-toolbar {
    padding: 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.fc-toolbar-title {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
}

.fc-button {
    background: #3b82f6;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    transition: all 0.2s;
}

.fc-button:hover {
    background: #2563eb;
    transform: translateY(-1px);
}

.fc-button:active {
    background: #1d4ed8;
    transform: translateY(0);
}

.fc-button-primary:not(:disabled):active,
.fc-button-primary:not(:disabled).fc-button-active {
    background: #1d4ed8;
    border-color: #1d4ed8;
}

.fc-daygrid-event {
    border-radius: 4px;
    border: none;
    padding: 2px 6px;
    font-size: 12px;
    font-weight: 500;
}

.fc-timegrid-event {
    border-radius: 4px;
    border: none;
    padding: 2px 6px;
    font-size: 12px;
    font-weight: 500;
}

.fc-event-title {
    font-weight: 500;
}

.fc-timegrid-slot {
    height: 40px;
}

.fc-timegrid-slot-label {
    font-size: 12px;
    color: #64748b;
}

.fc-daygrid-day-number {
    font-weight: 500;
    color: #374151;
}

.fc-day-today {
    background-color: #fef3c7;
}

.fc-day-today .fc-daygrid-day-number {
    color: #d97706;
    font-weight: 600;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
    .calendar-header {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .calendar-legend {
        width: 100%;
        gap: 20px;
    }
    
    .legend-items {
        gap: 10px;
    }
    
    .consultant-legend {
        max-width: 100%;
    }
    
    .fc-toolbar {
        padding: 15px;
    }
    
    .fc-toolbar-title {
        font-size: 18px;
    }
    
    .fc-button {
        padding: 6px 12px;
        font-size: 12px;
    }
}
`;

// 스타일을 DOM에 추가
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
