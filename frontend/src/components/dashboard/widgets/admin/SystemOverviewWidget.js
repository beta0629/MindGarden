// frontend/src/components/dashboard/widgets/admin/SystemOverviewWidget.js
import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Users } from 'lucide-react';
import '../Widget.css';

const SystemOverviewWidget = ({ widget, user }) => {
  const [systemData, setSystemData] = useState({
    serverStatus: 'healthy',
    dbConnections: 12,
    activeUsers: 45,
    systemLoad: '23%'
  });
  const [loading, setLoading] = useState(false);

  const config = widget.config || {};
  const title = config.title || '시스템 개요';
  const subtitle = config.subtitle || '전체 시스템 현황';

  useEffect(() => {
    // 실제 시스템 데이터를 로드하는 함수
    const loadSystemData = async () => {
      if (!user?.tenantId) {
        console.log('⚠️ SystemOverviewWidget: 테넌트 ID 정보 없음');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        console.log('🔄 SystemOverviewWidget: 실제 시스템 데이터 로드 시작', { tenantId: user.tenantId });
        
        // 테넌트 ID를 포함한 API 호출들을 병렬로 실행
        const tenantParam = `?tenantId=${user.tenantId}`;
        const [statusResponse, databaseResponse, memoryResponse] = await Promise.all([
          fetch(`/api/admin/monitoring/status${tenantParam}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }),
          fetch(`/api/admin/monitoring/database${tenantParam}`, {
            method: 'GET', 
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }),
          fetch(`/api/admin/monitoring/memory${tenantParam}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          })
        ]);

        // 응답 데이터 파싱
        const statusData = statusResponse.ok ? await statusResponse.json() : null;
        const databaseData = databaseResponse.ok ? await databaseResponse.json() : null;
        const memoryData = memoryResponse.ok ? await memoryResponse.json() : null;

        // 실제 데이터 설정
        setSystemData({
          serverStatus: statusData?.status || 'unknown',
          dbConnections: databaseData?.activeConnections || 0,
          activeUsers: statusData?.activeUsers || 0,
          systemLoad: memoryData?.systemLoad || '0%'
        });

        console.log('✅ SystemOverviewWidget: 실제 시스템 데이터 로드 완료', {
          serverStatus: statusData?.status,
          dbConnections: databaseData?.activeConnections,
          activeUsers: statusData?.activeUsers,
          systemLoad: memoryData?.systemLoad
        });

      } catch (error) {
        console.error('❌ SystemOverviewWidget: 시스템 데이터 로드 실패:', error);
        
        // 오류 시 기본값 설정
        setSystemData({
          serverStatus: 'error',
          dbConnections: 0,
          activeUsers: 0,
          systemLoad: '0%'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSystemData();
    
    // 30초마다 데이터 새로고침
    const interval = setInterval(loadSystemData, 30000);
    return () => clearInterval(interval);
  }, [user?.tenantId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'var(--mg-success-500)';
      case 'warning': return 'var(--mg-warning-500)';
      case 'error': return 'var(--mg-error-500)';
      default: return 'var(--mg-gray-500)';
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

  if (loading) {
    return (
      <div className="widget widget-system-overview">
        <div className="widget-header">
          <div className="mg-card-header">
            <Activity size={20} className="mg-text-primary" />
            <h3 className="mg-h4 mg-mb-0">{title}</h3>
          </div>
          {subtitle && <p className="mg-text-sm mg-text-muted mg-mb-0">{subtitle}</p>}
        </div>
        <div className="widget-body">
          <div className="mg-card-body">
            <div className="mg-text-center mg-py-lg">
              <div className="mg-spinner"></div>
              <p className="mg-text-sm mg-text-muted mg-mt-sm">시스템 상태 확인 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="widget widget-system-overview">
      <div className="widget-header">
        <div className="mg-card-header mg-flex mg-align-center mg-gap-sm">
          <Activity size={20} className="mg-text-primary" />
          <div>
            <h3 className="mg-h4 mg-mb-0">{title}</h3>
            {subtitle && <p className="mg-text-sm mg-text-muted mg-mb-0">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="widget-body">
        <div className="mg-card-body">
          <div className="system-overview-grid">
            <div className="system-metric">
              <div className="metric-icon">
                <Server size={24} style={{ color: getStatusColor(systemData.serverStatus) }} />
              </div>
              <div className="metric-content">
                <div className="metric-label">서버 상태</div>
                <div className="metric-value" style={{ color: getStatusColor(systemData.serverStatus) }}>
                  {getStatusText(systemData.serverStatus)}
                </div>
              </div>
            </div>

            <div className="system-metric">
              <div className="metric-icon">
                <Database size={24} className="mg-text-info" />
              </div>
              <div className="metric-content">
                <div className="metric-label">DB 연결</div>
                <div className="metric-value">{systemData.dbConnections}</div>
              </div>
            </div>

            <div className="system-metric">
              <div className="metric-icon">
                <Users size={24} className="mg-text-success" />
              </div>
              <div className="metric-content">
                <div className="metric-label">활성 사용자</div>
                <div className="metric-value">{systemData.activeUsers}</div>
              </div>
            </div>

            <div className="system-metric">
              <div className="metric-icon">
                <Activity size={24} className="mg-text-warning" />
              </div>
              <div className="metric-content">
                <div className="metric-label">시스템 부하</div>
                <div className="metric-value">{systemData.systemLoad}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemOverviewWidget;