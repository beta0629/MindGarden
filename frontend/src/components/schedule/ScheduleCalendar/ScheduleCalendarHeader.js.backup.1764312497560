import React from 'react';
import MGButton from '../../common/MGButton';
import CustomSelect from '../../common/CustomSelect';
import { Calendar, Users, RefreshCw, Smartphone, Monitor } from 'lucide-react';

/**
 * 스케줄 달력 헤더 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ScheduleCalendarHeader = ({
    currentUserRole,
    consultants,
    selectedConsultantId,
    setSelectedConsultantId,
    loadingConsultants,
    onRefresh,
    isMobile,
    forceMobileMode,
    setForceMobileMode,
    loading
}) => {
    const isAdmin = currentUserRole === 'ADMIN' || 
                    currentUserRole === 'BRANCH_SUPER_ADMIN' || 
                    currentUserRole === 'HQ_MASTER' || 
                    currentUserRole === 'SUPER_HQ_ADMIN';

    return (
        <div className="mg-v2-calendar-header">
            <div className="mg-v2-calendar-header-left">
                <h2 className="mg-v2-calendar-title">
                    <Calendar className="mg-v2-icon" />
                    스케줄 관리
                </h2>
                
                {/* 상담사 필터 (어드민만) */}
                {isAdmin && (
                    <div className="mg-v2-calendar-filter">
                        <label htmlFor="consultant-filter" className="mg-v2-form-label">
                            <Users className="mg-v2-icon" />
                            상담사 필터
                        </label>
                        <CustomSelect
                            id="consultant-filter"
                            value={selectedConsultantId}
                            onChange={setSelectedConsultantId}
                            options={[
                                { value: '', label: '전체 상담사' },
                                ...consultants.map(consultant => ({
                                    value: consultant.id,
                                    label: consultant.name
                                }))
                            ]}
                            loading={loadingConsultants}
                            placeholder="상담사를 선택하세요"
                        />
                    </div>
                )}
            </div>

            <div className="mg-v2-calendar-header-right">
                {/* 모바일 모드 토글 */}
                <MGButton
                    variant="outline"
                    size="small"
                    onClick={() => setForceMobileMode(!forceMobileMode)}
                    className="mg-v2-mobile-toggle"
                >
                    {forceMobileMode ? (
                        <>
                            <Monitor className="mg-v2-icon" />
                            데스크톱 모드
                        </>
                    ) : (
                        <>
                            <Smartphone className="mg-v2-icon" />
                            모바일 모드
                        </>
                    )}
                </MGButton>

                {/* 새로고침 버튼 */}
                <MGButton
                    variant="secondary"
                    size="small"
                    onClick={onRefresh}
                    loading={loading}
                    className="mg-v2-refresh-button"
                >
                    <RefreshCw className="mg-v2-icon" />
                    새로고침
                </MGButton>
            </div>
        </div>
    );
};

export default ScheduleCalendarHeader;
