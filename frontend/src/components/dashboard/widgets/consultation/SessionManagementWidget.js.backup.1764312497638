/**
 * Session Management Widget
 * 상담소 특화 회기 관리 위젯
 * SessionManagement를 기반으로 위젯화
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

const SessionManagementWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    upcoming: 0
  });
  const [loading, setLoading] = useState(true);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const maxItems = config.maxItems || 5;
  const showExtensionRequests = config.showExtensionRequests !== false;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadSessions();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadSessions, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.sessions && Array.isArray(config.sessions)) {
      setSessions(config.sessions);
      calculateStats(config.sessions);
      setLoading(false);
    } else {
      setLoading(false);
    }
    
    if (showExtensionRequests) {
      loadExtensionRequests();
    }
  }, []);
  
  const loadSessions = async () => {
    try {
      setLoading(true);
      
      const url = dataSource.url || '/api/admin/sessions';
      const params = { ...dataSource.params };
      const response = await apiGet(url, params);
      
      if (response && response.data) {
        const sessionsList = Array.isArray(response.data) ? response.data : [];
        setSessions(sessionsList.slice(0, maxItems));
        calculateStats(sessionsList);
      }
    } catch (err) {
      console.error('SessionManagementWidget 데이터 로드 실패:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };
  
  const loadExtensionRequests = async () => {
    try {
      const response = await apiGet('/api/admin/session-extensions/requests');
      if (response && response.data) {
        setExtensionRequests(Array.isArray(response.data) ? response.data : []);
      } else if (response && Array.isArray(response)) {
        setExtensionRequests(response);
      }
    } catch (err) {
      console.error('회기 추가 요청 로드 실패:', err);
      setExtensionRequests([]);
    }
  };
  
  const calculateStats = (sessionsList) => {
    const total = sessionsList.length;
    const completed = sessionsList.filter(s => s.status === 'COMPLETED').length;
    const pending = sessionsList.filter(s => s.status === 'PENDING' || s.status === 'SCHEDULED').length;
    const upcoming = sessionsList.filter(s => {
      if (!s.scheduledDate) return false;
      const scheduled = new Date(s.scheduledDate);
      return scheduled > new Date();
    }).length;
    
    setStats({ total, completed, pending, upcoming });
  };
  
  const handleSessionClick = (session) => {
    if (config.sessionUrl) {
      navigate(config.sessionUrl.replace('{sessionId}', session.id));
    } else {
      navigate(`/admin/sessions?sessionId=${session.id}`);
    }
  };
  
  const handleViewAll = () => {
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else {
      navigate('/admin/sessions');
    }
  };
  
  const handleAddSession = () => {
    if (config.addSessionUrl) {
      navigate(config.addSessionUrl);
    } else {
      navigate('/admin/sessions?action=add');
    }
  };
  
  if (loading && sessions.length === 0) {
    return (
      <div className="widget widget-session-management">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  return (
    <div className="widget widget-session-management">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-calendar-check"></i>
          {config.title || '회기 관리'}
        </div>
        <div className="widget-actions">
          <button className="widget-btn widget-btn-sm" onClick={handleViewAll}>
            전체보기
          </button>
          <button className="widget-btn widget-btn-primary widget-btn-sm" onClick={handleAddSession}>
            <i className="bi bi-plus-circle"></i> 회기 추가
          </button>
        </div>
      </div>
      
      <div className="widget-stats">
        <div className="stat-item">
          <div className="stat-label">전체</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">완료</div>
          <div className="stat-value text-success">{stats.completed}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">대기</div>
          <div className="stat-value text-warning">{stats.pending}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">예정</div>
          <div className="stat-value text-info">{stats.upcoming}</div>
        </div>
      </div>
      
      {showExtensionRequests && extensionRequests.length > 0 && (
        <div className="widget-alert">
          <i className="bi bi-exclamation-triangle"></i>
          <span>회기 추가 요청 {extensionRequests.length}건 대기 중</span>
          <button 
            className="widget-btn widget-btn-sm widget-btn-warning"
            onClick={() => navigate('/admin/sessions?tab=requests')}
          >
            확인
          </button>
        </div>
      )}
      
      <div className="widget-body">
        {sessions.length > 0 ? (
          <div className="session-list">
            {sessions.map((session, index) => (
              <div
                key={session.id || index}
                className="session-item"
                onClick={() => handleSessionClick(session)}
              >
                <div className="session-info">
                  <div className="session-header">
                    <div className="session-client">{session.clientName || session.client?.name}</div>
                    <div className={`session-status status-${session.status?.toLowerCase()}`}>
                      {session.status}
                    </div>
                  </div>
                  <div className="session-details">
                    {session.scheduledDate && (
                      <span>
                        <i className="bi bi-calendar"></i> {new Date(session.scheduledDate).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                    {session.consultantName && (
                      <span>상담사: {session.consultantName}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="widget-empty">
            <i className="bi bi-calendar-x"></i>
            <p>{config.emptyMessage || '회기가 없습니다'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManagementWidget;

