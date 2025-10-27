import React, { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import { Users, Calendar, TrendingUp } from 'lucide-react';
import '../../styles/mindgarden-design-system.css';

/**
 * 상담사용 내담자 섹션 컴포넌트
 * 디자인 시스템 v2.0 적용
 */
const ConsultantClientSection = ({ userId }) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiGet(`/api/admin/mappings/consultant/${userId}/clients`);
      const mappings = response.data || [];
      
      const clientMap = new Map();
      
      mappings.forEach(mapping => {
        const clientId = mapping.client?.id || mapping.clientId;
        const clientStatus = mapping.client?.status || mapping.status;
        
        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            id: clientId,
            name: mapping.client?.name || mapping.clientName,
            email: mapping.client?.email || '',
            mappingStatus: clientStatus,
            totalSessions: 0,
            usedSessions: 0,
            remainingSessions: 0,
            lastConsultationDate: mapping.lastConsultationDate,
            packageName: mapping.packageName,
            packagePrice: mapping.packagePrice,
            paymentStatus: mapping.paymentStatus,
            createdAt: mapping.createdAt,
            packages: []
          });
        }
        
        const client = clientMap.get(clientId);
        client.totalSessions += mapping.totalSessions || 0;
        client.usedSessions += mapping.usedSessions || 0;
        client.remainingSessions += mapping.remainingSessions || 0;
        client.packages.push({
          packageName: mapping.packageName,
          totalSessions: mapping.totalSessions || 0,
          usedSessions: mapping.usedSessions || 0,
          remainingSessions: mapping.remainingSessions || 0
        });
        
        if (mapping.lastConsultationDate && 
            (!client.lastConsultationDate || 
             new Date(mapping.lastConsultationDate) > new Date(client.lastConsultationDate))) {
          client.lastConsultationDate = mapping.lastConsultationDate;
        }
      });
      
      const clientsWithMappingInfo = Array.from(clientMap.values());
      setClients(clientsWithMappingInfo);

    } catch (err) {
      console.error('내담자 목록 로드 실패:', err);
      setError(err.message || '내담자 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadClients();
    }
  }, [userId, loadClients]);

  const handleClientClick = (clientId) => {
    navigate(`/consultant/client/${clientId}`);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'mg-v2-badge-success';
      case 'PENDING':
        return 'mg-v2-badge-warning';
      case 'INACTIVE':
        return 'mg-v2-badge-secondary';
      case 'COMPLETED':
        return 'mg-v2-badge-info';
      case 'SUSPENDED':
        return 'mg-v2-badge-danger';
      case 'DELETED':
        return 'mg-v2-badge-secondary';
      default:
        return 'mg-v2-badge-secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE':
        return '활성';
      case 'PENDING':
        return '대기';
      case 'INACTIVE':
        return '비활성';
      case 'COMPLETED':
        return '완료';
      case 'SUSPENDED':
        return '일시정지';
      case 'DELETED':
        return '삭제';
      default:
        return status || '알 수 없음';
    }
  };

  if (isLoading) {
    return (
      <div className="mg-v2-card">
        <div className="mg-v2-card-body">
          <UnifiedLoading text="내담자 목록을 불러오는 중..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mg-v2-card">
        <div className="mg-v2-card-body">
          <div className="mg-v2-empty-state">
            <div className="mg-v2-empty-state-icon">⚠️</div>
            <div className="mg-v2-empty-state-text">
              <h3>오류가 발생했습니다</h3>
              <p>{error}</p>
              <button 
                className="mg-v2-button mg-v2-button--primary"
                onClick={loadClients}
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mg-v2-card">
      <div className="mg-v2-card-header">
        <div className="mg-v2-card-title">
          <Users size={20} />
          내 내담자 ({clients.length}명)
        </div>
        <button 
          className="mg-v2-button mg-v2-button--ghost mg-v2-button--sm"
          onClick={() => navigate('/consultant/clients')}
        >
          전체보기 →
        </button>
      </div>

      <div className="mg-v2-card-body">
        {clients.length === 0 ? (
          <div className="mg-v2-empty-state">
            <div className="mg-v2-empty-state-icon">👤</div>
            <div className="mg-v2-empty-state-text">아직 매칭된 내담자가 없습니다</div>
          </div>
        ) : (
          <div className="mg-v2-client-grid">
            {clients.slice(0, 5).map((client, index) => (
              <div
                key={`${client.id}-${index}`}
                className="mg-v2-client-card"
                onClick={() => handleClientClick(client.id)}
              >
                <div className="mg-v2-client-card-header">
                  <div className="mg-v2-client-card-avatar">
                    {client.name ? client.name.charAt(0) : '?'}
                  </div>
                  <div className="mg-v2-client-card-info">
                    <h4 className="mg-v2-h4">{client.name || '이름 없음'}</h4>
                    <p className="mg-v2-text-sm mg-v2-color-text-secondary">
                      {client.email || '이메일 없음'}
                    </p>
                  </div>
                  <span className={`mg-v2-badge ${getStatusClass(client.mappingStatus)}`}>
                    {getStatusText(client.mappingStatus)}
                  </span>
                </div>

                <div className="mg-v2-stats-grid">
                  <div className="mg-v2-stat-item">
                    <div className="mg-v2-stat-label">총 회기</div>
                    <div className="mg-v2-stat-value">{client.totalSessions || 0}회</div>
                  </div>
                  <div className="mg-v2-stat-item">
                    <div className="mg-v2-stat-label">사용 회기</div>
                    <div className="mg-v2-stat-value">{client.usedSessions || 0}회</div>
                  </div>
                </div>

                <div className="mg-v2-client-card-footer">
                  <Calendar size={14} />
                  마지막 상담: {client.lastConsultationDate ? 
                    new Date(client.lastConsultationDate).toLocaleDateString('ko-KR') : 
                    '없음'
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantClientSection;
