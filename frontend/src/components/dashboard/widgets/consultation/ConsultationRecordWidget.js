/**
 * Consultation Record Widget
 * 상담소 특화 상담일지 위젯
 * ConsultationRecordSection을 기반으로 위젯화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../../utils/ajax';
import UnifiedLoading from '../../../common/UnifiedLoading';
import '../Widget.css';

const ConsultationRecordWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [recordStats, setRecordStats] = useState({
    totalRecords: 0,
    todayRecords: 0,
    pendingRecords: 0,
    recentRecords: []
  });
  const [loading, setLoading] = useState(true);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const consultantId = user?.id || config.consultantId;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url && consultantId) {
      loadRecordStats();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadRecordStats, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.recordStats) {
      setRecordStats(config.recordStats);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [consultantId]);
  
  const loadRecordStats = async () => {
    try {
      setLoading(true);
      
      const url = dataSource.url || `/api/consultant/${consultantId}/consultation-records`;
      const response = await apiGet(url);
      
      if (response && response.data) {
        const records = response.data;
        const today = new Date().toISOString().split('T')[0];
        
        const todayRecords = records.filter(record => 
          record.sessionDate && record.sessionDate.startsWith(today)
        ).length;
        
        setRecordStats({
          totalRecords: records.length,
          todayRecords: todayRecords,
          pendingRecords: records.filter(record => !record.isCompleted).length,
          recentRecords: records.slice(0, 3)
        });
      }
    } catch (err) {
      console.error('ConsultationRecordWidget 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewAll = () => {
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else {
      navigate('/consultant/consultation-records');
    }
  };
  
  const handleCreateRecord = () => {
    if (config.createRecordUrl) {
      navigate(config.createRecordUrl);
    } else {
      navigate('/consultant/schedule');
    }
  };
  
  if (loading && !recordStats.totalRecords) {
    return (
      <div className="widget widget-consultation-record">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  return (
    <div className="widget widget-consultation-record">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-file-text"></i>
          {config.title || '상담일지'}
        </div>
        <div className="widget-actions">
          <button className="widget-btn widget-btn-sm" onClick={handleViewAll}>
            전체보기
          </button>
          <button className="widget-btn widget-btn-primary widget-btn-sm" onClick={handleCreateRecord}>
            작성하기
          </button>
        </div>
      </div>
      <div className="widget-body">
        <div className="consultation-record-stats">
          <div className="record-stat-item">
            <div className="record-stat-label">전체</div>
            <div className="record-stat-value">{recordStats.totalRecords}건</div>
          </div>
          <div className="record-stat-item">
            <div className="record-stat-label">오늘</div>
            <div className="record-stat-value">{recordStats.todayRecords}건</div>
          </div>
          <div className="record-stat-item">
            <div className="record-stat-label">미완료</div>
            <div className="record-stat-value">{recordStats.pendingRecords}건</div>
          </div>
        </div>
        
        {recordStats.recentRecords.length > 0 && (
          <div className="consultation-record-recent">
            <div className="record-recent-title">최근 상담일지</div>
            {recordStats.recentRecords.map((record, index) => (
              <div key={record.id || index} className="record-recent-item">
                <div className="record-recent-date">
                  {new Date(record.sessionDate).toLocaleDateString('ko-KR')}
                </div>
                <div className="record-recent-title-text">
                  {record.title || record.clientName || '상담일지'}
                </div>
                {record.isCompleted ? (
                  <i className="bi bi-check-circle text-success"></i>
                ) : (
                  <i className="bi bi-clock text-warning"></i>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationRecordWidget;

