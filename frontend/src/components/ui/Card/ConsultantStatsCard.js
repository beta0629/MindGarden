import React from 'react';
import PropTypes from 'prop-types';
import { StatusBadge } from '../../common';

/**
 * 상담사 상담 완료 통계 카드 컴포넌트
 * - ConsultationCompletionStatsView 그리드에서 사용
 * - 순위, 이름, 등급, 전문분야, 완료/총 건수, 완료율 표시
 *
 * @author CoreSolution
 * @since 2026-05-12
 */
const RANK_TOP_THRESHOLD = 3;

const ConsultantStatsCard = ({
  rank,
  consultantName,
  consultantPhone,
  grade,
  specialization,
  completedCount,
  totalCount,
  completionRate,
  convertGradeToKorean,
  convertSpecialtyToKorean
}) => {
  const rankClass = rank <= RANK_TOP_THRESHOLD
    ? 'mg-v2-consultant-rank-top'
    : 'mg-v2-consultant-rank-normal';

  const getRateColorClass = () => {
    if (completionRate >= 80) return 'mg-v2-stat-number-success';
    if (completionRate >= 60) return 'mg-v2-stat-number-warning';
    return 'mg-v2-stat-number-danger';
  };
  const rateColorClass = getRateColorClass();

  return (
    <div className="mg-v2-card mg-v2-card-clickable">
      <div className="mg-v2-flex mg-align-center mg-justify-between mg-mb-md">
        <div className="mg-v2-consultant-header">
          <div className={`mg-v2-consultant-rank ${rankClass}`}>
            {rank}
          </div>
          <div>
            <div className="mg-v2-consultant-name">
              {consultantName}
            </div>
            <div className="mg-v2-consultant-id">
              {consultantPhone}
            </div>
          </div>
        </div>

        <StatusBadge variant={grade ? 'success' : 'neutral'}>
          {grade ? convertGradeToKorean(grade) : '미설정'}
        </StatusBadge>
      </div>

      <div className="mg-v2-specialty-section">
        <div className="mg-v2-specialty-label">
          전문분야
        </div>
        <div className="mg-v2-specialty-content">
          {specialization ? convertSpecialtyToKorean(specialization) : '미설정'}
        </div>
      </div>

      <div className="mg-v2-stats-grid">
        <div className="mg-v2-stat-item">
          <div className="mg-v2-stat-number mg-v2-stat-number-success">
            {completedCount}
          </div>
          <div className="mg-v2-stat-label">
            완료 건수
          </div>
        </div>

        <div className="mg-v2-text-center">
          <div className="mg-v2-stat-number mg-v2-stat-number-secondary">
            {totalCount}
          </div>
          <div className="mg-v2-text-xs mg-v2-text-secondary mg-v2-font-weight-medium">
            총 건수
          </div>
        </div>

        <div className="mg-v2-stat-item">
          <div className={`mg-v2-stat-number mg-v2-stat-number-rate ${rateColorClass}`}>
            {completionRate}%
          </div>
          <div className="mg-v2-stat-label">
            완료율
          </div>
        </div>
      </div>
    </div>
  );
};

ConsultantStatsCard.propTypes = {
  rank: PropTypes.number.isRequired,
  consultantName: PropTypes.string.isRequired,
  consultantPhone: PropTypes.string,
  grade: PropTypes.string,
  specialization: PropTypes.string,
  completedCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  completionRate: PropTypes.number.isRequired,
  convertGradeToKorean: PropTypes.func.isRequired,
  convertSpecialtyToKorean: PropTypes.func.isRequired
};

ConsultantStatsCard.defaultProps = {
  consultantPhone: '',
  grade: null,
  specialization: null
};

export default ConsultantStatsCard;
