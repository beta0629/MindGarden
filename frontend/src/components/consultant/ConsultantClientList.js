import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useParams, useNavigate } from 'react-router-dom';
import { apiPost } from '../../utils/ajax';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ClientDetailModal from './ClientDetailModal';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import { Users, Info, AlertTriangle } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import MGPagination from '../common/MGPagination';
import SafeText from '../common/SafeText';
import ConsultantSuitePage from './suite/ConsultantSuitePage';
import ConsultantNotice from './suite/ConsultantNotice';
import ConsultantSearchField from './suite/ConsultantSearchField';
import ConsultantFilterChips from './suite/ConsultantFilterChips';
import ConsultantSuiteButton from './suite/ConsultantSuiteButton';
import ConsultantSuiteCard, {
  ConsultantSuitePill,
  toConsultantSuiteAvatarInitials
} from './suite/ConsultantSuiteCard';
import {
  CONSULTANT_CLIENT_STATUS_FILTER,
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_SUITE_NS,
  CONSULTANT_SUITE_PAGE_SIZE,
  CONSULTANT_SUITE_TEST_ID
} from '../../constants/consultantSuite';
import {
  fetchConsultantSuitePagedList,
  toServerPageIndex
} from '../../utils/consultantSuiteListApi';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ConsultantClientList.css';
import { useTranslation } from 'react-i18next';

const CONSULTANT_CLIENT_LIST_TITLE_ID = 'consultant-client-list-title';
const CONSULTANT_CLIENT_SEARCH_ID = 'consultant-client-search';
const NOTICE_ICON_SIZE = 16;
const EMPTY_ICON_SIZE = 40;
const CLIENT_FILTER_ORDER = Object.values(CONSULTANT_CLIENT_STATUS_FILTER);
const MAPPINGS_ITEM_KEYS = Object.freeze(['mappings', 'content', 'items', 'data']);

/**
 * 매핑 API 행 → 카드용 내담자 모델.
 * status = mapping.status 그대로 (client.status·시뮬레이션 금지).
 *
 * @param {object} item
 * @returns {object|null}
 */
const mapMappingItemToClient = (item) => {
  if (!item || !item.client) {
    return null;
  }
  const mappingStatus = item.status != null
    ? String(item.status)
    : CONSULTANT_CLIENT_STATUS_FILTER.ACTIVE;
  return {
    id: item.mappingId || item.id,
    clientId: item.client.id,
    name: item.client.name,
    email: item.client.email,
    phone: item.client.phone,
    status: mappingStatus,
    createdAt: item.assignedAt || item.client.createdAt || null,
    profileImage: item.client.profileImage || null,
    remainingSessions: item.remainingSessions,
    totalSessions: item.totalSessions,
    usedSessions: item.usedSessions,
    packageName: item.packageName,
    lastSessionDate: item.lastSessionDate
      || item.lastConsultationDate
      || item.client.lastSessionDate
      || null,
    paymentStatus: item.paymentStatus,
    mappingId: item.id
  };
};

const ConsultantClientList = () => {
  const { t } = useTranslation(CONSULTANT_SUITE_NS);
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const { id: clientIdFromUrl } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(CONSULTANT_CLIENT_STATUS_FILTER.ALL);
  const [statusCounts, setStatusCounts] = useState({ ALL: 0 });
  const isModalOpeningRef = useRef(false);

  const loadClients = useCallback(async() => {
    if (!user?.id) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await fetchConsultantSuitePagedList(
        `/api/v1/admin/mappings/consultant/${user.id}/clients`,
        {},
        {
          page: toServerPageIndex(page),
          size: CONSULTANT_SUITE_PAGE_SIZE,
          itemKeys: MAPPINGS_ITEM_KEYS
        }
      );
      const clientList = (result.items || [])
        .map(mapMappingItemToClient)
        .filter(Boolean);
      setClients(clientList);
      setTotalElements(result.totalElements != null ? result.totalElements : clientList.length);

      // 상태 칩 건수: 현재 페이지 기준(서버 all-status facet 없음). ALL 은 totalElements.
      const counts = { ALL: result.totalElements != null ? result.totalElements : clientList.length };
      CLIENT_FILTER_ORDER.forEach((key) => {
        if (key === CONSULTANT_CLIENT_STATUS_FILTER.ALL) {
          return;
        }
        counts[key] = clientList.filter((c) => c.status === key).length;
      });
      setStatusCounts(counts);
    } catch (err) {
      console.error('❌ 내담자 목록 로드 중 오류:', err);
      setError(t('clients.loadError'));
      setClients([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id, page, t]);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadClients();
    }
  }, [isLoggedIn, user?.id, loadClients]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchTerm]);

  useEffect(() => {
    if (clientIdFromUrl && clients.length > 0 && !isModalOpeningRef.current) {
      const client = clients.find((c) => c.clientId === Number.parseInt(clientIdFromUrl, 10));
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
      const q = searchTerm.toLowerCase();
      result = result.filter((client) => (
        client.name?.toLowerCase().includes(q)
        || client.email?.toLowerCase().includes(q)
        || client.phone?.includes(searchTerm)
      ));
    }
    if (filterStatus !== CONSULTANT_CLIENT_STATUS_FILTER.ALL) {
      result = result.filter((client) => client.status === filterStatus);
    }
    return result;
  }, [clients, searchTerm, filterStatus]);

  const totalPages = Math.max(1, Math.ceil((totalElements || 0) / CONSULTANT_SUITE_PAGE_SIZE));

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

  const handleSaveClient = async(updatedData) => {
    try {
      const response = await apiPost(`/api/users/${selectedClient.id}/profile`, updatedData);
      if (response && response.success !== false) {
        setClients((prevClients) => prevClients.map((client) => (
          client.id === selectedClient.id ? { ...client, ...updatedData } : client
        )));
        handleCloseModal();
      } else {
        notificationManager.show(`내담자 정보 저장에 실패했습니다: ${response?.message || '알 수 없는 오류'}`, 'error');
      }
    } catch (err) {
      notificationManager.show(`내담자 정보 저장 중 오류가 발생했습니다: ${err.message}`, 'error');
    }
  };

  const statusLabel = (key) => {
    const i18nKey = `clients.status.${key}`;
    const label = t(i18nKey);
    return label === i18nKey ? key : label;
  };

  const filterItems = CLIENT_FILTER_ORDER.map((key) => ({
    key,
    label: t('clients.filterLabel', {
      label: statusLabel(key),
      count: statusCounts[key] || 0
    })
  }));

  const formatRecentDate = (value) => {
    if (!value) {
      return null;
    }
    if (typeof value === 'string') {
      return value.split('T')[0];
    }
    return String(value);
  };

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
      const hasClients = clients.length > 0 || totalElements > 0;
      return (
        <section className={CONSULTANT_SUITE_CLASS.PANEL} role="status" aria-live="polite">
          <EmptyState
            className={CONSULTANT_SUITE_CLASS.EMPTY}
            icon={<Users size={EMPTY_ICON_SIZE} aria-hidden />}
            title={hasClients
              ? t('clients.filterEmptyTitle', { label: statusLabel(filterStatus) })
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
      <>
        <section className={CONSULTANT_SUITE_CLASS.CARD_GRID} aria-label={t('clients.listAria')}>
          {filteredClients.map((client) => {
            const recent = formatRecentDate(client.lastSessionDate);
            return (
              <ConsultantSuiteCard
                key={client.id}
                onClick={() => handleViewClient(client)}
                avatar={toConsultantSuiteAvatarInitials(client.name)}
                pill={<ConsultantSuitePill>{statusLabel(client.status)}</ConsultantSuitePill>}
                title={client.name}
                meta={(
                  <>
                    <SafeText>
                      {recent
                        ? t('clients.recentConsultation', { date: recent })
                        : t('clients.recentConsultationDash')}
                    </SafeText>
                    <SafeText>
                      {t('clients.totalSessions', { count: Number(client.totalSessions) || 0 })}
                    </SafeText>
                    {client.packageName ? (
                      <SafeText>{t('clients.packageName', { name: client.packageName })}</SafeText>
                    ) : null}
                  </>
                )}
              />
            );
          })}
        </section>
        {totalElements > CONSULTANT_SUITE_PAGE_SIZE ? (
          <nav className={CONSULTANT_SUITE_CLASS.PAGINATION} aria-label={t('clients.listAria')}>
            <MGPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalElements}
              itemsPerPage={CONSULTANT_SUITE_PAGE_SIZE}
              onPageChange={setPage}
              showInfo={false}
              showItemsPerPage={false}
              variant="compact"
            />
          </nav>
        ) : null}
      </>
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
          onChange={setFilterStatus}
          ariaLabel={t('clients.filterAria')}
          testIdPrefix="consultant-clients-filter"
        />
      </div>
      {renderList()}
    </>
  );
};

export default ConsultantClientList;
