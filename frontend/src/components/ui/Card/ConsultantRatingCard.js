import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '../../common/Avatar';
import SafeText from '../../common/SafeText';
import './ConsultantRatingCard.css';

/**
 * 우수 상담사 평점 카드 컴포넌트
 * - AdminDashboard 우수 상담사 평점 목록에서 사용
 * - 아바타, 이름, 평점 바 표시
 *
 * @author CoreSolution
 * @since 2026-05-12
 */
const ConsultantRatingCard = ({ profileImageUrl, name, rating, barWidth, barColor, className, onClick }) => (
  <div
    className={`mg-v2-consultant-rating-card ${className || ''}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
  >
    <Avatar
      profileImageUrl={profileImageUrl}
      displayName={name}
      className="mg-v2-consultant-rating-card__avatar mg-v2-consultant-rating-card__avatar--accent"
    />
    <div className="mg-v2-consultant-rating-card__data">
      <span className="mg-v2-consultant-rating-card__name">
        <SafeText>{name}</SafeText>
      </span>
      <div className="mg-v2-consultant-rating-card__rating-row">
        <span className="mg-v2-consultant-rating-card__rating">
          <SafeText>{rating}</SafeText>
        </span>
        <div className="mg-v2-consultant-rating-card__bar-track">
          <div
            className="mg-v2-consultant-rating-card__bar-fill"
            style={{ width: `${barWidth}%`, backgroundColor: barColor }}
          />
        </div>
      </div>
    </div>
  </div>
);

ConsultantRatingCard.propTypes = {
  profileImageUrl: PropTypes.string,
  name: PropTypes.string.isRequired,
  rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  barWidth: PropTypes.number,
  barColor: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func
};

ConsultantRatingCard.defaultProps = {
  profileImageUrl: null,
  rating: null,
  barWidth: 0,
  barColor: undefined,
  className: '',
  onClick: undefined
};

export default ConsultantRatingCard;
