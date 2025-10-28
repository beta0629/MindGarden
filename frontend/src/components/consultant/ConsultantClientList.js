import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../utils/ajax';
import './ConsultantClientList.css';
import SimpleLayout from '../layout/SimpleLayout';
import ClientDetailModal from './ClientDetailModal';
import UnifiedLoading from '../common/UnifiedLoading';
import notificationManager from '../../utils/notification';

const ConsultantClientList = () => {
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const { id: clientIdFromUrl } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [userStatusOptions, setUserStatusOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const isModalOpeningRef = useRef(false);

  // 기본 아이콘 반환 함수
  const getDefaultIcon = (status) => {
    const iconMap = {
      'ACTIVE': '🟢',
      'INACTIVE': '🔴',
      'PENDING': '⏳',
      'COMPLETED': '✅',
      'SUSPENDED': '⏸️',
      'DELETED': '🗑️',
      'APPROVED': '✅',
      'REJECTED': '❌',
      'PAYMENT_CONFIRMED': '💳',
      'PAYMENT_PENDING': '⏳',
      'PAYMENT_REJECTED': '❌',
      'TERMINATED': '🔚',
      'REQUESTED': '📝',
      'BOOKED': '📅',
      'IN_PROGRESS': '🔄',
      'CANCELLED': '❌',
      'NO_SHOW': '🚫',
      'RESCHEDULED': '🔄',
      'AVAILABLE': '✅',
      'CONFIRMED': '✅',
      'WAITING': '⏳',
      'EXPIRED': '⏰',
      'BLOCKED': '🚫',
      'MAINTENANCE': '🔧'
    };
    return iconMap[status] || '❓';
  };

  // 기본 색상 반환 함수 (디자인 시스템 변수 사용)
  const getDefaultColor = (status) => {
    const colorMap = {
      'ACTIVE': 'var(--color-success, #34c759)',
      'INACTIVE': 'var(--color-secondary, #6c757d)',
      'PENDING': 'var(--color-warning, #ff9500)',
      'COMPLETED': 'var(--color-success, #34c759)',
      'SUSPENDED': 'var(--color-danger, #ff3b30)',
      'DELETED': 'var(--color-secondary, #6c757d)',
      'APPROVED': 'var(--color-success, #34c759)',
      'REJECTED': 'var(--color-danger, #ff3b30)',
      'PAYMENT_CONFIRMED': 'var(--color-success, #34c759)',
      'PAYMENT_PENDING': 'var(--color-warning, #ff9500)',
      'PAYMENT_REJECTED': 'var(--color-danger, #ff3b30)',
      'TERMINATED': 'var(--color-secondary, #6c757d)',
      'REQUESTED': 'var(--color-primary, #007aff)',
      'BOOKED': 'var(--ios-purple, #5856d6)',
      'IN_PROGRESS': 'var(--color-warning, #ff9500)',
      'CANCELLED': 'var(--color-danger, #ff3b30)',
      'NO_SHOW': 'var(--color-danger, #ff3b30)',
      'RESCHEDULED': 'var(--ios-purple, #5856d6)',
      'AVAILABLE': 'var(--color-success, #34c759)',
      'CONFIRMED': 'var(--color-success, #34c759)',
      'WAITING': 'var(--color-warning, #ff9500)',
      'EXPIRED': 'var(--color-secondary, #6c757d)',
      'BLOCKED': 'var(--color-danger, #ff3b30)',
      'MAINTENANCE': 'var(--color-warning, #ff9500)'
    };
    return colorMap[status] || 'var(--color-secondary, #6c757d)';
  };

  const loadClients = useCallback(async () => {
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
        
        // API 응답에서 내담자 정보 추출 및 최신순 정렬
        const clientData = response.data || [];
        const sortedData = clientData.sort((a, b) => {
          const dateA = new Date(a.assignedAt || a.client.createdAt || 0);
          const dateB = new Date(b.assignedAt || b.client.createdAt || 0);
          return dateB - dateA; // 최신순 정렬
        });
        
        const clientList = sortedData.map((item, index) => {
          // API 응답 구조에 맞게 내담자 정보 변환
          if (item.client) {
            // 테스트를 위해 다양한 상태 시뮬레이션 (실제 API에서 상태를 받으면 제거)
            const testStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED', 'SUSPENDED'];
            // 더 균등한 분배를 위해 인덱스 기반 할당
            const simulatedStatus = testStatuses[index % testStatuses.length];
            
            console.log(`🔄 상태 시뮬레이션 - 인덱스: ${index}, ID: ${item.client.id}, 할당된 상태: ${simulatedStatus}`);
            
            return {
              id: item.mappingId || item.id, // mappingId를 우선 사용하여 고유성 보장
              clientId: item.client.id, // 실제 클라이언트 ID는 별도로 저장
              name: item.client.name,
              email: item.client.email,
              phone: item.client.phone,
              status: item.client.status || simulatedStatus, // 실제 상태 또는 시뮬레이션
              createdAt: item.assignedAt || item.client.createdAt || new Date().toISOString(),
              profileImage: item.client.profileImage || null,
              remainingSessions: item.remainingSessions,
              totalSessions: item.totalSessions,
              usedSessions: item.usedSessions,
              packageName: item.packageName,
              packagePrice: item.packagePrice,
              paymentStatus: item.paymentStatus,
              paymentDate: item.paymentDate,
              mappingId: item.id
            };
          }
          return null;
        }).filter(client => client !== null);
        
        setClients(clientList);
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
  }, [user?.id]);

  // 사용자 상태 코드 로드
  const loadUserStatusCodes = useCallback(async () => {
    try {
      setLoadingCodes(true);
      console.log('🔄 사용자 상태 코드 로드 시작...');
      const response = await apiGet('/api/common-codes/STATUS');
      console.log('📡 API 응답:', response);
      
      if (response && response.length > 0) {
        const mappedOptions = response.map(code => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: code.icon || getDefaultIcon(code.codeValue),
          color: code.colorCode || getDefaultColor(code.codeValue),
          description: code.description
        }));
        console.log('✅ 매핑된 상태 옵션:', mappedOptions);
        setUserStatusOptions(mappedOptions);
      } else {
        console.warn('⚠️ API 응답이 비어있음');
      }
    } catch (error) {
      console.error('❌ 사용자 상태 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      const defaultOptions = [
        { value: 'ACTIVE', label: '활성', icon: '🟢', color: '#10b981', description: '활성 사용자' },
        { value: 'INACTIVE', label: '비활성', icon: '🔴', color: '#6b7280', description: '비활성 사용자' },
        { value: 'PENDING', label: '대기중', icon: '⏳', color: '#f59e0b', description: '대기 중인 사용자' },
        { value: 'COMPLETED', label: '완료', icon: '✅', color: '#059669', description: '완료된 사용자' },
        { value: 'SUSPENDED', label: '일시정지', icon: '⏸️', color: '#dc2626', description: '일시정지된 사용자' }
      ];
      console.log('🔄 기본값 설정:', defaultOptions);
      setUserStatusOptions(defaultOptions);
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
  }, [isLoggedIn, user?.id, loadClients]);

  // URL에서 클라이언트 ID가 있을 때 해당 클라이언트 모달 열기
  useEffect(() => {
    if (clientIdFromUrl && clients.length > 0 && !isModalOpeningRef.current) {
      const client = clients.find(c => c.clientId === parseInt(clientIdFromUrl));
      if (client && !showClientModal) {
        isModalOpeningRef.current = true;
        setSelectedClient(client);
        setShowClientModal(true);
        // 모달 열기 완료 후 플래그 리셋
        setTimeout(() => {
          isModalOpeningRef.current = false;
        }, 100);
      }
    } else if (!clientIdFromUrl && showClientModal) {
      // URL에 클라이언트 ID가 없으면 모달 닫기
      setShowClientModal(false);
      setSelectedClient(null);
    }
  }, [clientIdFromUrl, clients, showClientModal]);

  // 검색 및 필터링
  const filteredClients = useMemo(() => {
    const filtered = clients.filter(client => {
      const matchesSearch = client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.phone?.includes(searchTerm);
      
      // 상태 필터링 개선 - 모든 상태 코드 지원
      let matchesStatus = true;
      if (filterStatus !== 'ALL') {
        matchesStatus = client.status === filterStatus;
      }
      
      return matchesSearch && matchesStatus;
    });

    // 디버깅을 위한 로그
    console.log(`📊 필터링 결과 - 전체: ${clients.length}명, 필터링 후: ${filtered.length}명, 선택된 필터: ${filterStatus}`);
    console.log(`📊 전체 내담자 상태 분포:`, clients.map(c => ({ name: c.name, status: c.status })));
    console.log(`📊 필터링된 내담자:`, filtered.map(c => ({ name: c.name, status: c.status })));
    
    return filtered;
  }, [searchTerm, filterStatus]); // clients 의존성 제거 (무한루프 방지)

  // 내담자 상세 정보 보기
  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowClientModal(true);
    // URL 업데이트
    navigate(`/consultant/client/${client.clientId}`);
  };

  // 내담자 상세 정보 모달 닫기
  const handleCloseModal = () => {
    setShowClientModal(false);
    setSelectedClient(null);
    // URL을 클라이언트 목록으로 되돌리기 (replace로 히스토리 교체)
    navigate('/consultant/clients', { replace: true });
  };

  // 내담자 정보 저장
  const handleSaveClient = async (updatedData) => {
    try {
      console.log('💾 내담자 정보 저장:', updatedData);
      
      // 내담자 정보 업데이트 API 호출
      const response = await apiPost(`/api/users/${selectedClient.id}/profile`, updatedData);
      
      if (response && response.success !== false) {
        // 성공 시 로컬 상태 업데이트
        setClients(prevClients => 
          prevClients.map(client => 
            client.id === selectedClient.id ? { ...client, ...updatedData } : client
          )
        );
        
        console.log('✅ 내담자 정보 저장 성공');
        handleCloseModal();
      } else {
        console.error('❌ 내담자 정보 저장 실패:', response?.message || '알 수 없는 오류');
        notificationManager.show('내담자 정보 저장에 실패했습니다: ' + (response?.message || '알 수 없는 오류'), 'error');
      }
    } catch (err) {
      console.error('❌ 내담자 정보 저장 실패:', err);
      notificationManager.show('내담자 정보 저장 중 오류가 발생했습니다: ' + err.message, 'error');
    }
  };

  if (sessionLoading) {
    return (
      <SimpleLayout title="내담자 목록">
        <UnifiedLoading text="세션 정보를 불러오는 중..." size="medium" type="inline" />
      </SimpleLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <SimpleLayout title="내담자 목록">
        <div className="consultant-client-list-login-required">
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
      <div 
        className="consultant-client-list-controls"
      >
        <div className="search-section mg-flex-1 mg-min-w-300">
          <div 
            className="search-input-group mg-relative mg-flex mg-align-center"
          >
            <i 
              className="bi bi-search search-icon mg-search-icon"
            ></i>
            <input
              type="text"
              className="search-input mg-v2-input"
              placeholder="이름, 이메일, 전화번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-section">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            disabled={loadingCodes}
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
          <UnifiedLoading text="내담자 목록을 불러오는 중..." size="medium" type="inline" />
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
                  className="btn btn-outline-primary mg-v2-btn-reset-filter"
                  onClick={() => setFilterStatus('ALL')}
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
                    className="mg-v2-client-card"
                  >
                    {/* 카드 헤더 - 아바타 + 상태 */}
                    <div className="mg-v2-client-card-header">
                      <div className="mg-v2-client-avatar-container">
                        <img
                          src={client.profileImage || '/default-avatar.svg'}
                          alt={client.name}
                          className="mg-v2-client-avatar-img"
                          onError={(e) => {
                            e.target.src = '/default-avatar.svg';
                          }}
                        />
                      </div>
                      <span className={`mg-v2-status-badge mg-v2-status-badge--${client.status === 'ACTIVE' ? 'active' : 
                                                          client.status === 'INACTIVE' ? 'inactive' :
                                                          client.status === 'PENDING' ? 'pending' :
                                                          client.status === 'COMPLETED' ? 'completed' :
                                                          client.status === 'SUSPENDED' ? 'suspended' : 'default'}`}>
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    </div>
                    
                    {/* 카드 본문 - 이름 + 연락처 정보 */}
                    <div className="mg-v2-client-card-body">
                      <h3 className="mg-v2-client-name">
                        {client.name || '이름 없음'}
                      </h3>
                      <div className="mg-v2-client-info-list">
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
                        {/* 회기 현황 섹션 */}
                        <div 
                          style={{
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            padding: '12px',
                            marginTop: '8px',
                            border: '1px solid #e9ecef'
                          }}
                        >
                          <div 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              color: '#2c3e50',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              marginBottom: '8px'
                            }}
                          >
                            <i className="bi bi-graph-up" style={{ color: '#007bff' }}></i>
                            <span>회기 현황</span>
                          </div>
                          <div 
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr',
                              gap: '8px',
                              fontSize: '0.85rem'
                            }}
                          >
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#007bff', fontWeight: '600' }}>
                                {client.totalSessions || 0}회
                              </div>
                              <div style={{ color: '#6c757d', fontSize: '0.75rem' }}>총 회기</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#28a745', fontWeight: '600' }}>
                                {client.usedSessions || 0}회
                              </div>
                              <div style={{ color: '#6c757d', fontSize: '0.75rem' }}>사용</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#ffc107', fontWeight: '600' }}>
                                {client.remainingSessions || 0}회
                              </div>
                              <div style={{ color: '#6c757d', fontSize: '0.75rem' }}>남은 회기</div>
                            </div>
                          </div>
                        </div>
                        
                        <div 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#6c757d',
                            fontSize: '0.95rem',
                            minHeight: '20px',
                            marginTop: '8px'
                          }}
                        >
                          <i className="bi bi-box" style={{ width: '16px', color: '#3498db', flexShrink: '0' }}></i>
                          <span>패키지: {client.packageName || '정보 없음'}</span>
                        </div>
                        {client.packagePrice && (
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
                            <i className="bi bi-currency-dollar" style={{ width: '16px', color: '#3498db', flexShrink: '0' }}></i>
                            <span>가격: {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(client.packagePrice)}</span>
                          </div>
                        )}
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
