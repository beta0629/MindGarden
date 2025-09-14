import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import './ConsultantClientList.css';
import SimpleLayout from '../layout/SimpleLayout';
import ClientDetailModal from './ClientDetailModal';
import LoadingSpinner from '../common/LoadingSpinner';

const ConsultantClientList = () => {
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [userStatusOptions, setUserStatusOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  // 사용자 상태 코드 로드
  const loadUserStatusCodes = useCallback(async () => {
    try {
      setLoadingCodes(true);
      const response = await apiGet('/api/admin/common-codes/values?groupCode=USER_STATUS');
      if (response && response.length > 0) {
        setUserStatusOptions(response.map(code => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.description
        })));
      }
    } catch (error) {
      console.error('사용자 상태 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      setUserStatusOptions([
        { value: 'ACTIVE', label: '활성', icon: '🟢', color: '#10b981', description: '활성 사용자' },
        { value: 'INACTIVE', label: '비활성', icon: '🔴', color: '#6b7280', description: '비활성 사용자' },
        { value: 'PENDING', label: '대기중', icon: '⏳', color: '#f59e0b', description: '대기 중인 사용자' },
        { value: 'COMPLETED', label: '완료', icon: '✅', color: '#059669', description: '완료된 사용자' },
        { value: 'SUSPENDED', label: '일시정지', icon: '⏸️', color: '#dc2626', description: '일시정지된 사용자' }
      ]);
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  // 데이터 로드
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadClients();
      loadUserStatusCodes();
    }
  }, [isLoggedIn, user?.id, loadUserStatusCodes]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('👤 상담사 ID로 연계된 내담자 목록 로드:', user.id);
      console.log('👤 사용자 정보 전체:', user);

      // 상담사와 연계된 내담자 목록 가져오기
      const response = await apiGet(`/api/admin/mappings/consultant/${user.id}/clients`);
      
      console.log('📡 API 응답 전체:', response);
      
      if (response.success) {
        console.log('✅ 내담자 목록 로드 성공:', response.data);
        console.log('📊 내담자 수:', response.count);
        
        // API 응답에서 내담자 정보 추출
        const clientData = response.data || [];
        const clients = clientData.map((item, index) => {
          // API 응답 구조에 맞게 내담자 정보 변환
          if (item.client) {
            // 테스트를 위해 다양한 상태 시뮬레이션 (실제 API에서 상태를 받으면 제거)
            const testStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED', 'SUSPENDED'];
            // 더 균등한 분배를 위해 인덱스 기반 할당
            const simulatedStatus = testStatuses[index % testStatuses.length];
            
            console.log(`🔄 상태 시뮬레이션 - 인덱스: ${index}, ID: ${item.client.id}, 할당된 상태: ${simulatedStatus}`);
            
            return {
              id: item.client.id,
              name: item.client.name,
              email: item.client.email,
              phone: item.client.phone,
              status: item.client.status || simulatedStatus, // 실제 상태 또는 시뮬레이션
              createdAt: item.assignedAt || item.client.createdAt || new Date().toISOString(),
              profileImage: item.client.profileImage || null,
              remainingSessions: item.remainingSessions,
              packageName: item.packageName,
              paymentStatus: item.paymentStatus
            };
          }
          return null;
        }).filter(client => client !== null);
        
        setClients(clients);
      } else {
        console.error('❌ 내담자 목록 로드 실패:', response.message);
        setError(response.message || '내담자 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 내담자 목록 로드 중 오류:', err);
      setError('내담자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 필터링
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone?.includes(searchTerm);
    
    // 상태 필터링 개선 - 모든 상태 코드 지원
    let matchesStatus = true;
    if (filterStatus !== 'ALL') {
      matchesStatus = client.status === filterStatus;
    }
    
    console.log(`🔍 필터링 - 클라이언트: ${client.name}, 상태: ${client.status}, 필터: ${filterStatus}, 매치: ${matchesStatus}`);
    
    return matchesSearch && matchesStatus;
  });

  // 디버깅을 위한 로그
  console.log(`📊 필터링 결과 - 전체: ${clients.length}명, 필터링 후: ${filteredClients.length}명, 선택된 필터: ${filterStatus}`);
  console.log(`📊 전체 내담자 상태 분포:`, clients.map(c => ({ name: c.name, status: c.status })));
  console.log(`📊 필터링된 내담자:`, filteredClients.map(c => ({ name: c.name, status: c.status })));

  // 내담자 상세 정보 보기
  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  // 내담자 상세 정보 모달 닫기
  const handleCloseModal = () => {
    setShowClientModal(false);
    setSelectedClient(null);
  };

  // 내담자 정보 저장
  const handleSaveClient = async (updatedData) => {
    try {
      console.log('💾 내담자 정보 저장:', updatedData);
      // TODO: 내담자 정보 업데이트 API 호출
      // const response = await apiPost(`/api/admin/users/${selectedClient.id}`, updatedData);
      
      // 임시로 로컬 상태 업데이트
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === selectedClient.id ? { ...client, ...updatedData } : client
        )
      );
      
      handleCloseModal();
    } catch (err) {
      console.error('❌ 내담자 정보 저장 실패:', err);
    }
  };

  if (sessionLoading) {
    return (
      <SimpleLayout title="내담자 목록">
        <LoadingSpinner text="세션 정보를 불러오는 중..." size="medium" />
      </SimpleLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <SimpleLayout title="내담자 목록">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h3>로그인이 필요합니다.</h3>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="내담자 목록">
      <div className="consultant-client-list-container">
      {/* 헤더 */}
      <div className="client-list-header">
        <h1 className="client-list-title">
          <i className="bi bi-people-fill"></i>
          내담자 목록 {clients.length > 0 && `(${clients.length}명)`}
        </h1>
        <p className="client-list-subtitle">
          나와 연계된 내담자들을 관리할 수 있습니다.
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div className="client-list-controls">
        <div className="search-section">
          <div 
            className="search-input-group"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <i 
              className="bi bi-search search-icon"
              style={{
                position: 'absolute',
                left: '12px',
                color: '#7f8c8d',
                zIndex: 2,
                fontSize: '1rem'
              }}
            ></i>
            <input
              type="text"
              className="search-input"
              placeholder="이름, 이메일, 전화번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 15px 12px 40px',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                background: '#f8f9fa',
                color: '#2c3e50',
                maxHeight: '45px'
              }}
            />
          </div>
        </div>
        
        <div className="filter-section">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            disabled={loadingCodes}
            style={{
              width: '100%',
              padding: '12px 15px',
              border: '2px solid #e9ecef',
              borderRadius: '12px',
              fontSize: '0.9rem',
              background: '#f8f9fa',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              color: '#2c3e50',
              fontWeight: '500',
              maxHeight: '45px',
              minWidth: '140px'
            }}
          >
            <option value="ALL">전체 상태</option>
            <option value="ACTIVE">🟢 활성</option>
            <option value="INACTIVE">🔴 비활성</option>
            <option value="PENDING">⏳ 대기중</option>
            <option value="COMPLETED">✅ 완료</option>
            <option value="SUSPENDED">⏸️ 일시정지</option>
          </select>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="loading-container">
          <LoadingSpinner text="내담자 목록을 불러오는 중..." size="medium" />
          <p>잠시만 기다려주세요...</p>
        </div>
      )}

      {/* 오류 상태 */}
      {error && (
        <div className="error-container">
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            {error}
          </div>
          <button className="btn btn-outline-primary" onClick={loadClients}>
            <i className="bi bi-arrow-clockwise"></i>
            다시 시도
          </button>
        </div>
      )}

      {/* 내담자 목록 */}
      {!loading && !error && (
        <div className="client-list-content">
          {filteredClients.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-people"></i>
              <h3>
                {clients.length === 0 
                  ? "연계된 내담자가 없습니다" 
                  : `${userStatusOptions.find(opt => opt.value === filterStatus)?.label || filterStatus} 상태의 내담자가 없습니다`
                }
              </h3>
              <p>
                {clients.length === 0 
                  ? "아직 나와 연계된 내담자가 없습니다." 
                  : "다른 상태를 선택하거나 검색어를 변경해보세요."
                }
              </p>
              {clients.length > 0 && (
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => setFilterStatus('ALL')}
                  style={{
                    marginTop: '15px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #3498db',
                    background: 'transparent',
                    color: '#3498db',
                    cursor: 'pointer'
                  }}
                >
                  전체 상태 보기
                </button>
              )}
            </div>
          ) : (
            <div className="client-grid">
              {filteredClients.map((client) => {
                // 상태별 표시 정보 가져오기
                const statusInfo = userStatusOptions.find(option => option.value === client.status) || {
                  label: client.status || '알 수 없음',
                  icon: '❓',
                  color: '#6b7280'
                };

                return (
                  <div 
                    key={client.id} 
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden',
                      border: '1px solid #e9ecef',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: '320px',
                      position: 'relative'
                    }}
                  >
                    {/* 카드 헤더 - 아바타 + 상태 */}
                    <div 
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px 20px 15px',
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        borderBottom: '1px solid #e9ecef'
                      }}
                    >
                      <div 
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '3px solid #fff',
                          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                          flexShrink: 0
                        }}
                      >
                        <img
                          src={client.profileImage || '/default-avatar.svg'}
                          alt={client.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.target.src = '/default-avatar.svg';
                          }}
                        />
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <span 
                          style={{ 
                            backgroundColor: statusInfo.color + '20', 
                            color: statusInfo.color,
                            padding: '4px 10px',
                            borderRadius: '15px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    
                    {/* 카드 본문 - 이름 + 연락처 정보 */}
                    <div 
                      style={{
                        padding: '20px',
                        flex: '1',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <h3 
                        style={{
                          fontSize: '1.3rem',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '15px',
                          marginTop: '0'
                        }}
                      >
                        {client.name || '이름 없음'}
                      </h3>
                      <div 
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          flex: '1'
                        }}
                      >
                        <div 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#6c757d',
                            fontSize: '0.95rem',
                            minHeight: '20px'
                          }}
                        >
                          <i className="bi bi-envelope" style={{ width: '16px', color: '#3498db', flexShrink: '0' }}></i>
                          <span>{client.email || '이메일 없음'}</span>
                        </div>
                        <div 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#6c757d',
                            fontSize: '0.95rem',
                            minHeight: '20px'
                          }}
                        >
                          <i className="bi bi-telephone" style={{ width: '16px', color: '#3498db', flexShrink: '0' }}></i>
                          <span>{client.phone || '전화번호 없음'}</span>
                        </div>
                        <div 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#6c757d',
                            fontSize: '0.95rem',
                            minHeight: '20px'
                          }}
                        >
                          <i className="bi bi-calendar" style={{ width: '16px', color: '#3498db', flexShrink: '0' }}></i>
                          <span>가입일: {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '정보 없음'}</span>
                        </div>
                        <div 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#6c757d',
                            fontSize: '0.95rem',
                            minHeight: '20px'
                          }}
                        >
                          <i className="bi bi-clock" style={{ width: '16px', color: '#3498db', flexShrink: '0' }}></i>
                          <span>남은 세션: {client.remainingSessions || 0}회</span>
                        </div>
                        <div 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#6c757d',
                            fontSize: '0.95rem',
                            minHeight: '20px'
                          }}
                        >
                          <i className="bi bi-box" style={{ width: '16px', color: '#3498db', flexShrink: '0' }}></i>
                          <span>패키지: {client.packageName || '정보 없음'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 카드 푸터 - 상세보기 버튼 (항상 표시) */}
                    <div 
                      style={{
                        padding: '15px 20px 20px',
                        borderTop: '1px solid #e9ecef',
                        background: '#f8f9fa',
                        marginTop: 'auto',
                        display: 'block'
                      }}
                    >
                      <button
                        onClick={() => handleViewClient(client)}
                        disabled={!client.id}
                        style={{
                          width: '100%',
                          padding: '10px 15px',
                          borderRadius: '8px',
                          fontWeight: '500',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          border: '1px solid #3498db',
                          background: 'transparent',
                          color: '#3498db',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#3498db';
                          e.target.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = '#3498db';
                        }}
                      >
                        <i className="bi bi-eye"></i>
                        상세보기
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 내담자 상세 정보 모달 */}
      {showClientModal && selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          isOpen={showClientModal}
          onClose={handleCloseModal}
          onSave={handleSaveClient}
        />
      )}
      </div>
    </SimpleLayout>
  );
};

export default ConsultantClientList;
