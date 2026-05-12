import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '../../common/Avatar';
import SafeText from '../../common/SafeText';

/**
 * 우수 상담사 평점 카드 컴포넌트
 * - AdminDashboard 우수 상담사 평점 목록에서 사용
 * - 아바타, 이름, 평점 바 표시
 *
 * @author CoreSolution
 * @since 2026-05-12
 */
const ConsultantRatingCard = ({ profileImageUrl, name, rating, barWidth, barColor }) => (
  <div className="mg-v2-ad-b0kla__counselor-item">
    <Avatar
      profileImageUrl={profileImageUrl}
      displayName={name}
      className="mg-v2-ad-b0kla__counselor-avatar mg-v2-ad-b0kla__counselor-avatar--green"
    />
    <div className="mg-v2-ad-b0kla__counselor-data">
      <span className="mg-v2-ad-b0kla__counselor-name">
        <SafeText>{name}</SafeText>
      </span>
      <div className="mg-v2-ad-b0kla__counselor-rating-row">
        <span className="mg-v2-ad-b0kla__counselor-rating">
          <SafeText>{rating}</SafeText>
        </span>
        <div className="mg-v2-ad-b0kla__counselor-bar-track">
          <div
            className="mg-v2-ad-b0kla__counselor-bar-fill"
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
  barColor: PropTypes.string
};

ConsultantRatingCard.defaultProps = {
  profileImageUrl: null,
  rating: null,
  barWidth: 0,
  barColor: undefined
};

export default ConsultantRatingCard;
