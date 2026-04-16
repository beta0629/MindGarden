import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import CustomSelect from '../../common/CustomSelect';
import { ICONS } from '../../../constants/icons';

const CalendarIcon = ICONS.CALENDAR;
const UsersIcon = ICONS.USERS;
const RefreshCwIcon = ICONS.REFRESH_CW;
const SmartphoneIcon = ICONS.SMARTPHONE;
const MonitorIcon = ICONS.MONITOR;

/**
 * 스케줄 달력 헤더 컴포넌트
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
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
    const isAdmin = currentUserRole === 'ADMIN';

    return (
        <div className="mg-v2-calendar-header">
            <div className="mg-v2-calendar-header-left">
                <h2 className="mg-v2-calendar-title">
                    <CalendarIcon className="mg-v2-icon" />
                    스케줄 관리
                </h2>
                
                {/* 상담사 필터 (어드민만) */}
                {isAdmin && (
                    <div className="mg-v2-calendar-filter">
                        <label htmlFor="consultant-filter" className="mg-v2-form-label">
                            <UsersIcon className="mg-v2-icon" />
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
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'sm',
                      loading: false,
                      className: 'mg-v2-mobile-toggle'
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => setForceMobileMode(!forceMobileMode)}
                    preventDoubleClick={false}
                >
                    {forceMobileMode ? (
                        <>
                            <MonitorIcon className="mg-v2-icon" />
                            데스크톱 모드
                        </>
                    ) : (
                        <>
                            <SmartphoneIcon className="mg-v2-icon" />
                            모바일 모드
                        </>
                    )}
                </MGButton>

                {/* 새로고침 버튼 */}
                <MGButton
                    variant="secondary"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'secondary',
                      size: 'sm',
                      loading,
                      className: 'mg-v2-refresh-button'
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={onRefresh}
                    loading={loading}
                    preventDoubleClick={false}
                >
                    <RefreshCwIcon className="mg-v2-icon" />
                    새로고침
                </MGButton>
            </div>
        </div>
    );
};

export default ScheduleCalendarHeader;
