import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import 'bootstrap-icons/font/bootstrap-icons.css';

/**
 * 상담사용 내담자 섹션 컴포넌트
 */
const ConsultantClientSection = ({ userId }) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadClients();
    }
  }, [userId]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 매핑 정보를 포함한 내담자 목록 조회
      const response = await apiGet(`/api/admin/mappings/consultant/${userId}/clients`);
      const mappings = response.data || [];
      
      // 클라이언트별로 그룹화하여 누적 회기수 계산
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
        
        // 가장 최근 상담일로 업데이트
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
  };

  const handleClientClick = (clientId) => {
    navigate(`/consultant/client/${clientId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return '#28a745';
      case 'PENDING':
        return '#ffc107';
      case 'INACTIVE':
        return '#6c757d';
      case 'COMPLETED':
        return '#17a2b8';
      case 'SUSPENDED':
        return '#dc3545';
      case 'DELETED':
        return '#6c757d';
      default:
        return '#6c757d';
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
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px'
        }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
          <span style={{ marginLeft: '12px', color: '#6c757d' }}>내담자 목록을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <i className="bi bi-exclamation-triangle" style={{
            fontSize: '48px',
            color: '#dc3545',
            marginBottom: '16px'
          }}></i>
          <h3 style={{ color: '#dc3545', marginBottom: '8px' }}>오류가 발생했습니다</h3>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>{error}</p>
          <button 
            className="btn btn-primary"
            onClick={loadClients}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: '#2c3e50',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="bi bi-people" style={{ color: '#007bff' }}></i>
          내 내담자 ({clients.length}명)
        </h3>
        <button 
          className="btn btn-outline-primary btn-sm"
          onClick={() => navigate('/consultant/clients')}
        >
          <i className="bi bi-arrow-right"></i> 전체보기
        </button>
      </div>

      {clients.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          color: '#6c757d'
        }}>
          <i className="bi bi-person-x" style={{
            fontSize: '48px',
            marginBottom: '16px',
            color: '#dee2e6'
          }}></i>
          <p style={{ margin: 0, fontSize: '16px' }}>아직 매칭된 내담자가 없습니다</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {clients.slice(0, 6).map((client, index) => (
            <div
              key={`${client.id}-${index}`}
              style={{
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: 'white'
              }}
              onClick={() => handleClientClick(client.id)}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#007bff';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.15)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e9ecef';
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}>
                    {client.name ? client.name.charAt(0) : '?'}
                  </div>
                  <div>
                    <h4 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2c3e50'
                    }}>
                      {client.name || '이름 없음'}
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      color: '#6c757d'
                    }}>
                      {client.email || '이메일 없음'}
                    </p>
                  </div>
                </div>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: getStatusColor(client.mappingStatus) + '20',
                  color: getStatusColor(client.mappingStatus)
                }}>
                  {getStatusText(client.mappingStatus)}
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginTop: '12px'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '8px',
                  background: '#f8f9fa',
                  borderRadius: '6px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#6c757d',
                    marginBottom: '4px'
                  }}>
                    총 회기
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    {client.totalSessions || 0}회
                  </div>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '8px',
                  background: '#f8f9fa',
                  borderRadius: '6px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#6c757d',
                    marginBottom: '4px'
                  }}>
                    사용한 회기
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    {client.usedSessions || 0}회
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '12px',
                padding: '8px',
                background: '#e3f2fd',
                borderRadius: '6px',
                fontSize: '12px',
                    color: '#1976d2',
                    textAlign: 'center'
              }}>
                <i className="bi bi-calendar-check" style={{ marginRight: '4px' }}></i>
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
  );
};

export default ConsultantClientSection;
