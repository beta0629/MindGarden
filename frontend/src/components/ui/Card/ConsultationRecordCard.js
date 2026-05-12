import PropTypes from 'prop-types';
import StatusBadge from '../../common/StatusBadge';
import SafeText from '../../common/SafeText';

/**
 * 상담 이력 카드 컴포넌트 (mg-v2-card 패턴)
 * ClientConsultationTab 등에서 개별 상담 세션 정보를 표시
 *
 * @author CoreSolution
 * @since 2026-05-12
 */
const ConsultationRecordCard = ({
  id,
  sessionDate,
  sessionNumber,
  sessionDurationMinutes,
  progressScore,
  consultantObservations,
  isSessionCompleted,
  className,
  onClick
}) => (
  <div
    className={`mg-v2-card mg-v2-consultation-card ${className || ''}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
  >
    <div className="mg-v2-card-header">
      <div className="mg-v2-consultation-info">
        <h4 className="mg-v2-h4">상담 #{id}</h4>
        <p className="mg-v2-consultation-date">
          {sessionDate ? new Date(sessionDate).toLocaleDateString('ko-KR') : '날짜 없음'}
        </p>
      </div>
      <div className="mg-v2-consultation-status">
        <StatusBadge variant={isSessionCompleted ? 'success' : 'warning'}>
          {isSessionCompleted ? '완료' : '진행중'}
        </StatusBadge>
      </div>
    </div>
    <div className="mg-v2-card-content">
      <div className="mg-v2-consultation-details">
        <p><span className="mg-v2-form-label">세션 번호</span> <SafeText fallback="N/A">{sessionNumber}</SafeText></p>
        <p><span className="mg-v2-form-label">상담 시간</span>{sessionDurationMinutes ?? 0}분</p>
        {progressScore != null && (
          <p><span className="mg-v2-form-label">진행 점수</span> <SafeText>{progressScore}</SafeText></p>
        )}
        {consultantObservations && (
          <p><span className="mg-v2-form-label">상담 내용</span> <SafeText>{consultantObservations}</SafeText></p>
        )}
      </div>
    </div>
  </div>
);

ConsultationRecordCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sessionDate: PropTypes.string,
  sessionNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sessionDurationMinutes: PropTypes.number,
  progressScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  consultantObservations: PropTypes.string,
  isSessionCompleted: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func
};

ConsultationRecordCard.defaultProps = {
  sessionDate: null,
  sessionNumber: null,
  sessionDurationMinutes: 0,
  progressScore: null,
  consultantObservations: null,
  isSessionCompleted: false,
  className: '',
  onClick: undefined
};

export default ConsultationRecordCard;
