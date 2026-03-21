import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../utils/ajax';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ClientDetailModal from './ClientDetailModal';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import { Users, Info, Search, AlertTriangle, List, CheckCircle, XCircle, Clock, CheckCircle2, PauseCircle } from 'lucide-react';
import FilterBadge from './molecules/FilterBadge';
import ClientCard from './molecules/ClientCard';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ConsultantClientList.css';

const CONSULTANT_CLIENT_LIST_TITLE_ID = 'consultant-client-list-title';

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
  const isModalOpeningRef = useRef(false);

  const FILTER_CONFIG = [
    { value: 'ALL', label: '전체', icon: List, activeColor: 'var(--mg-color-primary-main, #3D5246)' },
    { value: 'ACTIVE', label: '활성', icon: CheckCircle, activeColor: 'var(--mg-v2-color-success-600, #16a34a)' },
    { value: 'INACTIVE', label: '비활성', icon: XCircle, activeColor: 'var(--mg-v2-color-secondary-500, #6b7280)' },
    { value: 'PENDING', label: '대기중', icon: Clock, activeColor: 'var(--mg-v2-color-warning-600, #d97706)' },
    { value: 'COMPLETED', label: '완료', icon: CheckCircle2, activeColor: 'var(--mg-v2-color-success-700, #15803d)' },
    { value: 'SUSPENDED', label: '일시정지', icon: PauseCircle, activeColor: 'var(--mg-v2-color-error-600, #dc2626)' }
  ];

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

  const statusCounts = useMemo(() => {
    return {
      ALL: clients.length,
      ACTIVE: clients.filter(c => c.status === 'ACTIVE').length,
      INACTIVE: clients.filter(c => c.status === 'INACTIVE').length,
      PENDING: clients.filter(c => c.status === 'PENDING').length,
      COMPLETED: clients.filter(c => c.status === 'COMPLETED').length,
      SUSPENDED: clients.filter(c => c.status === 'SUSPENDED').length
    };
  }, [clients]);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadClients();
    }
  }, [isLoggedIn, user?.id, loadClients]);

  useEffect(() => {
    if (clientIdFromUrl && clients.length > 0 && !isModalOpeningRef.current) {
      const client = clients.find(c => c.clientId === Number.parseInt(clientIdFromUrl, 10));
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
    let result = clients;

    if (searchTerm) {
      result = result.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
      );
    }

    if (filterStatus !== 'ALL') {
      result = result.filter(client => client.status === filterStatus);
    }

    return result;
  }, [clients, searchTerm, filterStatus]); // clients 의존성 제거 (무한루프 방지)

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowClientModal(true);
    navigate(`/consultant/client/${client.clientId}`);
  };

  const handleFilterClick = (filterValue) => {
    setFilterStatus(filterValue);
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

  const authShell = (mainBody) => (
    <div className="mg-v2-ad-b0kla">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="내담자 목록">
          <ContentHeader
            title="내담자 목록"
            subtitle="나와 연계된 내담자들을 조회할 수 있습니다."
            titleId={CONSULTANT_CLIENT_LIST_TITLE_ID}
          />
          <main aria-labelledby={CONSULTANT_CLIENT_LIST_TITLE_ID}>
            {mainBody}
          </main>
        </ContentArea>
      </div>
    </div>
  );

  if (sessionLoading) {
    return (
      <AdminCommonLayout title="내담자 목록">
        {authShell(
          <UnifiedLoading type="page" text="내담자 목록을 불러오는 중..." />
        )}
      </AdminCommonLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminCommonLayout title="내담자 목록">
        {authShell(
          <div className="consultant-client-list-login-required">
            <h3>로그인이 필요합니다.</h3>
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="내담자 목록">
      <div className="mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="내담자 목록">
            <ContentHeader
              title="내담자 목록"
              subtitle="나와 연계된 내담자들을 조회할 수 있습니다."
              titleId={CONSULTANT_CLIENT_LIST_TITLE_ID}
            />

            <main aria-labelledby={CONSULTANT_CLIENT_LIST_TITLE_ID}>
        <div className="mg-v2-alert mg-v2-alert--info">
          <Info size={20} />
          내담자 생성, 수정, 삭제는 관리자와 스태프만 가능합니다.
        </div>

        <ContentSection noCard={true}>
          <div className="client-list-controls">
            <div className="client-search-input-wrapper">
              <Search size={18} />
              <input
                type="text"
                className="client-search-input"
                placeholder="이름, 이메일, 전화번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="client-filter-badges">
              {FILTER_CONFIG.map(filter => (
                <FilterBadge
                  key={filter.value}
                  label={filter.label}
                  value={filter.value}
                  count={statusCounts[filter.value] || 0}
                  icon={filter.icon}
                  isActive={filterStatus === filter.value}
                  onClick={handleFilterClick}
                  activeColor={filter.activeColor}
                />
              ))}
            </div>
          </div>
        </ContentSection>

        <ContentSection noCard={true}>
          {loading && (
            <UnifiedLoading type="inline" text="내담자 목록을 불러오는 중..." />
          )}

          {error && (
            <div className="client-list-error-state">
              <AlertTriangle size={48} />
              <div className="client-list-error-state__message">{error}</div>
              <button className="mg-v2-client-view-btn" onClick={loadClients}>
                다시 시도
              </button>
            </div>
          )}

          {!loading && !error && (
            filteredClients.length === 0 ? (
              <div 
                role="status" 
                aria-live="polite" 
                className="client-list-empty-state"
              >
                <Users size={64} />
                <h3 className="client-list-empty-state__title">
                  {clients.length === 0
                    ? '연계된 내담자가 없습니다'
                    : `${FILTER_CONFIG.find(f => f.value === filterStatus)?.label || filterStatus} 상태의 내담자가 없습니다`
                  }
                </h3>
                <p className="client-list-empty-state__description">
                  {clients.length === 0
                    ? '아직 나와 연계된 내담자가 없습니다.'
                    : '다른 상태를 선택하거나 검색어를 변경해보세요.'
                  }
                </p>
                {clients.length > 0 && (
                  <button
                    className="mg-v2-client-view-btn"
                    onClick={() => setFilterStatus('ALL')}
                  >
                    전체 상태 보기
                  </button>
                )}
              </div>
            ) : (
              <div className="client-card-grid">
                {filteredClients.map(client => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onViewDetails={handleViewClient}
                  />
                ))}
              </div>
            )
          )}
        </ContentSection>
            </main>

            {showClientModal && selectedClient && (
              <ClientDetailModal
                client={selectedClient}
                isOpen={showClientModal}
                onClose={handleCloseModal}
                onSave={handleSaveClient}
              />
            )}
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default ConsultantClientList;
