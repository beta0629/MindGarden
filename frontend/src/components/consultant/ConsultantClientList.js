import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../utils/ajax';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ClientDetailModal from './ClientDetailModal';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import { Users, Info, AlertTriangle } from 'lucide-react';
import ClientCard from '../ui/Card/ClientCard';
import EmptyState from '../common/EmptyState';
import ConsultantSuitePage from './suite/ConsultantSuitePage';
import ConsultantNotice from './suite/ConsultantNotice';
import ConsultantSearchField from './suite/ConsultantSearchField';
import ConsultantFilterChips from './suite/ConsultantFilterChips';
import ConsultantSuiteButton from './suite/ConsultantSuiteButton';
import {
  CONSULTANT_CLIENT_STATUS_FILTER,
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_SUITE_NS,
  CONSULTANT_SUITE_TEST_ID
} from '../../constants/consultantSuite';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ConsultantClientList.css';
import { useTranslation } from 'react-i18next';

const CONSULTANT_CLIENT_LIST_TITLE_ID = 'consultant-client-list-title';
const CONSULTANT_CLIENT_SEARCH_ID = 'consultant-client-search';
const NOTICE_ICON_SIZE = 16;
const EMPTY_ICON_SIZE = 40;
const CLIENT_FILTER_ORDER = Object.values(CONSULTANT_CLIENT_STATUS_FILTER);

const ConsultantClientList = () => {
  const { t } = useTranslation(CONSULTANT_SUITE_NS);
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

  const loadClients = useCallback(async() => {
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
            
            // 보안 라운드 2 (2026-06-03): 상담사 화면에서는 결제 금액/결제일 등 금융 정보를 다루지 않는다.
            // 백엔드(AdminController.getClientsByConsultantMapping)에서도 동일 필드를 응답에서 제거하므로
            // 프런트에서도 매핑 단계에서 제외하여 공격 면적을 축소한다.
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
              paymentStatus: item.paymentStatus,
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
      setError(t('clients.loadError'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

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

  const handleSaveClient = async(updatedData) => {
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
        notificationManager.show(`내담자 정보 저장에 실패했습니다: ${response?.message || '알 수 없는 오류'}`, 'error');
      }
    } catch (err) {
      console.error('❌ 내담자 정보 저장 실패:', err);
      notificationManager.show(`내담자 정보 저장 중 오류가 발생했습니다: ${err.message}`, 'error');
    }
  };

  const filterItems = CLIENT_FILTER_ORDER.map((key) => ({
    key,
    label: t('clients.filterLabel', {
      label: t(`clients.status.${key}`),
      count: statusCounts[key] || 0
    })
  }));

  const renderPage = (body) => (
    <AdminCommonLayout className="mg-v2-dashboard-layout">
      <ConsultantSuitePage
        title={t('clients.title')}
        subtitle={t('clients.subtitle')}
        titleId={CONSULTANT_CLIENT_LIST_TITLE_ID}
        ariaLabel={t('clients.ariaLabel')}
        testId={CONSULTANT_SUITE_TEST_ID.CLIENTS_PAGE}
      >
        {body}
      </ConsultantSuitePage>
      {showClientModal && selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          isOpen={showClientModal}
          onClose={handleCloseModal}
          onSave={handleSaveClient}
        />
      )}
    </AdminCommonLayout>
  );

  if (sessionLoading) {
    return renderPage(
      <div className={CONSULTANT_SUITE_CLASS.LOADING} aria-busy="true" aria-live="polite">
        <UnifiedLoading type="inline" text={t('clients.loading')} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return renderPage(
      <section className={CONSULTANT_SUITE_CLASS.PANEL}>
        <EmptyState className={CONSULTANT_SUITE_CLASS.EMPTY} title={t('clients.loginRequired')} />
      </section>
    );
  }

  const renderList = () => {
    if (loading) {
      return (
        <div className={CONSULTANT_SUITE_CLASS.LOADING} aria-busy="true" aria-live="polite">
          <UnifiedLoading type="inline" text={t('clients.loading')} />
        </div>
      );
    }
    if (error) {
      return (
        <section className={CONSULTANT_SUITE_CLASS.PANEL} role="alert">
          <EmptyState
            className={CONSULTANT_SUITE_CLASS.EMPTY}
            icon={<AlertTriangle size={EMPTY_ICON_SIZE} aria-hidden />}
            title={error}
            action={<ConsultantSuiteButton onClick={loadClients}>{t('actions.retry')}</ConsultantSuiteButton>}
          />
        </section>
      );
    }
    if (filteredClients.length === 0) {
      const hasClients = clients.length > 0;
      return (
        <section className={CONSULTANT_SUITE_CLASS.PANEL} role="status" aria-live="polite">
          <EmptyState
            className={CONSULTANT_SUITE_CLASS.EMPTY}
            icon={<Users size={EMPTY_ICON_SIZE} aria-hidden />}
            title={hasClients
              ? t('clients.filterEmptyTitle', { label: t(`clients.status.${filterStatus}`) })
              : t('clients.emptyTitle')}
            description={hasClients ? t('clients.filterEmptyDescription') : t('clients.emptyDescription')}
            action={hasClients ? (
              <ConsultantSuiteButton onClick={() => setFilterStatus(CONSULTANT_CLIENT_STATUS_FILTER.ALL)}>
                {t('actions.showAll')}
              </ConsultantSuiteButton>
            ) : null}
          />
        </section>
      );
    }
    return (
      <section className={CONSULTANT_SUITE_CLASS.CARD_GRID} aria-label={t('clients.listAria')}>
        {filteredClients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onClick={handleViewClient}
            variant="detailed"
            showActions={false}
          />
        ))}
      </section>
    );
  };

  return renderPage(
    <>
      <ConsultantNotice icon={<Info size={NOTICE_ICON_SIZE} />}>{t('clients.notice')}</ConsultantNotice>
      <div className={CONSULTANT_SUITE_CLASS.TOOLBAR}>
        <ConsultantSearchField
          id={CONSULTANT_CLIENT_SEARCH_ID}
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t('clients.searchPlaceholder')}
          ariaLabel={t('clients.searchAria')}
        />
        <ConsultantFilterChips
          items={filterItems}
          activeKey={filterStatus}
          onChange={handleFilterClick}
          ariaLabel={t('clients.filterAria')}
          testIdPrefix="consultant-clients-filter"
        />
      </div>
      {renderList()}
    </>
  );
};

export default ConsultantClientList;
