/**
 * 스케줄 헤더 컴포넌트 (Presentational)
 * - 순수 UI 컴포넌트
 * - 비즈니스 로직 없음
 * - props로 데이터와 핸들러를 받음
 */
const ScheduleHeader = ({
    userRole,
    consultants,
    selectedConsultantId,
    loadingConsultants,
    onConsultantChange,
    onRefresh
}) => {
    return (
        <div className="mg-v2-schedule-header">
            <h2 className="mg-v2-schedule-title">📅 스케줄 관리</h2>
            <div className="mg-v2-schedule-actions">
                {/* 상담사 선택 (어드민/수퍼어드민만) */}
                {(userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') && (
                    <select
                        value={selectedConsultantId}
                        onChange={onConsultantChange}
                        className="mg-v2-select mg-v2-consultant-filter"
                    >
                        <option value="">👥 전체 상담사</option>
                        {loadingConsultants ? (
                            <option disabled>상담사 목록을 불러오는 중...</option>
                        ) : (
                            consultants.map(consultant => (
                                <option key={consultant.id} value={consultant.id}>
                                    👤 {consultant.name}
                                </option>
                            ))
                        )}
                    </select>
                )}
                
                <button 
                    onClick={onRefresh}
                    className="mg-v2-button mg-v2-button-secondary mg-v2-refresh-button"
                    title="데이터 강제 새로고침"
                >
                    🔄 새로고침
                </button>
            </div>
        </div>
    );
};

export default ScheduleHeader;
