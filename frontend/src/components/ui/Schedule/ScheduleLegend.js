/**
 * 스케줄 범례 컴포넌트 (Presentational)
 * - 순수 UI 컴포넌트
 * - 비즈니스 로직 없음
 * - props로 데이터를 받음
 * - 주요 상태만 간소화하여 표시
 */
const ScheduleLegend = ({
    consultants,
    events,
    scheduleStatusOptions,
    getConsultantColor
}) => {
    // 실제 스케줄이 있는 상담사만 필터링 (최대 5명까지만 표시)
    const activeConsultants = consultants
        .filter(consultant => 
            consultant.isActive !== false && 
            events.some(event => event.extendedProps?.consultantId === consultant.id)
        )
        .slice(0, 5);
    
    // 주요 상태만 필터링 (확인됨, 결제확인, 완료, 취소됨 등)
    const mainStatuses = scheduleStatusOptions?.filter(option => 
        ['확인됨', '결제확인', '완료', '취소됨', '승인됨'].includes(option.label)
    ) || [];
    
    return (
        <div className="mg-v2-schedule-legend">
            {/* 상담사가 있을 때만 표시 */}
            {activeConsultants.length > 0 && (
                <div className="mg-v2-legend-section">
                    <div className="mg-v2-legend-title">👥 상담사</div>
                    <div className="mg-v2-legend-items mg-v2-consultant-legend">
                        {activeConsultants.map((consultant, index) => (
                            <div key={`consultant-${consultant.id}-${index}`} className="mg-v2-legend-item">
                                <span 
                                    className="mg-v2-legend-color" 
                                    style={{ backgroundColor: getConsultantColor(consultant.id) }}
                                ></span>
                                <span className="mg-v2-legend-text">{consultant.name}</span>
                            </div>
                        ))}
                        {consultants.length > 5 && (
                            <span className="mg-v2-legend-more">외 {consultants.length - 5}명</span>
                        )}
                    </div>
                </div>
            )}
            
            {/* 주요 상태만 표시 - 오른쪽에 위치 */}
            {mainStatuses.length > 0 && (
                <div className="mg-v2-legend-section mg-v2-legend-section-right">
                    <div className="mg-v2-legend-title">📋 주요 상태</div>
                    <div className="mg-v2-legend-items">
                        {mainStatuses.map((option, index) => (
                            <div key={option.value || `status-${index}`} className="mg-v2-legend-item">
                                <span 
                                    className="mg-v2-legend-color" 
                                    style={{ backgroundColor: option.color }}
                                ></span>
                                <span className="mg-v2-legend-text">{option.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleLegend;
