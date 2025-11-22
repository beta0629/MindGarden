/**
 * Consultant Client Widget
 * 상담소 특화 내담자 목록 위젯
 * ConsultantClientSection을 기반으로 위젯화
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

const ConsultantClientWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const consultantId = user?.id || config.consultantId;
  const maxItems = config.maxItems || 5;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url && consultantId) {
      loadClients();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadClients, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.clients && Array.isArray(config.clients)) {
      setClients(config.clients);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [consultantId]);
  
  const loadClients = async () => {
    try {
      setLoading(true);
      
      const url = dataSource.url || `/api/admin/mappings/consultant/${consultantId}/clients`;
      const response = await apiGet(url);
      
      if (response && response.data) {
        const mappings = response.data;
        const clientMap = new Map();
        
        mappings.forEach(mapping => {
          const clientId = mapping.client?.id || mapping.clientId;
          if (!clientMap.has(clientId)) {
            clientMap.set(clientId, {
              id: clientId,
              name: mapping.client?.name || mapping.clientName,
              email: mapping.client?.email || '',
              mappingStatus: mapping.client?.status || mapping.status,
              totalSessions: mapping.totalSessions || 0,
              usedSessions: mapping.usedSessions || 0,
              remainingSessions: mapping.remainingSessions || 0,
              lastConsultationDate: mapping.lastConsultationDate
            });
          } else {
            const client = clientMap.get(clientId);
            client.totalSessions += mapping.totalSessions || 0;
            client.usedSessions += mapping.usedSessions || 0;
            client.remainingSessions += mapping.remainingSessions || 0;
          }
        });
        
        setClients(Array.from(clientMap.values()).slice(0, maxItems));
      }
    } catch (err) {
      console.error('ConsultantClientWidget 데이터 로드 실패:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleClientClick = (client) => {
    if (config.clientUrl) {
      navigate(config.clientUrl.replace('{clientId}', client.id));
    } else {
      navigate(`/consultant/clients/${client.id}`);
    }
  };
  
  const handleViewAll = () => {
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else {
      navigate('/consultant/clients');
    }
  };
  
  if (loading && clients.length === 0) {
    return (
      <div className="widget widget-consultant-client">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  return (
    <div className="widget widget-consultant-client">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-people"></i>
          {config.title || '내담자 목록'}
        </div>
        {config.viewAllUrl && (
          <button className="widget-view-all" onClick={handleViewAll}>
            전체보기 →
          </button>
        )}
      </div>
      <div className="widget-body">
        {clients.length > 0 ? (
          <div className="consultant-client-list">
            {clients.map((client, index) => (
              <div
                key={client.id || index}
                className="consultant-client-item"
                onClick={() => handleClientClick(client)}
              >
                <div className="client-info">
                  <div className="client-name">{client.name}</div>
                  <div className="client-sessions">
                    사용: {client.usedSessions} / 전체: {client.totalSessions}
                    {client.remainingSessions > 0 && (
                      <span className="client-remaining"> (남은: {client.remainingSessions})</span>
                    )}
                  </div>
                  {client.lastConsultationDate && (
                    <div className="client-last-date">
                      최근 상담: {new Date(client.lastConsultationDate).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                </div>
                <div className={`client-status status-${client.mappingStatus?.toLowerCase()}`}>
                  {client.mappingStatus}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="widget-empty">
            <i className="bi bi-person-x"></i>
            <p>{config.emptyMessage || '내담자가 없습니다'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantClientWidget;



