import React, { useState, useEffect } from 'react';
import { useSession } from '../../hooks/useSession';
import { apiGet } from '../../utils/ajax';
import './ConsultantClientList.css';

const ConsultantClientList = () => {
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // 데이터 로드
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadClients();
    }
  }, [isLoggedIn, user?.id]);

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h3>로그인이 필요합니다.</h3>
      </div>
    );
  }

  return (
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
          >
            <option value="ALL">전체 상태</option>
            <option value="ACTIVE">활성</option>
            <option value="INACTIVE">비활성</option>
          </select>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
          <p>내담자 목록을 불러오는 중...</p>
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
  );
};

// 내담자 상세 정보 모달 컴포넌트
const ClientDetailModal = ({ client, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: client.name || '',
    age: client.age || '',
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    addressDetail: client.addressDetail || '',
    postalCode: client.postalCode || '',
    consultationPurpose: client.consultationPurpose || '',
    consultationHistory: client.consultationHistory || '',
    emergencyContact: client.emergencyContact || '',
    emergencyPhone: client.emergencyPhone || '',
    notes: client.notes || ''
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: client.name || '',
      age: client.age || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      addressDetail: client.addressDetail || '',
      postalCode: client.postalCode || '',
      consultationPurpose: client.consultationPurpose || '',
      consultationHistory: client.consultationHistory || '',
      emergencyContact: client.emergencyContact || '',
      emergencyPhone: client.emergencyPhone || '',
      notes: client.notes || ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content client-detail-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            <i className="bi bi-person-circle"></i>
            내담자 상세 정보
          </h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="client-detail-form">
            <div className="form-row">
              <div className="form-group">
                <label>이름 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>나이</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>전화번호</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>이메일</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>주소</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="form-control"
                placeholder="기본 주소"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>상세 주소</label>
                <input
                  type="text"
                  name="addressDetail"
                  value={formData.addressDetail}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>우편번호</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>상담 목적</label>
              <textarea
                name="consultationPurpose"
                value={formData.consultationPurpose}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="form-control"
                rows="3"
                placeholder="상담을 받는 목적을 입력하세요"
              />
            </div>
            
            <div className="form-group">
              <label>상담 이력</label>
              <textarea
                name="consultationHistory"
                value={formData.consultationHistory}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="form-control"
                rows="3"
                placeholder="이전 상담 이력을 입력하세요"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>비상 연락처</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>비상 연락처 전화번호</label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>기타 메모</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="form-control"
                rows="3"
                placeholder="기타 참고사항을 입력하세요"
              />
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          {isEditing ? (
            <>
              <button className="btn btn-secondary" onClick={handleCancel}>
                <i className="bi bi-x-circle"></i>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                <i className="bi bi-check-circle"></i>
                저장
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                <i className="bi bi-x-circle"></i>
                닫기
              </button>
              <button className="btn btn-primary" onClick={handleEdit}>
                <i className="bi bi-pencil"></i>
                수정
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultantClientList;
