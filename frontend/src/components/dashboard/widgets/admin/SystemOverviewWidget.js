/**
 * 시스템 개요 위젯 - 표준화된 위젯
 * 서버 상태, DB 연결, 활성 사용자, 시스템 부하 등을 표시
 */
import React from 'react';
import { Activity, Server, Database, Users } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import '../Widget.css';
import './SystemOverviewWidget.css';

const SystemOverviewWidget = ({ widget, user }) => {
  // 표준화된 위젯 훅 사용
  const {
    data: systemData,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widget, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  // 기본 시스템 데이터
  const defaultSystemData = {
    serverStatus: 'healthy',
    dbConnections: 12,
    activeUsers: 45,
    systemLoad: '23%'
  };
  
  // 실제 데이터 또는 기본값 사용
  const data = systemData || defaultSystemData;

  const getStatusClassName = (status) => {
    switch (status) {
      case 'healthy': return 'status-healthy';
      case 'warning': return 'status-warning';
      case 'error': return 'status-error';
      default: return 'status-unknown';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'healthy': return '정상';
      case 'warning': return '주의';
      case 'error': return '오류';
      default: return '알 수 없음';
    }
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
    >
      <div className="system-overview-grid">
        <div className="system-metric">
          <div className="metric-icon">
            <Server size={24} className={`metric-icon ${getStatusClassName(data.serverStatus)}`} />
          </div>
          <div className="metric-content">
            <div className="metric-label">서버 상태</div>
            <div className={`metric-value ${getStatusClassName(data.serverStatus)}`}>
              {getStatusText(data.serverStatus)}
            </div>
          </div>
        </div>

        <div className="system-metric">
          <div className="metric-icon">
            <Database size={24} className="mg-text-info" />
          </div>
          <div className="metric-content">
            <div className="metric-label">DB 연결</div>
            <div className="metric-value">{data.dbConnections}</div>
          </div>
        </div>

        <div className="system-metric">
          <div className="metric-icon">
            <Users size={24} className="mg-text-success" />
          </div>
          <div className="metric-content">
            <div className="metric-label">활성 사용자</div>
            <div className="metric-value">{data.activeUsers}</div>
          </div>
        </div>

        <div className="system-metric">
          <div className="metric-icon">
            <Activity size={24} className="mg-text-warning" />
          </div>
          <div className="metric-content">
            <div className="metric-label">시스템 부하</div>
            <div className="metric-value">{data.systemLoad}</div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
};

export default SystemOverviewWidget;