/**
 * Chart Widget
 * 차트를 표시하는 위젯
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-21
 */

import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../../common/UnifiedLoading';
import { apiGet } from '../../../utils/ajax';
import './Widget.css';

const ChartWidget = ({ widget, user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const chartType = config.chartType || 'line';
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadData();
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(dataSource.url, dataSource.params || {});
      
      if (response) {
        setData(response);
      }
    } catch (err) {
      console.error('ChartWidget 데이터 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const renderChart = () => {
    // 실제 차트 라이브러리(Chart.js, Recharts 등)를 사용하여 구현
    // 여기서는 간단한 플레이스홀더만 표시
    
    if (!data) {
      return (
        <div className="chart-placeholder">
          <p>차트 데이터가 없습니다.</p>
        </div>
      );
    }
    
    return (
      <div className="chart-container">
        <div className="chart-placeholder">
          <p>차트 타입: {chartType}</p>
          <p>데이터 포인트: {Array.isArray(data) ? data.length : 'N/A'}</p>
          <small>차트 라이브러리 통합 필요 (Chart.js, Recharts 등)</small>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="widget widget-chart">
        <div className="widget-title">{config.title || '차트'}</div>
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="widget widget-chart widget-error">
        <div className="widget-title">{config.title || '차트'}</div>
        <div className="widget-error-message">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="widget widget-chart">
      <div className="widget-header">
        <div className="widget-title">{config.title || '차트'}</div>
      </div>
      <div className="widget-body">
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartWidget;



