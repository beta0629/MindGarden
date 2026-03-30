/**
 * 스케줄 헤더 컴포넌트 (Presentational)
 * B0KlA 스타일, 매핑 리스트 헤더와 동일한 레이아웃 패턴
 *
 * @author Core Solution
 * @since 2025-02-22
 */
import PropTypes from 'prop-types';
import { Calendar, RefreshCw } from 'lucide-react';
import { toDisplayString } from '../../../utils/safeDisplay';

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
      <div className="mg-v2-schedule-header__title">
        <Calendar size={20} className="mg-v2-schedule-header__icon" />
        <h2 className="mg-v2-schedule-title">스케줄 관리</h2>
      </div>
      <div className="mg-v2-schedule-header__actions">
        {(userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') && (
          <select
            value={selectedConsultantId}
            onChange={onConsultantChange}
            className="mg-v2-schedule-header__select"
            aria-label="상담사 필터"
          >
            <option value="">전체 상담사</option>
            {loadingConsultants ? (
              <option disabled>상담사 목록을 불러오는 중...</option>
            ) : (
              consultants.map(consultant => (
                <option key={consultant.id} value={consultant.id}>
                  {toDisplayString(consultant.name, '—')}
                </option>
              ))
            )}
          </select>
        )}
        <button
          type="button"
          onClick={onRefresh}
          className="mg-v2-schedule-header__refresh"
          title="데이터 새로고침"
          aria-label="새로고침"
        >
          <RefreshCw size={16} />
          새로고침
        </button>
      </div>
    </div>
  );
};

ScheduleHeader.propTypes = {
  userRole: PropTypes.string,
  consultants: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object])
  })),
  selectedConsultantId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  loadingConsultants: PropTypes.bool,
  onConsultantChange: PropTypes.func,
  onRefresh: PropTypes.func
};

export default ScheduleHeader;
