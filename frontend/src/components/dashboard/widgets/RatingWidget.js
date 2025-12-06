/**
 * Rating Widget - 표준화된 위젯
/**
 * 평점을 표시하는 위젯
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (표준화 업그레이드)
/**
 * @since 2025-11-21
 */

import React, { useState } from 'react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import './Widget.css';

const RatingWidget = ({ widget, user }) => {
  // 표준화된 위젯 훅 사용
  const {
    data,
    loading,
    error,
    hasData,
    isEmpty,
    refresh,
    formatValue
  } = useWidget(widget, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  const config = widget.config || {};
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const maxRating = config.maxRating || 5;
  const allowUserRating = config.allowUserRating || false;
  const showAverage = config.showAverage !== false; // 기본값 true

  // 별점 렌더링
  const renderStars = (rating, interactive = false, onStarClick = null, onStarHover = null) => {
    const stars = [];
    const displayRating = interactive ? (hoveredRating || userRating) : rating;

    for (let i = 1; i <= maxRating; i++) {
      const filled = i <= displayRating;
      const halfFilled = !filled && i - 0.5 <= displayRating;

      stars.push(
        <span
          key={i}
          className={`rating-star ${filled ? 'filled' : ''} ${halfFilled ? 'half-filled' : ''} ${interactive ? 'interactive' : ''}`}
          onClick={() => interactive && onStarClick && onStarClick(i)}
          onMouseEnter={() => interactive && onStarHover && onStarHover(i)}
          onMouseLeave={() => interactive && onStarHover && onStarHover(0)}
        >
          <i className={`bi bi-star${filled ? '-fill' : ''}`}></i>
        </span>
      );
    }

    return <div className="rating-stars">{stars}</div>;
  };

  // 사용자 평점 제출
  const handleRatingSubmit = async (rating) => {
    if (!config.submitUrl || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(config.submitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rating,
          userId: user?.id,
          targetId: config.targetId,
          targetType: config.targetType
        })
      });

      if (response.ok) {
        setUserRating(rating);
        refresh(); // 데이터 새로고침
      } else {
        throw new Error('평점 제출 실패');
      }
    } catch (err) {
      console.error('평점 제출 오류:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // 평점 통계 렌더링
  const renderRatingStats = () => {
    if (!hasData || !data) return null;

    const stats = Array.isArray(data) ? data[0] : data;
    const average = stats.average || stats.rating || 0;
    const count = stats.count || stats.totalRatings || 0;
    const distribution = stats.distribution || [];

    return (
      <div className="rating-stats">
        {showAverage && (
          <div className="rating-average">
            <div className="average-score">
              <span className="score-number">{average.toFixed(1)}</span>
              <span className="score-max">/ {maxRating}</span>
            </div>
            {renderStars(average)}
            <div className="rating-count">
              {count}개의 평가
            </div>
          </div>
        )}

        {distribution.length > 0 && (
          <div className="rating-distribution">
            <h5>평점 분포</h5>
            {distribution.map((item, index) => (
              <div key={index} className="distribution-item">
                <span className="distribution-stars">
                  {item.rating || (maxRating - index)}점
                </span>
                <div className="distribution-bar">
                  <div 
                    className="distribution-fill"
                    style={{ width: `${(item.count / count) * 100}%` }}
                  ></div>
                </div>
                <span className="distribution-count">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 사용자 평점 입력 렌더링
  const renderUserRating = () => {
    if (!allowUserRating) return null;

    return (
      <div className="user-rating">
        <h5>평점을 남겨주세요</h5>
        <div className="rating-input">
          {renderStars(
            userRating,
            true,
            handleRatingSubmit,
            setHoveredRating
          )}
          {userRating > 0 && (
            <div className="rating-text">
              {userRating}점 / {maxRating}점
            </div>
          )}
        </div>
        {submitting && (
          <div className="rating-submitting">
            평점 제출 중...
          </div>
        )}
      </div>
    );
  };

  // 평점 위젯 렌더링
  const renderRatingContent = () => {
    if (isEmpty && !allowUserRating) {
      return (
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
          표시할 평점이 없습니다.
        </div>
      );
    }

    return (
      <div className="rating-container">
        {renderRatingStats()}
        {renderUserRating()}
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty && !allowUserRating}
      onRefresh={refresh}
      title={widget.config?.title || WIDGET_CONSTANTS.DEFAULT_TITLES.RATING}
      subtitle={widget.config?.subtitle || ''}
    >
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {renderRatingContent()}
      </div>
    </BaseWidget>
  );
};

export default RatingWidget;