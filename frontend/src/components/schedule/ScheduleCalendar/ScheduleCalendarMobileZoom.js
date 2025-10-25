import React from 'react';
import MGButton from '../../common/MGButton';
import { X, Plus, Calendar } from 'lucide-react';

/**
 * 모바일 달력 확대 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ScheduleCalendarMobileZoom = ({ 
    isOpen, 
    date, 
    schedules, 
    onClose, 
    onScheduleClick, 
    onAddSchedule 
}) => {
    if (!isOpen) return null;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    const formatTime = (timeStr) => {
        return timeStr.substring(0, 5);
    };

    return (
        <div className="mg-v2-mobile-zoom-overlay">
            <div className="mg-v2-mobile-zoom-modal">
                <div className="mg-v2-mobile-zoom-header">
                    <h3 className="mg-v2-mobile-zoom-title">
                        <Calendar className="mg-v2-icon" />
                        {formatDate(date)}
                    </h3>
                    <MGButton 
                        variant="text" 
                        size="small"
                        onClick={onClose}
                        className="mg-v2-mobile-zoom-close"
                    >
                        <X className="mg-v2-icon" />
                    </MGButton>
                </div>

                <div className="mg-v2-mobile-zoom-content">
                    {schedules.length === 0 ? (
                        <div className="mg-v2-mobile-zoom-empty">
                            <p className="mg-v2-text-center mg-v2-text-muted">
                                이 날짜에는 일정이 없습니다.
                            </p>
                        </div>
                    ) : (
                        <div className="mg-v2-mobile-zoom-schedules">
                            {schedules.map((schedule) => (
                                <div 
                                    key={schedule.id}
                                    className="mg-v2-mobile-zoom-schedule-item"
                                    onClick={() => onScheduleClick(schedule)}
                                >
                                    <div className="mg-v2-mobile-zoom-schedule-time">
                                        {formatTime(schedule.start)} - {formatTime(schedule.end)}
                                    </div>
                                    <div className="mg-v2-mobile-zoom-schedule-title">
                                        {schedule.title}
                                    </div>
                                    <div className="mg-v2-mobile-zoom-schedule-consultant">
                                        {schedule.extendedProps?.consultantName}
                                    </div>
                                    <div className={`mg-v2-mobile-zoom-schedule-status mg-v2-badge mg-v2-badge--${schedule.extendedProps?.status?.toLowerCase()}`}>
                                        {schedule.extendedProps?.statusKorean}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mg-v2-mobile-zoom-footer">
                    <MGButton 
                        variant="primary"
                        onClick={onAddSchedule}
                        className="mg-v2-mobile-zoom-add-button"
                    >
                        <Plus className="mg-v2-icon" />
                        일정 추가
                    </MGButton>
                </div>
            </div>
        </div>
    );
};

export default ScheduleCalendarMobileZoom;
