import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../../hooks/useSession';
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
        { value: 'INACTIVE', label: '비활성', icon: '🔴', color: '#6b7280', description: '비활성 사용자' }
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

      // 상담사와 연계된 내담자 목록 가져오기
      const response = await apiGet(`/api/admin/mappings/consultant/${user.id}/clients`);
      
      if (response.success) {
        console.log('✅ 내담자 목록 로드 성공:', response.data);
        setClients(response.data || []);
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
    
    const matchesStatus = filterStatus === 'ALL' || 
                         (filterStatus === 'ACTIVE' && client.status === 'ACTIVE') ||
                         (filterStatus === 'INACTIVE' && client.status === 'INACTIVE');
    
    return matchesSearch && matchesStatus;
  });

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
          내담자 목록
        </h1>
        <p className="client-list-subtitle">
          나와 연계된 내담자들을 관리할 수 있습니다.
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div className="client-list-controls">
        <div className="search-section">
          <div className="search-input-group">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="search-input"
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
            {userStatusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <LoadingSpinner text="내담자 목록을 불러오는 중..." size="medium" />
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
              <h3>연계된 내담자가 없습니다</h3>
              <p>아직 나와 연계된 내담자가 없습니다.</p>
            </div>
          ) : (
            <div className="client-grid">
              {filteredClients.map((client) => (
                <div key={client.id} className="client-card">
                  <div className="client-card-header">
                    <div className="client-avatar">
                      <img
                        src={client.profileImage || '/default-avatar.svg'}
                        alt={client.name}
                        onError={(e) => {
                          e.target.src = '/default-avatar.svg';
                        }}
                      />
                    </div>
                    <div className="client-status">
                      <span className={`status-badge ${client.status?.toLowerCase() || 'active'}`}>
                        {client.status === 'ACTIVE' ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="client-card-body">
                    <h3 className="client-name">{client.name}</h3>
                    <div className="client-info">
                      <div className="info-item">
                        <i className="bi bi-envelope"></i>
                        <span>{client.email || '이메일 없음'}</span>
                      </div>
                      <div className="info-item">
                        <i className="bi bi-telephone"></i>
                        <span>{client.phone || '전화번호 없음'}</span>
                      </div>
                      <div className="info-item">
                        <i className="bi bi-calendar"></i>
                        <span>가입일: {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '정보 없음'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="client-card-footer">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handleViewClient(client)}
                    >
                      <i className="bi bi-eye"></i>
                      상세보기
                    </button>
                  </div>
                </div>
              ))}
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
