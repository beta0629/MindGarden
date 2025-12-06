/**
 * Rating Widget
/**
 * 평가 통계를 표시하는 범용 위젯
/**
 * ConsultantRatingDisplay, RatableConsultationsSection을 기반으로 범용화
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../utils/ajax';
// import UnifiedLoading from '../../../components/common/UnifiedLoading'; // 임시 비활성화
import './Widget.css';

const RatingWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [ratingStats, setRatingStats] = useState(null);
  const [ratableItems, setRatableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const mode = config.mode || 'display'; // 'display' (평가 표시) or 'rate' (평가하기)
  const targetId = user?.id || config.targetId;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url && targetId) {
      if (mode === 'display') {
        loadRatingStats();
      } else {
        loadRatableItems();
      }
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(
          mode === 'display' ? loadRatingStats : loadRatableItems,
          dataSource.refreshInterval
        );
        return () => clearInterval(interval);
      }
    } else if (config.ratingStats) {
      setRatingStats(config.ratingStats);
      setLoading(false);
    } else if (config.ratableItems) {
      setRatableItems(config.ratableItems);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [targetId, mode]);
  
  const loadRatingStats = async () => {
    try {
      setLoading(true);
      
      const url = dataSource.url || `/api/ratings/${targetId}/stats`;
      const response = await apiGet(url);
      
      if (response && response.data) {
        setRatingStats(response.data);
      }
    } catch (err) {
      console.error('RatingWidget 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadRatableItems = async () => {
    try {
      setLoading(true);
      
      const url = dataSource.url || `/api/ratings/${targetId}/ratable-items`;
      const response = await apiGet(url);
      
      if (response && response.data) {
        setRatableItems(response.data);
      }
    } catch (err) {
      console.error('RatingWidget 평가 가능 항목 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRateClick = (item) => {
    if (config.rateUrl) {
      navigate(config.rateUrl, { state: { item } });
    } else {
      navigate('/ratings/rate', { state: { item } });
    }
  };
  
  const renderHeartScore = (score) => {
    return '💖'.repeat(score) + '🤍'.repeat(5 - score);
  };
  
  if (loading && !ratingStats && ratableItems.length === 0) {
    return (
      <div className="widget widget-rating">
        <div className="mg-loading">로딩중...</div>
      </div>
    );
  }
  
  // 평가 표시 모드
  if (mode === 'display' && ratingStats) {
    return (
      <div className="widget widget-rating">
        <div className="widget-header">
          <div className="widget-title">
            <i className="bi bi-star"></i>
            {config.title || '평가 통계'}
          </div>
        </div>
        <div className="widget-body">
          <div className="rating-stats">
            <div className="rating-average">
              <div className="rating-score">{ratingStats.averageRating?.toFixed(1) || '0.0'}</div>
              <div className="rating-hearts">
                {renderHeartScore(Math.round(ratingStats.averageRating || 0))}
              </div>
              <div className="rating-count">총 {ratingStats.totalRatingCount || 0}개 평가</div>
            </div>
            
            {ratingStats.ratingDistribution && (
              <div className="rating-distribution">
                {[5, 4, 3, 2, 1].map(score => {
                  const count = ratingStats.ratingDistribution[score] || 0;
                  const percentage = ratingStats.totalRatingCount > 0 
                    ? (count / ratingStats.totalRatingCount * 100).toFixed(0)
                    : 0;
                  return (
                    <div key={score} className="rating-dist-item">
                      <span className="rating-dist-score">{score}점</span>
                      <div className="rating-dist-bar">
                        <div 
                          className="rating-dist-fill" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="rating-dist-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // 평가하기 모드
  if (mode === 'rate' && ratableItems.length > 0) {
    return (
      <div className="widget widget-rating widget-rating-rate">
        <div className="widget-header">
          <div className="widget-title">
            <i className="bi bi-heart"></i>
            {config.title || '평가하기'}
          </div>
        </div>
        <div className="widget-body">
          <div className="ratable-items-list">
            {ratableItems.map((item, index) => (
              <div
                key={item.id || index}
                className="ratable-item"
                onClick={() => handleRateClick(item)}
              >
                <div className="ratable-item-info">
                  <div className="ratable-item-title">{item.title || item.name}</div>
                  <div className="ratable-item-date">
                    {new Date(item.date || item.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <button className="ratable-item-btn">
                  <i className="bi bi-heart"></i> 평가하기
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="widget widget-rating">
      <div className="widget-empty">
        <i className="bi bi-star"></i>
        <p>{config.emptyMessage || '평가 정보가 없습니다'}</p>
      </div>
    </div>
  );
};

export default RatingWidget;



