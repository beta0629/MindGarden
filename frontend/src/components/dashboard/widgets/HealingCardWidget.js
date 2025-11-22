/**
 * Healing Card Widget
 * 힐링 컨텐츠를 표시하는 범용 위젯
 * HealingCard를 기반으로 범용화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../utils/ajax';
import UnifiedLoading from '../../common/UnifiedLoading';
import './Widget.css';

const HealingCardWidget = ({ widget, user }) => {
  const [healingData, setHealingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const userRole = user?.role || config.userRole || 'CLIENT';
  const category = config.category || null;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadHealingData();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadHealingData, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.healingData) {
      setHealingData(config.healingData);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [userRole, category]);
  
  const loadHealingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = dataSource.url || '/api/healing/content';
      const params = {
        ...dataSource.params,
        userRole: userRole
      };
      if (category) params.category = category;
      
      const response = await apiGet(url, params);
      
      if (response && response.data) {
        setHealingData(response.data);
      } else if (response) {
        setHealingData(response);
      }
    } catch (err) {
      console.error('HealingCardWidget 데이터 로드 실패:', err);
      setError('힐링 컨텐츠를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = dataSource.url || '/api/healing/refresh';
      const params = {
        ...dataSource.params,
        userRole: userRole
      };
      if (category) params.category = category;
      
      const response = await apiGet(url, params);
      
      if (response && response.data) {
        setHealingData(response.data);
      } else if (response) {
        setHealingData(response);
      }
    } catch (err) {
      console.error('HealingCardWidget 새로고침 실패:', err);
      setError('새로운 힐링 컨텐츠를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !healingData) {
    return (
      <div className="widget widget-healing-card">
        <UnifiedLoading message="힐링 컨텐츠를 불러오는 중..." />
      </div>
    );
  }
  
  if (error && !healingData) {
    return (
      <div className="widget widget-healing-card widget-error">
        <div className="widget-title">{config.title || '오늘의 힐링'}</div>
        <div className="widget-error-message">{error}</div>
      </div>
    );
  }
  
  if (!healingData) {
    return (
      <div className="widget widget-healing-card">
        <div className="widget-empty">
          <i className="bi bi-heart"></i>
          <p>{config.emptyMessage || '힐링 컨텐츠가 없습니다'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="widget widget-healing-card">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-heart"></i>
          {config.title || healingData.title || '오늘의 힐링'}
        </div>
        {config.allowRefresh !== false && (
          <button className="widget-refresh-btn" onClick={handleRefresh} title="새로고침">
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        )}
      </div>
      <div className="widget-body">
        <div className="healing-card-content">
          {healingData.category && (
            <div className="healing-card-category">{healingData.category}</div>
          )}
          <div className="healing-card-text">
            {healingData.content || healingData.message || healingData.text}
          </div>
          {healingData.author && (
            <div className="healing-card-author">- {healingData.author}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealingCardWidget;

