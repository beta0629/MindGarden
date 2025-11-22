/**
 * System Status Widget
 * 시스템 상태를 표시하는 관리자용 위젯
 * SystemStatus를 기반으로 위젯화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../../utils/ajax';
import UnifiedLoading from '../../../common/UnifiedLoading';
import '../Widget.css';

const SystemStatusWidget = ({ widget, user }) => {
  const [systemStatus, setSystemStatus] = useState({
    server: 'unknown',
    database: 'unknown',
    lastChecked: null
  });
  const [loading, setLoading] = useState(false);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const autoRefresh = config.autoRefresh !== false;
  const refreshInterval = config.refreshInterval || 60000; // 기본 1분
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      checkSystemStatus();
      
      if (autoRefresh) {
        const interval = setInterval(checkSystemStatus, refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.status) {
      setSystemStatus(config.status);
    }
  }, []);
  
  const checkSystemStatus = async () => {
    try {
      setLoading(true);
      
      // 실제 API 엔드포인트: /api/health/server, /api/health/database
      const serverUrl = dataSource.serverUrl || '/api/health/server';
      const databaseUrl = dataSource.databaseUrl || '/api/health/database';
      
      // 서버와 데이터베이스 상태를 병렬로 조회
      const [serverResponse, databaseResponse] = await Promise.all([
        apiGet(serverUrl),
        apiGet(databaseUrl)
      ]);
      
      const serverStatus = serverResponse?.status === 'healthy' ? 'healthy' : 
                          serverResponse?.status === 'error' ? 'error' : 'unknown';
      const databaseStatus = databaseResponse?.status === 'healthy' ? 'healthy' : 
                            databaseResponse?.status === 'error' ? 'error' : 'unknown';
      
      setSystemStatus({
        server: serverStatus,
        database: databaseStatus,
        lastChecked: new Date().toLocaleTimeString('ko-KR')
      });
    } catch (err) {
      console.error('SystemStatusWidget 상태 체크 실패:', err);
      setSystemStatus({
        server: 'error',
        database: 'error',
        lastChecked: new Date().toLocaleTimeString('ko-KR')
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#28a745';
      case 'error': return '#dc3545';
      default: return '#ffc107';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'healthy': return '정상';
      case 'error': return '오류';
      default: return '미확인';
    }
  };
  
  return (
    <div className="widget widget-system-status">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-server"></i>
          {config.title || '시스템 상태'}
        </div>
        <button 
          className="widget-btn widget-btn-sm widget-btn-outline"
          onClick={checkSystemStatus}
          disabled={loading}
        >
          <i className={`bi bi-arrow-clockwise ${loading ? 'spinning' : ''}`}></i>
          상태 체크
        </button>
      </div>
      <div className="widget-body">
        <div className="system-status-content">
          <div className="status-item">
            <div className="status-indicator">
              <i className="bi bi-server"></i>
              <span 
                className="status-dot"
                style={{ backgroundColor: getStatusColor(systemStatus.server) }}
              ></span>
            </div>
            <div className="status-info">
              <span className="status-label">서버</span>
              <span className="status-value">{getStatusText(systemStatus.server)}</span>
            </div>
          </div>
          
          <div className="status-item">
            <div className="status-indicator">
              <i className="bi bi-database"></i>
              <span 
                className="status-dot"
                style={{ backgroundColor: getStatusColor(systemStatus.database) }}
              ></span>
            </div>
            <div className="status-info">
              <span className="status-label">데이터베이스</span>
              <span className="status-value">{getStatusText(systemStatus.database)}</span>
            </div>
          </div>
          
          {systemStatus.lastChecked && (
            <div className="status-timestamp">
              마지막 확인: {systemStatus.lastChecked}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemStatusWidget;

