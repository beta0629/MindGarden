/**
 * Mapping Management Widget
 * 상담소 특화 매칭 관리 위젯
 * MappingManagement를 기반으로 위젯화
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

const MappingManagementWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [mappings, setMappings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    terminated: 0
  });
  const [loading, setLoading] = useState(true);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const maxItems = config.maxItems || 5;
  const showStats = config.showStats !== false;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadMappings();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadMappings, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.mappings && Array.isArray(config.mappings)) {
      setMappings(config.mappings);
      calculateStats(config.mappings);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadMappings = async () => {
    try {
      setLoading(true);
      
      const url = dataSource.url || '/api/admin/mappings';
      const params = { ...dataSource.params };
      const response = await apiGet(url, params);
      
      if (response && response.data) {
        const mappingsList = Array.isArray(response.data) ? response.data : [];
        setMappings(mappingsList.slice(0, maxItems));
        calculateStats(mappingsList);
      }
    } catch (err) {
      console.error('MappingManagementWidget 데이터 로드 실패:', err);
      setMappings([]);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateStats = (mappingsList) => {
    const total = mappingsList.length;
    const active = mappingsList.filter(m => m.status === 'ACTIVE').length;
    const pending = mappingsList.filter(m => m.status === 'PENDING_PAYMENT' || m.status === 'PAYMENT_CONFIRMED').length;
    const terminated = mappingsList.filter(m => m.status === 'TERMINATED').length;
    
    setStats({ total, active, pending, terminated });
  };
  
  const handleMappingClick = (mapping) => {
    if (config.mappingUrl) {
      navigate(config.mappingUrl.replace('{mappingId}', mapping.id));
    } else {
      navigate(`/admin/mapping-management?mappingId=${mapping.id}`);
    }
  };
  
  const handleViewAll = () => {
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else {
      navigate('/admin/mapping-management');
    }
  };
  
  const handleCreateMapping = () => {
    if (config.createUrl) {
      navigate(config.createUrl);
    } else {
      navigate('/admin/mapping-management?action=create');
    }
  };
  
  if (loading && mappings.length === 0) {
    return (
      <div className="widget widget-mapping-management">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  return (
    <div className="widget widget-mapping-management">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-link-45deg"></i>
          {config.title || '매칭 관리'}
        </div>
        <div className="widget-actions">
          <button className="widget-btn widget-btn-sm" onClick={handleViewAll}>
            전체보기
          </button>
          <button className="widget-btn widget-btn-primary widget-btn-sm" onClick={handleCreateMapping}>
            <i className="bi bi-plus-circle"></i> 새 매칭
          </button>
        </div>
      </div>
      
      {showStats && (
        <div className="widget-stats">
          <div className="stat-item">
            <div className="stat-label">전체</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">활성</div>
            <div className="stat-value text-success">{stats.active}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">대기</div>
            <div className="stat-value text-warning">{stats.pending}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">종료</div>
            <div className="stat-value text-danger">{stats.terminated}</div>
          </div>
        </div>
      )}
      
      <div className="widget-body">
        {mappings.length > 0 ? (
          <div className="mapping-list">
            {mappings.map((mapping, index) => (
              <div
                key={mapping.id || index}
                className="mapping-item"
                onClick={() => handleMappingClick(mapping)}
              >
                <div className="mapping-info">
                  <div className="mapping-header">
                    <div className="mapping-client">{mapping.clientName || mapping.client?.name}</div>
                    <div className={`mapping-status status-${mapping.status?.toLowerCase()}`}>
                      {mapping.status}
                    </div>
                  </div>
                  <div className="mapping-details">
                    <span>상담사: {mapping.consultantName || mapping.consultant?.name}</span>
                    {mapping.packageName && (
                      <span>패키지: {mapping.packageName}</span>
                    )}
                    {mapping.remainingSessions !== undefined && (
                      <span>남은 회기: {mapping.remainingSessions} / {mapping.totalSessions}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="widget-empty">
            <i className="bi bi-link-45deg"></i>
            <p>{config.emptyMessage || '매칭이 없습니다'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MappingManagementWidget;

