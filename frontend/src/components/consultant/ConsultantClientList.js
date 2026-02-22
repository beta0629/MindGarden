import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../utils/ajax';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { CONSULTANT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import ClientDetailModal from './ClientDetailModal';
import UnifiedLoading from '../../components/common/UnifiedLoading';
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

  const getDefaultIcon = (status) => {
    const iconMap = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'ACTIVE': '🟢',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'INACTIVE': '🔴',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': '⏳',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'COMPLETED': '✅',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'SUSPENDED': '⏸️',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'DELETED': '🗑️',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'APPROVED': '✅',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'REJECTED': '❌',
      'PAYMENT_CONFIRMED': '💳',
      'PAYMENT_PENDING': '⏳',
      'PAYMENT_REJECTED': '❌',
      'TERMINATED': '🔚',
      'REQUESTED': '📝',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'BOOKED': '📅',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'IN_PROGRESS': '🔄',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CANCELLED': '❌',
      'NO_SHOW': '🚫',
      'RESCHEDULED': '🔄',
      'AVAILABLE': '✅',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CONFIRMED': '✅',
      'WAITING': '⏳',
      'EXPIRED': '⏰',
      'BLOCKED': '🚫',
      'MAINTENANCE': '🔧'
    };
    return iconMap[status] || '❓';
  };

  const getDefaultColor = (status) => {
    const colorMap = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'ACTIVE': 'var(--color-success, var(--mg-success-500))',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'INACTIVE': 'var(--color-secondary, var(--mg-secondary-500))',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': 'var(--color-warning, var(--mg-warning-500))',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'COMPLETED': 'var(--color-success, var(--mg-success-500))',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'SUSPENDED': 'var(--color-danger, var(--mg-error-500))',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'DELETED': 'var(--color-secondary, var(--mg-secondary-500))',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'APPROVED': 'var(--color-success, var(--mg-success-500))',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'REJECTED': 'var(--color-danger, var(--mg-error-500))',
      'PAYMENT_CONFIRMED': 'var(--color-success, var(--mg-success-500))',
      'PAYMENT_PENDING': 'var(--color-warning, var(--mg-warning-500))',
      'PAYMENT_REJECTED': 'var(--color-danger, var(--mg-error-500))',
      'TERMINATED': 'var(--color-secondary, var(--mg-secondary-500))',
      'REQUESTED': 'var(--color-primary, var(--mg-primary-500))',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'BOOKED': 'var(--ios-purple, var(--mg-purple-500))',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'IN_PROGRESS': 'var(--color-warning, var(--mg-warning-500))',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CANCELLED': 'var(--color-danger, var(--mg-error-500))',
      'NO_SHOW': 'var(--color-danger, var(--mg-error-500))',
      'RESCHEDULED': 'var(--ios-purple, var(--mg-purple-500))',
      'AVAILABLE': 'var(--color-success, var(--mg-success-500))',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CONFIRMED': 'var(--color-success, var(--mg-success-500))',
      'WAITING': 'var(--color-warning, var(--mg-warning-500))',
      'EXPIRED': 'var(--color-secondary, var(--mg-secondary-500))',
      'BLOCKED': 'var(--color-danger, var(--mg-error-500))',
      'MAINTENANCE': 'var(--color-warning, var(--mg-warning-500))'
    };
    return colorMap[status] || 'var(--color-secondary, var(--mg-secondary-500))';
  };

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('👤 상담사 ID로 연계된 내담자 목록 로드:', user.id);
      console.log('👤 사용자 정보 전체:', user);

      const response = await apiGet(`/api/v1/admin/mappings/consultant/${user.id}/clients`);
      
      console.log('📡 API 응답 전체:', response);
      
      // apiGet은 ApiResponse 래퍼를 처리하여 data만 반환: { mappings: [...], count: N }
      let clientData = [];
      if (response) {
        if (response.mappings && Array.isArray(response.mappings)) {
          clientData = response.mappings;
        } else if (Array.isArray(response)) {
          clientData = response;
        } else {
          console.warn('⚠️ 예상하지 못한 응답 구조:', response);
        }
      } else {
        console.warn('⚠️ API 응답이 null입니다. 권한 문제이거나 데이터가 없을 수 있습니다.');
      }
      
      console.log('✅ 내담자 목록 로드 성공:', clientData);
      console.log('📊 내담자 수:', clientData.length);
      
      if (clientData && clientData.length > 0) {
        const sortedData = clientData.sort((a, b) => {
          const dateA = new Date(a.assignedAt || a.client.createdAt || 0);
          const dateB = new Date(b.assignedAt || b.client.createdAt || 0);
          return dateB - dateA; // 최신순 정렬
        });
        
        const clientList = sortedData.map((item, index) => {
          if (item.client) {
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            const testStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED', 'SUSPENDED'];
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
        console.log('✅ 내담자 목록 설정 완료:', clientList.length, '명');
      } else {
        console.warn('⚠️ 내담자 데이터 없음');
        setClients([]);
      }
    } catch (err) {
      console.error('❌ 내담자 목록 로드 중 오류:', err);
      setError('내담자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadUserStatusCodes = useCallback(async () => {
    try {
      setLoadingCodes(true);
      console.log('🔄 사용자 상태 코드 로드 시작...');
      const response = await apiGet('/api/v1/common-codes/STATUS');
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
      const defaultOptions = [
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        { value: 'ACTIVE', label: '활성', icon: '🟢', color: 'var(--mg-success-500)', description: '활성 사용자' },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        { value: 'INACTIVE', label: '비활성', icon: '🔴', color: '#6b7280', description: '비활성 사용자' },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        { value: 'PENDING', label: '대기중', icon: '⏳', color: 'var(--mg-warning-500)', description: '대기 중인 사용자' },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        { value: 'COMPLETED', label: '완료', icon: '✅', color: '#059669', description: '완료된 사용자' },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        { value: 'SUSPENDED', label: '일시정지', icon: '⏸️', color: '#dc2626', description: '일시정지된 사용자' }
      ];
      console.log('🔄 기본값 설정:', defaultOptions);
      setUserStatusOptions(defaultOptions);
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadClients();
      loadUserStatusCodes();
    }
  }, [isLoggedIn, user?.id, loadClients]);

  useEffect(() => {
    if (clientIdFromUrl && clients.length > 0 && !isModalOpeningRef.current) {
      const client = clients.find(c => c.clientId === parseInt(clientIdFromUrl));
      if (client && !showClientModal) {
        isModalOpeningRef.current = true;
        setSelectedClient(client);
        setShowClientModal(true);
        setTimeout(() => {
          isModalOpeningRef.current = false;
        }, 100);
      }
    } else if (!clientIdFromUrl && showClientModal) {
      setShowClientModal(false);
      setSelectedClient(null);
    }
  }, [clientIdFromUrl, clients, showClientModal]);

  const filteredClients = useMemo(() => {
    const filtered = clients.filter(client => {
      const matchesSearch = client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.phone?.includes(searchTerm);
      
      let matchesStatus = true;
      if (filterStatus !== 'ALL') {
        matchesStatus = client.status === filterStatus;
      }
      
      return matchesSearch && matchesStatus;
    });

    console.log(`📊 필터링 결과 - 전체: ${clients.length}명, 필터링 후: ${filtered.length}명, 선택된 필터: ${filterStatus}`);
    console.log(`📊 전체 내담자 상태 분포:`, clients.map(c => ({ name: c.name, status: c.status })));
    console.log(`📊 필터링된 내담자:`, filtered.map(c => ({ name: c.name, status: c.status })));
    
    return filtered;
  }, [searchTerm, filterStatus]); // clients 의존성 제거 (무한루프 방지)

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowClientModal(true);
    navigate(`/consultant/client/${client.clientId}`);
  };

  const handleCloseModal = () => {
    setShowClientModal(false);
    setSelectedClient(null);
    navigate('/consultant/clients', { replace: true });
  };

  const handleSaveClient = async (updatedData) => {
    try {
      console.log('💾 내담자 정보 저장:', updatedData);
      
      const response = await apiPost(`/api/users/${selectedClient.id}/profile`, updatedData);
      
      if (response && response.success !== false) {
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
      <AdminCommonLayout title="내담자 목록" menuItems={CONSULTANT_MENU_ITEMS}>
        <UnifiedLoading type="page" text="내담자 목록을 불러오는 중..." />
      </AdminCommonLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminCommonLayout title="내담자 목록" menuItems={CONSULTANT_MENU_ITEMS}>
        <div className="consultant-client-list-login-required">
          <h3>로그인이 필요합니다.</h3>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="내담자 목록" menuItems={CONSULTANT_MENU_ITEMS}>
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
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            <option value="ACTIVE">🟢 활성</option>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            <option value="INACTIVE">🔴 비활성</option>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            <option value="PENDING">⏳ 대기중</option>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            <option value="COMPLETED">✅ 완료</option>
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            <option value="SUSPENDED">⏸️ 일시정지</option>
          </select>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <UnifiedLoading type="inline" text="내담자 목록을 불러오는 중..." />
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
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                      <span className={`mg-v2-status-badge mg-v2-status-badge--${client.status === 'ACTIVE' ? 'active' : 
                                                          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                                          client.status === 'INACTIVE' ? 'inactive' :
                                                          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                                          client.status === 'PENDING' ? 'pending' :
                                                          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                                          client.status === 'COMPLETED' ? 'completed' :
                                                          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
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
                        <div className="mg-v2-client-info-item">
                          <i className="bi bi-envelope mg-v2-icon-fixed"></i>
                          <span>{client.email || '이메일 없음'}</span>
                        </div>
                        <div className="mg-v2-client-info-item">
                          <i className="bi bi-telephone mg-v2-icon-fixed"></i>
                          <span>{client.phone || '전화번호 없음'}</span>
                        </div>
                        <div className="mg-v2-client-info-item">
                          <i className="bi bi-calendar mg-v2-icon-fixed"></i>
                          <span>가입일: {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '정보 없음'}</span>
                        </div>
                        {/* 회기 현황 섹션 */}
                        <div className="mg-v2-client-session-info">
                          <div className="mg-v2-client-session-title">
                            <i className="bi bi-graph-up mg-v2-text-primary"></i>
                            <span>회기 현황</span>
                          </div>
                          <div className="mg-v2-client-session-grid">
                            <div className="mg-v2-client-session-item">
                              <div className="mg-v2-client-session-value mg-v2-text-primary">
                                {client.totalSessions || 0}회
                              </div>
                              <div className="mg-v2-client-session-label">총 회기</div>
                            </div>
                            <div className="mg-v2-client-session-item">
                              <div className="mg-v2-client-session-value mg-v2-text-success">
                                {client.usedSessions || 0}회
                              </div>
                              <div className="mg-v2-client-session-label">사용</div>
                            </div>
                            <div className="mg-v2-client-session-item">
                              <div className="mg-v2-client-session-value mg-v2-text-warning">
                                {client.remainingSessions || 0}회
                              </div>
                              <div className="mg-v2-client-session-label">남은 회기</div>
                            </div>
                          </div>
                        </div>

                        
                        <div className="mg-v2-client-info-item" style={{ marginTop: '8px' }}>
                          <i className="bi bi-box mg-v2-icon-fixed"></i>
                          <span>패키지: {client.packageName || '정보 없음'}</span>
                        </div>
                        {client.packagePrice && (
                          <div className="mg-v2-client-info-item">
                            <i className="bi bi-currency-dollar mg-v2-icon-fixed"></i>
                            <span>가격: {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(client.packagePrice)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 카드 푸터 - 상세보기 버튼 (항상 표시) */}
                    <div className="mg-v2-client-card-footer">
                      <button
                        onClick={() => handleViewClient(client)}
                        disabled={!client.id}
                        className="mg-v2-client-view-btn"
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
    </AdminCommonLayout>
  );
};

export default ConsultantClientList;
