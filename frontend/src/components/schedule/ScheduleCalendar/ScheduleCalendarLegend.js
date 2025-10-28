import React from 'react';
import { Users, Calendar, Clock } from 'lucide-react';

/**
 * 스케줄 달력 범례 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ScheduleCalendarLegend = ({ 
    scheduleStatusOptions, 
    consultants, 
    getConsultantColor 
}) => {
    return (
        <div className="mg-v2-calendar-legend">
            {/* 상태 범례 */}
            <div className="mg-v2-legend-section">
                <h4 className="mg-v2-legend-title">
                    <Clock className="mg-v2-icon" />
                    일정 상태
                </h4>
                <div className="mg-v2-legend-items">
                    {scheduleStatusOptions.map((status) => (
                        <div key={status.value} className="mg-v2-legend-item">
                            <span 
                                className="mg-v2-legend-color"
                                style={{ '--legend-color': status.color }}
                            ></span>
                            <span className="mg-v2-legend-label">
                                {status.icon} {status.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 상담사 범례 */}
            {consultants.length > 0 && (
                <div className="mg-v2-legend-section">
                    <h4 className="mg-v2-legend-title">
                        <Users className="mg-v2-icon" />
                        상담사별 색상
                    </h4>
                    <div className="mg-v2-consultant-legend">
                        {consultants.slice(0, 10).map((consultant) => (
                            <div key={consultant.id} className="mg-v2-consultant-legend-item">
                                <span 
                                    className="mg-v2-consultant-color"
                                    style={{ '--consultant-color': getConsultantColor(consultant.id) }}
                                ></span>
                                <span className="mg-v2-consultant-name">
                                    {consultant.name}
                                </span>
                            </div>
                        ))}
                        {consultants.length > 10 && (
                            <div className="mg-v2-consultant-more">
                                +{consultants.length - 10}명 더
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleCalendarLegend;
